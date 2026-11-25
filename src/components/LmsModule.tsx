import React, { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Lock,
  Plus,
  Send,
  Upload,
  Video,
  X,
} from 'lucide-react';
import {
  AcademyDatabase,
  Assignment,
  AssignmentSubmission,
  AttendanceSession,
  AttendanceStatus,
  Examination,
  GradeRecord,
  LearningMaterial,
  MaterialType,
  ModuleKey,
  PermissionAction,
  UserAccount,
} from '../types/database';
import {
  calculateStudentProgress,
  canAccessZoomLink,
  gradeExamAttempt,
  hasPermission,
} from '../utils/academicLogic';

interface LmsModuleProps {
  db: AcademyDatabase;
  currentUser: UserAccount;
  initialTab?:
    | 'materials'
    | 'zoom'
    | 'attendance'
    | 'assignments'
    | 'exams'
    | 'progress';
  onMutate: (params: {
    moduleKey: ModuleKey;
    action: PermissionAction;
    actionLabel: string;
    targetDescription: string;
    updater: (prev: AcademyDatabase) => AcademyDatabase;
  }) => Promise<void>;
  onUploadFile: (file: File) => Promise<{
    fileUrl: string;
    fileName: string;
    fileSizeKb: number;
  } | null>;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export function LmsModule({
  db,
  currentUser,
  initialTab = 'materials',
  onMutate,
  onUploadFile,
  onNotify,
}: LmsModuleProps) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const currentStudent = db.students.find((s) => s.userId === currentUser.id);
  const currentTeacher = db.teachers.find((t) => t.userId === currentUser.id);

  const visibleClasses = db.classes.filter((cls) => {
    if (
      currentUser.role === 'super_admin' ||
      currentUser.role === 'admin_akademik'
    ) {
      return true;
    }
    if (currentUser.role === 'pengajar' && currentTeacher) {
      return cls.teacherId === currentTeacher.id;
    }
    if (currentUser.role === 'santri' && currentStudent) {
      return cls.studentIds.includes(currentStudent.id);
    }
    return true;
  });

  const [selectedClassId, setSelectedClassId] = useState<string>(
    visibleClasses[0]?.id || db.classes[0]?.id || ''
  );

  const canManageLms =
    currentUser.role === 'super_admin' ||
    currentUser.role === 'admin_akademik' ||
    currentUser.role === 'pengajar';

  // Material Form State
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [matForm, setMatForm] = useState({
    classId: selectedClassId || db.classes[0]?.id || '',
    title: '',
    description: '',
    type: 'PDF' as MaterialType,
    fileUrl: '',
    fileName: '',
    fileSizeKb: 0,
    textContent: '',
  });
  const [isUploading, setIsUploading] = useState(false);

  // Zoom Edit State
  const [editingZoomClassId, setEditingZoomClassId] = useState<string | null>(
    null
  );
  const [zoomForm, setZoomForm] = useState({
    zoomLink: '',
    zoomMeetingId: '',
    zoomPasscode: '',
    zoomNotes: '',
  });

  // Attendance Session Form
  const [newAttTopic, setNewAttTopic] = useState('');
  const [newAttDate, setNewAttDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  // Assignment Form & Submission State
  const [isAddAsgOpen, setIsAddAsgOpen] = useState(false);
  const [asgForm, setAsgForm] = useState({
    title: '',
    instructions: '',
    dueDate: '2026-12-10',
    maxScore: 100,
  });
  const [submissionDrafts, setSubmissionDrafts] = useState<
    Record<string, string>
  >({});
  const [gradingDrafts, setGradingDrafts] = useState<
    Record<string, { score: number; feedback: string }>
  >({});

  // Interactive Exam Taking State
  const [takingExam, setTakingExam] = useState<Examination | null>(null);
  const [examAnswers, setExamAnswers] = useState<Record<string, string | number>>(
    {}
  );

  const activeClass =
    db.classes.find((c) => c.id === selectedClassId) || visibleClasses[0];

  const handleMaterialFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const uploaded = await onUploadFile(file);
      if (uploaded) {
        setMatForm((prev) => ({
          ...prev,
          fileUrl: uploaded.fileUrl,
          fileName: uploaded.fileName,
          fileSizeKb: uploaded.fileSizeKb,
        }));
        onNotify(
          `File "${uploaded.fileName}" berhasil diunggah ke storage.`,
          'success'
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matForm.title.trim()) {
      onNotify('Judul materi wajib diisi.', 'error');
      return;
    }
    if (
      matForm.type === 'External URL' &&
      matForm.fileUrl &&
      !matForm.fileUrl.startsWith('http://') &&
      !matForm.fileUrl.startsWith('https://')
    ) {
      onNotify('URL eksternal wajib diawali http:// atau https://', 'error');
      return;
    }

    const classMats = db.materials.filter((m) => m.classId === matForm.classId);
    const newMat: LearningMaterial = {
      id: `mat-${Date.now()}`,
      classId: matForm.classId || activeClass?.id || 'cls-nahwu-a',
      orderIndex: classMats.length + 1,
      title: matForm.title.trim(),
      description: matForm.description.trim(),
      type: matForm.type,
      fileUrl: matForm.fileUrl.trim(),
      fileName: matForm.fileName || undefined,
      fileSizeKb: matForm.fileSizeKb || undefined,
      externalUrl:
        matForm.type === 'External URL' ? matForm.fileUrl.trim() : undefined,
      textContent: matForm.textContent.trim() || undefined,
      accessScope: 'Enrolled Only',
      distributionRight: 'Permission Documented',
      uploadedBy: currentUser.fullName,
      uploadedAt: new Date().toISOString().slice(0, 10),
      completedByStudentIds: [],
    };

    await onMutate({
      moduleKey: 'lms',
      action: 'create',
      actionLabel: 'MENAMBAH_MATERI_KELAS',
      targetDescription: `Menambahkan materi "${newMat.title}" pada kelas`,
      updater: (prev) => ({
        ...prev,
        materials: [...prev.materials, newMat],
      }),
    });

    setIsMaterialModalOpen(false);
    setMatForm({
      classId: selectedClassId,
      title: '',
      description: '',
      type: 'PDF',
      fileUrl: '',
      fileName: '',
      fileSizeKb: 0,
      textContent: '',
    });
    onNotify('Materi pembelajaran berhasil ditambahkan dan disinkronkan.', 'success');
  };

  const handleToggleMaterialCompletion = async (mat: LearningMaterial) => {
    const studentId = currentStudent?.id || 'std-1';
    const isDone = mat.completedByStudentIds.includes(studentId);
    const nextIds = isDone
      ? mat.completedByStudentIds.filter((id) => id !== studentId)
      : [...mat.completedByStudentIds, studentId];

    await onMutate({
      moduleKey: 'lms',
      action: 'create',
      actionLabel: 'PROGRES_MATERI_SANTRI',
      targetDescription: `${isDone ? 'Membatalkan status selesai' : 'Menyelesaikan'} materi "${mat.title}"`,
      updater: (prev) => ({
        ...prev,
        materials: prev.materials.map((m) =>
          m.id === mat.id ? { ...m, completedByStudentIds: nextIds } : m
        ),
      }),
    });
    onNotify(
      isDone
        ? 'Status selesai materi dibatalkan.'
        : 'Alhamdulillah, materi ditandai selesai dipelajari!',
      'success'
    );
  };

  const handleSaveZoom = async (classId: string) => {
    if (
      zoomForm.zoomLink &&
      !zoomForm.zoomLink.startsWith('http://') &&
      !zoomForm.zoomLink.startsWith('https://')
    ) {
      onNotify('Link Zoom harus berupa URL HTTP/HTTPS yang valid.', 'error');
      return;
    }

    await onMutate({
      moduleKey: 'lms',
      action: 'edit',
      actionLabel: 'MEMPERBARUI_LINK_ZOOM',
      targetDescription: `Memperbarui konfigurasi Zoom kelas ${classId}`,
      updater: (prev) => ({
        ...prev,
        classes: prev.classes.map((c) =>
          c.id === classId
            ? {
                ...c,
                zoomLink: zoomForm.zoomLink.trim(),
                zoomMeetingId: zoomForm.zoomMeetingId.trim(),
                zoomPasscode: zoomForm.zoomPasscode.trim(),
                zoomNotes: zoomForm.zoomNotes.trim(),
              }
            : c
        ),
      }),
    });
    setEditingZoomClassId(null);
    onNotify('Tautan Zoom dan Passcode kelas berhasil diperbarui.', 'success');
  };

  const handleCreateAttendanceSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass || !newAttTopic.trim()) {
      onNotify('Topik pertemuan absensi wajib diisi.', 'error');
      return;
    }
    const initialRecords: Record<string, AttendanceStatus> = {};
    activeClass.studentIds.forEach((sid) => {
      initialRecords[sid] = 'Present';
    });

    const newSession: AttendanceSession = {
      id: `att-${Date.now()}`,
      classId: activeClass.id,
      date: newAttDate,
      topic: newAttTopic.trim(),
      createdBy: currentTeacher?.id || currentUser.id,
      records: initialRecords,
    };

    await onMutate({
      moduleKey: 'lms',
      action: 'create',
      actionLabel: 'MEMBUAT_SESI_ABSENSI',
      targetDescription: `Membuat sesi absensi "${newSession.topic}" (${activeClass.name})`,
      updater: (prev) => ({
        ...prev,
        attendanceSessions: [newSession, ...prev.attendanceSessions],
      }),
    });
    setNewAttTopic('');
    onNotify('Sesi pertemuan absensi baru berhasil dibuat.', 'success');
  };

  const handleUpdateAttendanceRecord = async (
    sessionId: string,
    studentId: string,
    status: AttendanceStatus
  ) => {
    await onMutate({
      moduleKey: 'lms',
      action: 'edit',
      actionLabel: 'MENGISI_ABSENSI_SANTRI',
      targetDescription: `Memperbarui status kehadiran santri ${studentId} menjadi ${status}`,
      updater: (prev) => ({
        ...prev,
        attendanceSessions: prev.attendanceSessions.map((s) =>
          s.id === sessionId
            ? { ...s, records: { ...s.records, [studentId]: status } }
            : s
        ),
      }),
    });
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass || !asgForm.title.trim()) {
      onNotify('Judul tugas wajib diisi.', 'error');
      return;
    }
    const newAsg: Assignment = {
      id: `asg-${Date.now()}`,
      classId: activeClass.id,
      title: asgForm.title.trim(),
      instructions: asgForm.instructions.trim(),
      dueDate: asgForm.dueDate,
      maxScore: Number(asgForm.maxScore) || 100,
      createdBy: currentUser.fullName,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    await onMutate({
      moduleKey: 'lms',
      action: 'create',
      actionLabel: 'MEMBUAT_TUGAS_KELAS',
      targetDescription: `Membuat tugas baru "${newAsg.title}"`,
      updater: (prev) => ({
        ...prev,
        assignments: [newAsg, ...prev.assignments],
      }),
    });
    setIsAddAsgOpen(false);
    setAsgForm({ title: '', instructions: '', dueDate: '2026-12-10', maxScore: 100 });
    onNotify('Tugas baru berhasil diterbitkan.', 'success');
  };

  const handleSubmitAssignment = async (assignment: Assignment) => {
    const answerText = (submissionDrafts[assignment.id] || '').trim();
    if (!answerText) {
      onNotify('Tuliskan jawaban tugas Anda terlebih dahulu.', 'error');
      return;
    }
    const studentId = currentStudent?.id || 'std-1';
    const newSub: AssignmentSubmission = {
      id: `sub-${Date.now()}`,
      assignmentId: assignment.id,
      studentId,
      answerText,
      submittedAt: new Date().toISOString(),
      status: 'Submitted',
    };

    await onMutate({
      moduleKey: 'lms',
      action: 'create',
      actionLabel: 'MENGUMPULKAN_TUGAS',
      targetDescription: `Mengumpulkan jawaban tugas "${assignment.title}"`,
      updater: (prev) => ({
        ...prev,
        submissions: [
          ...prev.submissions.filter(
            (s) =>
              !(
                s.assignmentId === assignment.id && s.studentId === studentId
              )
          ),
          newSub,
        ],
      }),
    });
    onNotify('Jawaban tugas berhasil dikirim ke pengajar.', 'success');
  };

  const handleGradeSubmission = async (
    sub: AssignmentSubmission,
    asg: Assignment
  ) => {
    const draft = gradingDrafts[sub.id] || {
      score: sub.score ?? 90,
      feedback: sub.teacherFeedback ?? 'Mumtaz, pertahankan ketelitian i’rab.',
    };

    const newGrade: GradeRecord = {
      id: `grd-${Date.now()}`,
      studentId: sub.studentId,
      classId: asg.classId,
      componentType: 'Assignment',
      referenceId: asg.id,
      title: asg.title,
      score: Number(draft.score),
      maxScore: asg.maxScore,
      gradedAt: new Date().toISOString().slice(0, 10),
      gradedBy: currentUser.fullName,
    };

    await onMutate({
      moduleKey: 'lms',
      action: 'edit',
      actionLabel: 'MENILAI_TUGAS_SANTRI',
      targetDescription: `Memberikan nilai ${draft.score}/${asg.maxScore} pada tugas "${asg.title}"`,
      updater: (prev) => ({
        ...prev,
        submissions: prev.submissions.map((s) =>
          s.id === sub.id
            ? {
                ...s,
                status: 'Reviewed',
                score: Number(draft.score),
                teacherFeedback: draft.feedback,
                reviewedBy: currentUser.fullName,
              }
            : s
        ),
        grades: [
          ...prev.grades.filter(
            (g) =>
              !(
                g.studentId === sub.studentId &&
                g.referenceId === asg.id &&
                g.componentType === 'Assignment'
              )
          ),
          newGrade,
        ],
      }),
    });
    onNotify('Nilai dan catatan koreksi tugas berhasil disimpan.', 'success');
  };

  const handleSubmitExamAttempt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!takingExam) return;
    const studentId = currentStudent?.id || 'std-1';
    const result = gradeExamAttempt(takingExam, examAnswers);
    const essayScoreDefault = result.hasEssay ? 25 : 0;
    const totalScore = result.objectiveScore + essayScoreDefault;

    const newGrade: GradeRecord = {
      id: `grd-ex-${Date.now()}`,
      studentId,
      classId: takingExam.classId,
      componentType: 'Examination',
      referenceId: takingExam.id,
      title: takingExam.title,
      score: totalScore,
      maxScore: takingExam.maxScore,
      gradedAt: new Date().toISOString().slice(0, 10),
      gradedBy: 'Sistem Evaluasi LMS & Pengajar',
    };

    await onMutate({
      moduleKey: 'lms',
      action: 'create',
      actionLabel: 'MENYELESAIKAN_UJIAN',
      targetDescription: `Menyelesaikan ujian "${takingExam.title}" (Skor Objektif: ${result.objectiveScore})`,
      updater: (prev) => ({
        ...prev,
        examAttempts: [
          ...prev.examAttempts,
          {
            id: `att-ex-${Date.now()}`,
            examId: takingExam.id,
            studentId,
            answers: examAnswers,
            objectiveScore: result.objectiveScore,
            essayScore: essayScoreDefault,
            totalScore,
            gradingStatus: result.gradingStatus,
            submittedAt: new Date().toISOString(),
          },
        ],
        grades: [
          ...prev.grades.filter(
            (g) =>
              !(
                g.studentId === studentId &&
                g.referenceId === takingExam.id &&
                g.componentType === 'Examination'
              )
          ),
          newGrade,
        ],
      }),
    });

    setTakingExam(null);
    setExamAnswers({});
    onNotify(
      `Ujian selesai! Skor objektif otomatis Anda: ${result.objectiveScore} poin.`,
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {/* LMS Top Control Bar */}
      <div className="bg-white rounded-xl p-5 border border-[#14283F]/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'materials', label: 'Materi & Katalog Belajar' },
            { id: 'zoom', label: 'Zoom Meeting Halaqah' },
            { id: 'attendance', label: 'Absensi Pertemuan' },
            { id: 'assignments', label: 'Tugas & Pemeriksaan' },
            { id: 'exams', label: 'Ujian & Penilaian' },
            { id: 'progress', label: 'Progres & Rekap Nilai' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#087451] text-white'
                  : 'bg-[#F5F0E4]/60 text-[#14283F]/75 hover:text-[#14283F]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Class Selector */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="lms-class-select"
            className="text-xs font-semibold text-[#14283F]/70 whitespace-nowrap"
          >
            Pilih Kelas:
          </label>
          <select
            id="lms-class-select"
            value={activeClass?.id || ''}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-[#14283F]/20 bg-white text-[#14283F]"
          >
            {visibleClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.code} — {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB 1: LEARNING MATERIALS */}
      {activeTab === 'materials' && activeClass && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 border border-[#14283F]/10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-[#087451] font-semibold">
                Ruang Belajar Halaqah · {activeClass.code}
              </div>
              <h3 className="text-base font-bold text-[#14283F]">
                {activeClass.name}
              </h3>
              <p className="text-xs text-[#14283F]/70 mt-0.5">
                Jadwal: {activeClass.scheduleSummary} · Pengajar:{' '}
                {db.teachers.find((t) => t.id === activeClass.teacherId)
                  ?.fullName || 'Asatidzah'}
              </p>
            </div>
            {canManageLms && (
              <button
                type="button"
                onClick={() => {
                  setMatForm((prev) => ({ ...prev, classId: activeClass.id }));
                  setIsMaterialModalOpen(true);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#087451] hover:bg-[#065d40] rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Tambah Materi / Upload Dokumen
              </button>
            )}
          </div>

          <div className="space-y-3">
            {db.materials
              .filter((m) => m.classId === activeClass.id)
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((mat) => {
                const studentId = currentStudent?.id || 'std-1';
                const isCompleted =
                  mat.completedByStudentIds.includes(studentId);

                return (
                  <div
                    key={mat.id}
                    className="bg-white rounded-xl p-5 border border-[#14283F]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2 text-xs text-[#14283F]/65">
                        <span className="font-mono-num font-semibold text-[#087451]">
                          Urutan #{mat.orderIndex}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Tipe: {mat.type}</span>
                        <span aria-hidden="true">·</span>
                        <span>Hak: {mat.distributionRight}</span>
                        {mat.fileSizeKb && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-num">
                              {mat.fileSizeKb} KB
                            </span>
                          </>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-[#14283F]">
                        {mat.title}
                      </h4>
                      <p className="text-xs text-[#14283F]/75 leading-relaxed">
                        {mat.description}
                      </p>
                      {mat.textContent && (
                        <div
                          className="mt-2 p-3 rounded-lg bg-[#F5F0E4]/60 border border-[#C5A45B]/30 font-arabic text-base text-[#14283F]"
                          dir="rtl"
                        >
                          {mat.textContent}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {(mat.fileUrl || mat.externalUrl) && (
                        <a
                          href={mat.externalUrl || mat.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 text-xs font-semibold text-[#14283F] bg-[#F5F0E4] hover:bg-[#C5A45B]/25 rounded-lg flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#087451]" />
                          Buka Materi
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleMaterialCompletion(mat)}
                        className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                          isCompleted
                            ? 'bg-[#087451] text-white'
                            : 'border border-[#14283F]/20 text-[#14283F] hover:bg-[#F5F0E4]'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isCompleted ? 'Selesai Dipelajari' : 'Tandai Selesai'}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 2: ZOOM INTEGRATION & ACCESS PROTECTION */}
      {activeTab === 'zoom' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {db.classes.map((cls) => {
            const allowedZoom = canAccessZoomLink(
              currentUser,
              cls,
              currentStudent?.id,
              currentTeacher?.id
            );
            const isEditing = editingZoomClassId === cls.id;

            return (
              <div
                key={cls.id}
                className="bg-white rounded-xl p-5 border border-[#14283F]/10 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#14283F]/60 mb-1">
                    <span className="font-mono-num font-semibold text-[#087451]">
                      {cls.code}
                    </span>
                    <span>{cls.scheduleSummary}</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#14283F]">{cls.name}</h4>
                  <p className="text-xs text-[#14283F]/70 mt-1">
                    Pengajar:{' '}
                    {db.teachers.find((t) => t.id === cls.teacherId)?.fullName}
                  </p>
                </div>

                {isEditing ? (
                  <div className="space-y-3 pt-3 border-t border-[#14283F]/10 text-xs">
                    <div>
                      <label className="block font-semibold mb-1">
                        URL Zoom Meeting (HTTPS)
                      </label>
                      <input
                        type="url"
                        value={zoomForm.zoomLink}
                        onChange={(e) =>
                          setZoomForm({ ...zoomForm, zoomLink: e.target.value })
                        }
                        className="w-full px-3 py-1.5 rounded border border-[#14283F]/20"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold mb-1">
                          Meeting ID
                        </label>
                        <input
                          type="text"
                          value={zoomForm.zoomMeetingId}
                          onChange={(e) =>
                            setZoomForm({
                              ...zoomForm,
                              zoomMeetingId: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 rounded border border-[#14283F]/20 font-mono-num"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">
                          Passcode
                        </label>
                        <input
                          type="text"
                          value={zoomForm.zoomPasscode}
                          onChange={(e) =>
                            setZoomForm({
                              ...zoomForm,
                              zoomPasscode: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 rounded border border-[#14283F]/20 font-mono-num"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">
                        Catatan Kelas
                      </label>
                      <input
                        type="text"
                        value={zoomForm.zoomNotes}
                        onChange={(e) =>
                          setZoomForm({ ...zoomForm, zoomNotes: e.target.value })
                        }
                        className="w-full px-3 py-1.5 rounded border border-[#14283F]/20"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingZoomClassId(null)}
                        className="px-3 py-1.5 rounded border border-[#14283F]/20 font-semibold"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveZoom(cls.id)}
                        className="px-3.5 py-1.5 rounded bg-[#087451] text-white font-semibold"
                      >
                        Simpan Link Zoom
                      </button>
                    </div>
                  </div>
                ) : allowedZoom ? (
                  <div className="p-3.5 rounded-lg bg-[#F5F0E4]/65 border border-[#C5A45B]/35 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-mono-num">
                      <span>Meeting ID: <strong>{cls.zoomMeetingId}</strong></span>
                      <span>Passcode: <strong>{cls.zoomPasscode}</strong></span>
                    </div>
                    <p className="text-[#14283F]/75">{cls.zoomNotes}</p>
                    <div className="flex items-center justify-between pt-2">
                      <a
                        href={cls.zoomLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-xs font-semibold text-white bg-[#087451] hover:bg-[#065d40] rounded-lg flex items-center gap-1.5"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Masuk Kelas Zoom
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      {canManageLms && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingZoomClassId(cls.id);
                            setZoomForm({
                              zoomLink: cls.zoomLink,
                              zoomMeetingId: cls.zoomMeetingId,
                              zoomPasscode: cls.zoomPasscode,
                              zoomNotes: cls.zoomNotes,
                            });
                          }}
                          className="text-xs font-semibold text-[#14283F] hover:underline"
                        >
                          Atur Tautan Zoom
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg bg-[#F5F0E4]/40 border border-[#14283F]/10 flex items-center gap-2.5 text-xs text-[#14283F]/70">
                    <Lock className="w-4 h-4 text-[#C5A45B] shrink-0" />
                    <span>
                      Tautan Zoom dibatasi hanya untuk santri yang terdaftar resmi pada kelas ini (Section 8.4 & 15.7).
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: ATTENDANCE MANAGEMENT */}
      {activeTab === 'attendance' && activeClass && (
        <div className="space-y-5">
          {canManageLms && (
            <form
              onSubmit={handleCreateAttendanceSession}
              className="bg-white rounded-xl p-5 border border-[#14283F]/10 flex flex-col sm:flex-row items-end gap-3 text-xs"
            >
              <div className="flex-1 w-full">
                <label className="block font-semibold mb-1">
                  Topik Pertemuan Baru ({activeClass.name})
                </label>
                <input
                  type="text"
                  required
                  value={newAttTopic}
                  onChange={(e) => setNewAttTopic(e.target.value)}
                  placeholder="Contoh: Pertemuan 13 — Bab Marfu’atul Asma’ (Al-Fa’il)"
                  className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Tanggal</label>
                <input
                  type="date"
                  value={newAttDate}
                  onChange={(e) => setNewAttDate(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#14283F]/20 font-mono-num"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#087451] hover:bg-[#065d40] rounded-lg whitespace-nowrap"
              >
                + Buat Sesi Absensi
              </button>
            </form>
          )}

          <div className="space-y-4">
            {db.attendanceSessions
              .filter((s) => s.classId === activeClass.id)
              .map((session) => (
                <div
                  key={session.id}
                  className="bg-white rounded-xl p-5 border border-[#14283F]/10 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[#14283F]/10 pb-3">
                    <div>
                      <span className="text-xs font-mono-num text-[#087451] font-semibold">
                        {session.date}
                      </span>
                      <h4 className="text-sm font-bold text-[#14283F]">
                        {session.topic}
                      </h4>
                    </div>
                    <span className="text-xs text-[#14283F]/60 font-mono-num">
                      {Object.keys(session.records).length} Santri Terdaftar
                    </span>
                  </div>

                  <div className="divide-y divide-[#14283F]/10 text-xs">
                    {activeClass.studentIds.map((sid) => {
                      const st = db.students.find((s) => s.id === sid);
                      if (!st) return null;
                      if (
                        currentUser.role === 'santri' &&
                        currentStudent &&
                        currentStudent.id !== sid
                      ) {
                        return null;
                      }
                      const currentStatus = session.records[sid] || 'Present';

                      return (
                        <div
                          key={sid}
                          className="py-2.5 flex items-center justify-between gap-4"
                        >
                          <div>
                            <span className="font-semibold text-[#14283F]">
                              {st.fullName}
                            </span>{' '}
                            <span className="text-[#14283F]/60 font-mono-num">
                              ({st.nis})
                            </span>
                          </div>

                          {canManageLms ? (
                            <div className="flex items-center gap-1.5">
                              {(
                                ['Present', 'Late', 'Excused', 'Absent'] as const
                              ).map((stOption) => (
                                <button
                                  key={stOption}
                                  type="button"
                                  onClick={() =>
                                    handleUpdateAttendanceRecord(
                                      session.id,
                                      sid,
                                      stOption
                                    )
                                  }
                                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                    currentStatus === stOption
                                      ? 'bg-[#087451] text-white'
                                      : 'bg-[#F5F0E4] text-[#14283F]/75 hover:text-[#14283F]'
                                  }`}
                                >
                                  {stOption}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="font-semibold text-[#087451]">
                              Status: {currentStatus}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 4: ASSIGNMENTS & SUBMISSIONS */}
      {activeTab === 'assignments' && activeClass && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#14283F]">
              Daftar Tugas & Tathbiq ({activeClass.name})
            </h3>
            {canManageLms && (
              <button
                type="button"
                onClick={() => setIsAddAsgOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#087451] rounded-lg"
              >
                + Buat Tugas Baru
              </button>
            )}
          </div>

          {isAddAsgOpen && (
            <form
              onSubmit={handleCreateAssignment}
              className="bg-white rounded-xl p-5 border border-[#C5A45B]/40 space-y-3 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Judul Tugas *</label>
                  <input
                    type="text"
                    required
                    value={asgForm.title}
                    onChange={(e) =>
                      setAsgForm({ ...asgForm, title: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tenggat Waktu</label>
                  <input
                    type="date"
                    value={asgForm.dueDate}
                    onChange={(e) =>
                      setAsgForm({ ...asgForm, dueDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 font-mono-num"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Instruksi Pengerjaan
                </label>
                <textarea
                  rows={2}
                  value={asgForm.instructions}
                  onChange={(e) =>
                    setAsgForm({ ...asgForm, instructions: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAsgOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#14283F]/20 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#087451] text-white font-semibold"
                >
                  Terbitkan Tugas
                </button>
              </div>
            </form>
          )}

          {db.assignments
            .filter((a) => a.classId === activeClass.id)
            .map((asg) => {
              const studentId = currentStudent?.id || 'std-1';
              const mySub = db.submissions.find(
                (s) => s.assignmentId === asg.id && s.studentId === studentId
              );
              const allSubs = db.submissions.filter(
                (s) => s.assignmentId === asg.id
              );

              return (
                <div
                  key={asg.id}
                  className="bg-white rounded-xl p-5 border border-[#14283F]/10 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-xs text-[#14283F]/60 font-mono-num">
                        Tenggat: {asg.dueDate} · Nilai Maksimal: {asg.maxScore}
                      </div>
                      <h4 className="text-sm font-bold text-[#14283F] mt-0.5">
                        {asg.title}
                      </h4>
                      <p className="text-xs text-[#14283F]/75 mt-1">
                        {asg.instructions}
                      </p>
                    </div>
                  </div>

                  {/* Student Submission Box */}
                  <div className="p-4 rounded-lg bg-[#F5F0E4]/50 border border-[#14283F]/10 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#14283F]">
                        Jawaban Santri ({currentStudent?.fullName || 'Santri Demo'})
                      </span>
                      <span className="font-semibold text-[#087451]">
                        Status: {mySub?.status || 'Not Submitted'}
                        {mySub?.score !== undefined &&
                          ` · Nilai: ${mySub.score}/${asg.maxScore}`}
                      </span>
                    </div>

                    {mySub?.teacherFeedback && (
                      <div className="p-2.5 rounded bg-white border border-[#C5A45B]/40 text-[#14283F]">
                        <strong>Komentar & Koreksi Pengajar:</strong>{' '}
                        {mySub.teacherFeedback}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        aria-label={`Jawaban untuk ${asg.title}`}
                        value={
                          submissionDrafts[asg.id] ?? mySub?.answerText ?? ''
                        }
                        onChange={(e) =>
                          setSubmissionDrafts({
                            ...submissionDrafts,
                            [asg.id]: e.target.value,
                          })
                        }
                        placeholder="Tuliskan jawaban uraian i’rab atau tautan dokumen tugas Anda..."
                        className="flex-1 px-3 py-2 rounded-lg border border-[#14283F]/20 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleSubmitAssignment(asg)}
                        className="px-4 py-2 rounded-lg bg-[#087451] text-white font-semibold flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Kirim Jawaban
                      </button>
                    </div>
                  </div>

                  {/* Teacher Grading Section */}
                  {canManageLms && allSubs.length > 0 && (
                    <div className="pt-3 border-t border-[#14283F]/10 space-y-2.5 text-xs">
                      <div className="font-semibold text-[#14283F]">
                        Pemeriksaan Jawaban Santri ({allSubs.length} Kiriman):
                      </div>
                      {allSubs.map((sub) => {
                        const st = db.students.find(
                          (s) => s.id === sub.studentId
                        );
                        const draft = gradingDrafts[sub.id] || {
                          score: sub.score ?? 90,
                          feedback:
                            sub.teacherFeedback ??
                            'Jawaban telah diperiksa oleh pengajar.',
                        };

                        return (
                          <div
                            key={sub.id}
                            className="p-3 rounded-lg bg-[#F5F0E4]/35 border border-[#14283F]/10 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <strong>
                                {st?.fullName || sub.studentId} ({st?.nis})
                              </strong>
                              <span className="font-mono-num text-[#14283F]/60">
                                Status: {sub.status}
                              </span>
                            </div>
                            <p className="text-[#14283F]/85 bg-white p-2 rounded border border-[#14283F]/10">
                              {sub.answerText}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                max={asg.maxScore}
                                aria-label="Nilai tugas"
                                value={draft.score}
                                onChange={(e) =>
                                  setGradingDrafts({
                                    ...gradingDrafts,
                                    [sub.id]: {
                                      ...draft,
                                      score: Number(e.target.value),
                                    },
                                  })
                                }
                                className="w-20 px-2.5 py-1.5 rounded border border-[#14283F]/20 bg-white font-mono-num"
                              />
                              <input
                                type="text"
                                aria-label="Komentar koreksi pengajar"
                                value={draft.feedback}
                                onChange={(e) =>
                                  setGradingDrafts({
                                    ...gradingDrafts,
                                    [sub.id]: {
                                      ...draft,
                                      feedback: e.target.value,
                                    },
                                  })
                                }
                                placeholder="Catatan koreksi pengajar..."
                                className="flex-1 px-2.5 py-1.5 rounded border border-[#14283F]/20 bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => handleGradeSubmission(sub, asg)}
                                className="px-3.5 py-1.5 rounded bg-[#14283F] text-white font-semibold"
                              >
                                Simpan Nilai
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* TAB 5: EXAMINATIONS & GRADING */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          {takingExam ? (
            <form
              onSubmit={handleSubmitExamAttempt}
              className="bg-white rounded-xl p-6 border border-[#C5A45B]/50 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#14283F]/10 pb-4">
                <div>
                  <div className="text-xs text-[#087451] font-semibold">
                    Lembar Imtihan Online · Durasi {takingExam.durationMinutes} Menit
                  </div>
                  <h3 className="text-base font-bold text-[#14283F]">
                    {takingExam.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setTakingExam(null)}
                  className="text-xs font-semibold text-[#14283F]/70 hover:text-[#14283F]"
                >
                  Batal
                </button>
              </div>

              <div className="space-y-5 text-xs">
                {takingExam.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-lg bg-[#F5F0E4]/40 border border-[#14283F]/10 space-y-2.5"
                  >
                    <div className="font-bold text-[#14283F]">
                      Soal {idx + 1} ({q.type === 'objective' ? 'Objektif Pilihan Ganda' : 'Esai Uraian'} ·{' '}
                      {q.points} Poin):
                    </div>
                    <p className="text-sm text-[#14283F]">{q.questionText}</p>
                    {q.type === 'objective' && q.options ? (
                      <div className="space-y-1.5 pt-1">
                        {q.options.map((opt, optIdx) => (
                          <label
                            key={optIdx}
                            className="flex items-center gap-2.5 p-2 rounded bg-white border border-[#14283F]/10 cursor-pointer hover:border-[#087451]"
                          >
                            <input
                              type="radio"
                              name={q.id}
                              checked={examAnswers[q.id] === optIdx}
                              onChange={() =>
                                setExamAnswers({
                                  ...examAnswers,
                                  [q.id]: optIdx,
                                })
                              }
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        rows={3}
                        value={String(examAnswers[q.id] || '')}
                        onChange={(e) =>
                          setExamAnswers({
                            ...examAnswers,
                            [q.id]: e.target.value,
                          })
                        }
                        placeholder="Tuliskan jawaban esai Anda..."
                        className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 bg-white"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-3 border-t border-[#14283F]/10">
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-[#087451] hover:bg-[#065d40] rounded-lg"
                >
                  Kumpulkan Lembar Ujian & Hitung Nilai Otomatis
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {db.examinations.map((exm) => {
                const attempts = db.examAttempts.filter(
                  (a) => a.examId === exm.id
                );
                return (
                  <div
                    key={exm.id}
                    className="bg-white rounded-xl p-5 border border-[#14283F]/10 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="text-xs text-[#087451] font-mono-num font-semibold">
                        Durasi: {exm.durationMinutes} Menit · Maks {exm.maxScore}{' '}
                        Poin · {exm.questions.length} Soal
                      </div>
                      <h4 className="text-base font-bold text-[#14283F] mt-1">
                        {exm.title}
                      </h4>
                      <p className="text-xs text-[#14283F]/75 mt-1">
                        {exm.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#14283F]/10 flex items-center justify-between">
                      <span className="text-xs font-mono-num text-[#14283F]/65">
                        {attempts.length} Peserta telah mengerjakan
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setTakingExam(exm);
                          setExamAnswers({});
                        }}
                        className="px-4 py-2 text-xs font-semibold text-white bg-[#087451] hover:bg-[#065d40] rounded-lg"
                      >
                        Kerjakan Ujian
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: LEARNING PROGRESS & GRADES */}
      {activeTab === 'progress' && (
        <div className="space-y-4">
          {db.students
            .filter((st) =>
              currentUser.role === 'santri' && currentStudent
                ? st.id === currentStudent.id
                : true
            )
            .map((st) => {
              const prog = calculateStudentProgress({
                studentId: st.id,
                enrolledClassIds: st.classIds,
                materials: db.materials,
                assignments: db.assignments,
                submissions: db.submissions,
                attendanceSessions: db.attendanceSessions,
                grades: db.grades,
              });
              const studentGrades = db.grades.filter((g) => g.studentId === st.id);

              return (
                <div
                  key={st.id}
                  className="bg-white rounded-xl p-5 border border-[#14283F]/10 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#14283F]/10 pb-3">
                    <div>
                      <span className="text-xs font-mono-num text-[#087451] font-semibold">
                        {st.nis}
                      </span>
                      <h4 className="text-base font-bold text-[#14283F]">
                        {st.fullName}
                      </h4>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#14283F]/60">
                        Total Progres Akademik Terhitung
                      </div>
                      <div className="text-xl font-bold font-mono-num text-[#087451]">
                        {prog.overallProgressPercent}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-[#F5F0E4]/50">
                      <div className="text-[#14283F]/60">Materi Diselesaikan</div>
                      <div className="text-base font-bold font-mono-num mt-0.5">
                        {prog.completedMaterialsCount}/{prog.totalMaterialsCount} (
                        {prog.materialCompletionPercent}%)
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F5F0E4]/50">
                      <div className="text-[#14283F]/60">Tugas Dikumpulkan</div>
                      <div className="text-base font-bold font-mono-num mt-0.5">
                        {prog.submittedAssignmentsCount}/{prog.totalAssignmentsCount}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F5F0E4]/50">
                      <div className="text-[#14283F]/60">Persentase Kehadiran</div>
                      <div className="text-base font-bold font-mono-num mt-0.5">
                        {prog.attendanceRatePercent}% (
                        {prog.attendancePresentCount}/{prog.totalAttendanceSessions})
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F5F0E4]/50">
                      <div className="text-[#14283F]/60">Nilai Rata-Rata</div>
                      <div className="text-base font-bold font-mono-num mt-0.5 text-[#087451]">
                        {prog.averageScore} / 100
                      </div>
                    </div>
                  </div>

                  {studentGrades.length > 0 && (
                    <div className="text-xs space-y-1.5 pt-2">
                      <div className="font-semibold text-[#14283F]">
                        Transkrip Nilai Tercatat:
                      </div>
                      {studentGrades.map((g) => (
                        <div
                          key={g.id}
                          className="flex items-center justify-between py-1.5 px-3 rounded bg-[#F5F0E4]/35"
                        >
                          <span>
                            {g.componentType}: <strong>{g.title}</strong>
                          </span>
                          <span className="font-mono-num font-bold text-[#087451]">
                            {g.score} / {g.maxScore}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* ADD MATERIAL MODAL */}
      {isMaterialModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#14283F]/65 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-mat-title"
        >
          <div className="bg-white border border-[#C5A45B]/40 rounded-xl max-w-lg w-full overflow-hidden shadow-xl">
            <div className="bg-[#14283F] text-white px-5 py-4 flex items-center justify-between">
              <h3 id="add-mat-title" className="text-sm font-bold">
                Tambah Materi & Unggah Dokumen Kelas
              </h3>
              <button
                type="button"
                onClick={() => setIsMaterialModalOpen(false)}
                aria-label="Tutup modal materi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMaterial} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Judul Materi *</label>
                <input
                  type="text"
                  required
                  value={matForm.title}
                  onChange={(e) =>
                    setMatForm({ ...matForm, title: e.target.value })
                  }
                  placeholder="Contoh: Modul 03: Bab Marfu’atul Asma’"
                  className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Tipe Materi</label>
                <select
                  value={matForm.type}
                  onChange={(e) =>
                    setMatForm({
                      ...matForm,
                      type: e.target.value as MaterialType,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 bg-white"
                >
                  <option value="PDF">PDF</option>
                  <option value="Document">Document</option>
                  <option value="Audio">Audio</option>
                  <option value="Video">Video</option>
                  <option value="External URL">External URL</option>
                  <option value="Text Lesson">Text Lesson</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  value={matForm.description}
                  onChange={(e) =>
                    setMatForm({ ...matForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                />
              </div>

              {matForm.type === 'Text Lesson' ? (
                <div>
                  <label className="block font-semibold mb-1">
                    Naskah Matan / Teks Pelajaran (Mendukung Arab RTL)
                  </label>
                  <textarea
                    rows={3}
                    dir="rtl"
                    value={matForm.textContent}
                    onChange={(e) =>
                      setMatForm({ ...matForm, textContent: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 font-arabic text-base"
                  />
                </div>
              ) : (
                <div className="space-y-2.5 p-3.5 rounded-lg bg-[#F5F0E4]/60 border border-[#C5A45B]/35">
                  <div>
                    <label className="block font-semibold mb-1">
                      Upload File ke Server Storage (PDF/DOCX/MP3/MP4)
                    </label>
                    <input
                      type="file"
                      onChange={handleMaterialFileChange}
                      disabled={isUploading}
                      className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#087451] file:text-white file:font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">
                      Atau Masukkan URL Eksternal (HTTP/HTTPS)
                    </label>
                    <input
                      type="url"
                      value={matForm.fileUrl}
                      onChange={(e) =>
                        setMatForm({ ...matForm, fileUrl: e.target.value })
                      }
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMaterialModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#14283F]/20 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#087451] text-white font-semibold"
                >
                  Simpan Materi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
