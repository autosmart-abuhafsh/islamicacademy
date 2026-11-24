import React, { useState } from 'react';
import {
  Archive,
  CheckCircle2,
  Download,
  Edit3,
  Plus,
  Search,
  Shield,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import {
  AcademicClass,
  AcademicProgram,
  AcademyDatabase,
  AdmissionStatus,
  Announcement,
  ClassSchedule,
  ModuleKey,
  PermissionAction,
  ProgramStatus,
  RoleId,
  StudentProfile,
  TeacherProfile,
  UserAccount,
} from '../types/database';
import { hasPermission } from '../utils/academicLogic';

interface UsersAndAcademicAdminProps {
  db: AcademyDatabase;
  currentUser: UserAccount;
  mode: 'users' | 'academic';
  initialSubTab?: string;
  onMutate: (params: {
    moduleKey: ModuleKey;
    action: PermissionAction;
    actionLabel: string;
    targetDescription: string;
    updater: (prev: AcademyDatabase) => AcademyDatabase;
  }) => Promise<void>;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export function UsersAndAcademicAdmin({
  db,
  currentUser,
  mode,
  initialSubTab,
  onMutate,
  onNotify,
}: UsersAndAcademicAdminProps) {
  const [userSubTab, setUserSubTab] = useState<
    'students' | 'teachers' | 'admins' | 'rbac'
  >((initialSubTab as 'students') || 'students');
  const [acadSubTab, setAcadSubTab] = useState<
    'programs' | 'classes' | 'schedules' | 'admissions' | 'announcements'
  >((initialSubTab as 'programs') || 'programs');

  const [searchQuery, setSearchQuery] = useState('');
  const [programFilter, setProgramFilter] = useState('ALL');

  // Add Student Modal
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(
    null
  );
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    email: '',
    whatsapp: '',
    gender: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
    city: '',
    programId: db.programs[0]?.id || 'prg-lughah',
    classId: db.classes[0]?.id || 'cls-nahwu-a',
  });

  // Add Teacher Modal
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherForm, setTeacherForm] = useState({
    fullName: '',
    email: '',
    whatsapp: '',
    expertiseText: '',
    biography: '',
  });

  // Add Program Modal
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [programForm, setProgramForm] = useState({
    code: '',
    title: '',
    arabicTitle: '',
    description: '',
    duration: '1 Semester (6 Bulan)',
    level: 'Pemula' as 'Pemula' | 'Menengah' | 'Lanjutan',
    fee: 'Rp 400.000 / Semester',
    status: 'Open Registration' as ProgramStatus,
  });

  // Add Class Modal
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [classForm, setClassForm] = useState({
    code: '',
    name: '',
    programId: db.programs[0]?.id || 'prg-lughah',
    teacherId: db.teachers[0]?.id || 'tch-1',
    quota: 30,
    scheduleSummary: 'Selasa & Kamis · 19:30 WIB',
    zoomLink: 'https://zoom.us/j/9988776655',
  });

  // Add Schedule Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    classId: db.classes[0]?.id || 'cls-nahwu-a',
    dayOfWeek: 'Senin' as ClassSchedule['dayOfWeek'],
    date: '2026-11-30',
    startTime: '19:30',
    endTime: '21:00',
    topic: '',
  });

  // Add Announcement Modal
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [annForm, setAnnForm] = useState({
    title: '',
    category: 'Pengumuman Resmi' as Announcement['category'],
    content: '',
    targetAudience: 'Public' as Announcement['targetAudience'],
  });

  const exportCsv = (filename: string, rows: Record<string, unknown>[]) => {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(','),
      ...rows.map((r) =>
        headers
          .map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`)
          .join(',')
      ),
    ];
    const blob = new Blob([csvLines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onNotify(`Data berhasil diekspor ke ${filename}`, 'success');
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.fullName.trim() || !studentForm.email.trim()) {
      onNotify('Nama lengkap dan email santri wajib diisi.', 'error');
      return;
    }

    if (editingStudent) {
      await onMutate({
        moduleKey: 'users',
        action: 'edit',
        actionLabel: 'MENGEDIT_DATA_SANTRI',
        targetDescription: `Memperbarui profil santri ${studentForm.fullName}`,
        updater: (prev) => ({
          ...prev,
          students: prev.students.map((s) =>
            s.id === editingStudent.id
              ? {
                  ...s,
                  fullName: studentForm.fullName.trim(),
                  email: studentForm.email.trim(),
                  whatsapp: studentForm.whatsapp.trim(),
                  gender: studentForm.gender,
                  city: studentForm.city.trim(),
                  programIds: [studentForm.programId],
                  classIds: [studentForm.classId],
                }
              : s
          ),
        }),
      });
      setIsStudentModalOpen(false);
      setEditingStudent(null);
      onNotify('Data santri berhasil diperbarui.', 'success');
      return;
    }

    const nextNum = db.students.length + 1;
    const newUserId = `usr-std-${Date.now()}`;
    const newStdId = `std-${Date.now()}`;
    const nis = `SAN-2026-${String(nextNum).padStart(3, '0')}`;

    const newUser: UserAccount = {
      id: newUserId,
      username: studentForm.email.split('@')[0].toLowerCase(),
      email: studentForm.email.trim(),
      passwordHash: 'santri123',
      fullName: studentForm.fullName.trim(),
      role: 'santri',
      whatsapp: studentForm.whatsapp.trim(),
      gender: studentForm.gender,
      city: studentForm.city.trim(),
      status: 'Active',
      joinedAt: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newStudent: StudentProfile = {
      id: newStdId,
      userId: newUserId,
      nis,
      fullName: studentForm.fullName.trim(),
      email: studentForm.email.trim(),
      whatsapp: studentForm.whatsapp.trim(),
      gender: studentForm.gender,
      city: studentForm.city.trim(),
      joinedAt: new Date().toISOString().slice(0, 10),
      programIds: [studentForm.programId],
      classIds: [studentForm.classId],
      membershipStatus: 'Active',
      accountStatus: 'Active',
    };

    await onMutate({
      moduleKey: 'users',
      action: 'create',
      actionLabel: 'MENAMBAH_SANTRI_BARU',
      targetDescription: `Menambahkan santri baru ${newStudent.fullName} (${nis})`,
      updater: (prev) => ({
        ...prev,
        users: [...prev.users, newUser],
        students: [newStudent, ...prev.students],
        classes: prev.classes.map((c) =>
          c.id === studentForm.classId && !c.studentIds.includes(newStdId)
            ? { ...c, studentIds: [...c.studentIds, newStdId] }
            : c
        ),
      }),
    });

    setIsStudentModalOpen(false);
    onNotify(
      `Santri "${newStudent.fullName}" (${nis}) berhasil ditambahkan dan terdaftar ke kelas.`,
      'success'
    );
  };

  const handleArchiveStudent = async (st: StudentProfile) => {
    const nextStatus = st.accountStatus === 'Archived' ? 'Active' : 'Archived';
    await onMutate({
      moduleKey: 'users',
      action: 'edit',
      actionLabel: 'ARSIP_AKUN_SANTRI',
      targetDescription: `Mengubah status akun santri ${st.fullName} menjadi ${nextStatus} (Soft Delete)`,
      updater: (prev) => ({
        ...prev,
        students: prev.students.map((s) =>
          s.id === st.id
            ? {
                ...s,
                accountStatus: nextStatus,
                membershipStatus:
                  nextStatus === 'Archived' ? 'Archived' : 'Active',
              }
            : s
        ),
        users: prev.users.map((u) =>
          u.id === st.userId ? { ...u, status: nextStatus } : u
        ),
      }),
    });
    onNotify(
      `Status santri ${st.fullName} diubah menjadi ${nextStatus}. Riwayat akademik tetap terjaga.`,
      'success'
    );
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherForm.fullName.trim() || !teacherForm.email.trim()) {
      onNotify('Nama lengkap dan email pengajar wajib diisi.', 'error');
      return;
    }

    const newUserId = `usr-tch-${Date.now()}`;
    const newTchId = `tch-${Date.now()}`;
    const nip = `ASD-2026-${100 + db.teachers.length + 1}`;

    const newUser: UserAccount = {
      id: newUserId,
      username: teacherForm.email.split('@')[0].toLowerCase(),
      email: teacherForm.email.trim(),
      passwordHash: 'pengajar123',
      fullName: teacherForm.fullName.trim(),
      role: 'pengajar',
      whatsapp: teacherForm.whatsapp.trim(),
      gender: 'Laki-laki',
      city: 'Jakarta',
      status: 'Active',
      joinedAt: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newTeacher: TeacherProfile = {
      id: newTchId,
      userId: newUserId,
      nip,
      fullName: teacherForm.fullName.trim(),
      email: teacherForm.email.trim(),
      whatsapp: teacherForm.whatsapp.trim(),
      expertise: teacherForm.expertiseText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      biography: teacherForm.biography.trim(),
      classIds: [],
      accountStatus: 'Active',
    };

    await onMutate({
      moduleKey: 'users',
      action: 'create',
      actionLabel: 'MENAMBAH_PENGAJAR_BARU',
      targetDescription: `Menambahkan pengajar baru ${newTeacher.fullName} (${nip})`,
      updater: (prev) => ({
        ...prev,
        users: [...prev.users, newUser],
        teachers: [newTeacher, ...prev.teachers],
      }),
    });

    setIsTeacherModalOpen(false);
    setTeacherForm({
      fullName: '',
      email: '',
      whatsapp: '',
      expertiseText: '',
      biography: '',
    });
    onNotify(`Pengajar "${newTeacher.fullName}" berhasil ditambahkan.`, 'success');
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programForm.title.trim()) {
      onNotify('Nama program wajib diisi.', 'error');
      return;
    }
    const newProg: AcademicProgram = {
      id: `prg-${Date.now()}`,
      code:
        programForm.code.trim() ||
        `PRG-0${db.programs.length + 1}`,
      title: programForm.title.trim(),
      arabicTitle: programForm.arabicTitle.trim() || undefined,
      description: programForm.description.trim(),
      teacherIds: [db.teachers[0]?.id || 'tch-1'],
      duration: programForm.duration,
      level: programForm.level,
      fee: programForm.fee,
      requirements: ['Lulus seleksi baca Al-Qur’an'],
      status: programForm.status,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    await onMutate({
      moduleKey: 'academic',
      action: 'create',
      actionLabel: 'MEMBUAT_PROGRAM_AKADEMIK',
      targetDescription: `Membuat program baru "${newProg.title}"`,
      updater: (prev) => ({
        ...prev,
        programs: [newProg, ...prev.programs],
      }),
    });
    setIsProgramModalOpen(false);
    onNotify(`Program "${newProg.title}" berhasil dibuat.`, 'success');
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim()) {
      onNotify('Nama kelas wajib diisi.', 'error');
      return;
    }
    const newCls: AcademicClass = {
      id: `cls-${Date.now()}`,
      code: classForm.code.trim() || `KLS-0${db.classes.length + 1}`,
      name: classForm.name.trim(),
      programId: classForm.programId,
      teacherId: classForm.teacherId,
      studentIds: [],
      quota: Number(classForm.quota) || 30,
      scheduleSummary: classForm.scheduleSummary,
      startDate: '2026-12-01',
      endDate: '2027-05-30',
      status: 'Active',
      zoomLink: classForm.zoomLink,
      zoomMeetingId: '988 7766 5544',
      zoomPasscode: 'DARULILM',
      zoomNotes: 'Hadir tepat waktu sesuai adab majelis.',
    };

    await onMutate({
      moduleKey: 'academic',
      action: 'create',
      actionLabel: 'MEMBUAT_KELAS_BARU',
      targetDescription: `Membuat kelas baru "${newCls.name}"`,
      updater: (prev) => ({
        ...prev,
        classes: [...prev.classes, newCls],
      }),
    });
    setIsClassModalOpen(false);
    onNotify(`Kelas "${newCls.name}" berhasil ditambahkan.`, 'success');
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.topic.trim()) {
      onNotify('Topik jadwal wajib diisi.', 'error');
      return;
    }
    const cls = db.classes.find((c) => c.id === scheduleForm.classId);
    const newSch: ClassSchedule = {
      id: `sch-${Date.now()}`,
      classId: scheduleForm.classId,
      teacherId: cls?.teacherId || 'tch-1',
      dayOfWeek: scheduleForm.dayOfWeek,
      date: scheduleForm.date,
      startTime: scheduleForm.startTime,
      endTime: scheduleForm.endTime,
      topic: scheduleForm.topic.trim(),
      sessionStatus: 'Scheduled',
      onlineLink: cls?.zoomLink || 'https://zoom.us',
      timezone: 'Asia/Jakarta',
    };

    await onMutate({
      moduleKey: 'academic',
      action: 'create',
      actionLabel: 'MENAMBAH_JADWAL_KELAS',
      targetDescription: `Menambahkan jadwal "${newSch.topic}" pada ${newSch.date}`,
      updater: (prev) => ({
        ...prev,
        schedules: [newSch, ...prev.schedules],
      }),
    });
    setIsScheduleModalOpen(false);
    onNotify('Jadwal pertemuan berhasil ditambahkan.', 'success');
  };

  const handleProcessAdmission = async (
    admId: string,
    nextStatus: AdmissionStatus,
    assignClassId?: string
  ) => {
    const adm = db.admissions.find((a) => a.id === admId);
    if (!adm) return;

    await onMutate({
      moduleKey: 'academic',
      action: 'edit',
      actionLabel: 'PROSES_PENDAFTARAN_SANTRI',
      targetDescription: `Mengubah status pendaftaran ${adm.fullName} (${adm.registrationNumber}) menjadi ${nextStatus}`,
      updater: (prev) => {
        let nextUsers = [...prev.users];
        let nextStudents = [...prev.students];
        let nextClasses = [...prev.classes];

        // If Enrolled, automatically provision Student Profile & Account if not already present
        if (nextStatus === 'Enrolled') {
          const targetClassId =
            assignClassId ||
            prev.classes.find((c) => c.programId === adm.programId)?.id ||
            prev.classes[0]?.id;
          const alreadyExists = prev.students.some(
            (s) => s.email.toLowerCase() === adm.email.toLowerCase()
          );
          if (!alreadyExists) {
            const newUserId = `usr-std-${Date.now()}`;
            const newStdId = `std-${Date.now()}`;
            const nis = `SAN-2026-${String(prev.students.length + 1).padStart(
              3,
              '0'
            )}`;
            nextUsers.push({
              id: newUserId,
              username: adm.email.split('@')[0].toLowerCase(),
              email: adm.email,
              passwordHash: 'santri123',
              fullName: adm.fullName,
              role: 'santri',
              whatsapp: adm.whatsapp,
              gender: adm.gender,
              city: adm.city,
              status: 'Active',
              joinedAt: new Date().toISOString().slice(0, 10),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            nextStudents.unshift({
              id: newStdId,
              userId: newUserId,
              nis,
              fullName: adm.fullName,
              email: adm.email,
              whatsapp: adm.whatsapp,
              gender: adm.gender,
              city: adm.city,
              joinedAt: new Date().toISOString().slice(0, 10),
              programIds: [adm.programId],
              classIds: targetClassId ? [targetClassId] : [],
              membershipStatus: 'Active',
              accountStatus: 'Active',
            });
            if (targetClassId) {
              nextClasses = nextClasses.map((c) =>
                c.id === targetClassId
                  ? { ...c, studentIds: [...c.studentIds, newStdId] }
                  : c
              );
            }
          }
        }

        return {
          ...prev,
          users: nextUsers,
          students: nextStudents,
          classes: nextClasses,
          admissions: prev.admissions.map((a) =>
            a.id === admId
              ? {
                  ...a,
                  status: nextStatus,
                  assignedClassId: assignClassId || a.assignedClassId,
                  reviewedBy: currentUser.fullName,
                  reviewedAt: new Date().toISOString(),
                }
              : a
          ),
        };
      },
    });
    onNotify(
      `Status pendaftaran ${adm.fullName} diperbarui menjadi ${nextStatus}.`,
      'success'
    );
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annForm.title.trim() || !annForm.content.trim()) {
      onNotify('Judul dan isi pengumuman wajib diisi.', 'error');
      return;
    }
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title: annForm.title.trim(),
      category: annForm.category,
      content: annForm.content.trim(),
      publishedAt: new Date().toISOString().slice(0, 10),
      status: 'Published',
      targetAudience: annForm.targetAudience,
      authorName: currentUser.fullName,
    };

    await onMutate({
      moduleKey: 'academic',
      action: 'publish',
      actionLabel: 'PUBLIKASI_PENGUMUMAN',
      targetDescription: `Menerbitkan pengumuman "${newAnn.title}"`,
      updater: (prev) => ({
        ...prev,
        announcements: [newAnn, ...prev.announcements],
      }),
    });
    setIsAnnModalOpen(false);
    setAnnForm({
      title: '',
      category: 'Pengumuman Resmi',
      content: '',
      targetAudience: 'Public',
    });
    onNotify('Pengumuman berhasil dipublikasikan ke Papan Informasi.', 'success');
  };

  const handleToggleRolePermission = async (
    roleId: RoleId,
    modKey: ModuleKey,
    act: PermissionAction
  ) => {
    if (currentUser.role !== 'super_admin') {
      onNotify('Hanya Super Admin yang dapat mengubah matriks Role & Permission.', 'error');
      return;
    }
    await onMutate({
      moduleKey: 'users',
      action: 'edit',
      actionLabel: 'UBAH_MATRIKS_PERMISSION',
      targetDescription: `Mengubah izin '${act}' modul '${modKey}' pada role '${roleId}'`,
      updater: (prev) => ({
        ...prev,
        roles: prev.roles.map((r) => {
          if (r.id !== roleId) return r;
          const currentActs = r.permissions[modKey] || [];
          const exists = currentActs.includes(act);
          const nextActs = exists
            ? currentActs.filter((a) => a !== act)
            : [...currentActs, act];
          return {
            ...r,
            permissions: {
              ...r.permissions,
              [modKey]: nextActs,
            },
          };
        }),
      }),
    });
  };

  // MODE A: USER MANAGEMENT & RBAC
  if (mode === 'users') {
    const filteredStudents = db.students.filter((st) => {
      if (programFilter !== 'ALL' && !st.programIds.includes(programFilter)) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        st.fullName.toLowerCase().includes(q) ||
        st.nis.toLowerCase().includes(q) ||
        st.email.toLowerCase().includes(q) ||
        st.city.toLowerCase().includes(q)
      );
    });

    return (
      <div className="space-y-6">
        {/* Sub-Tabs */}
        <div className="bg-white rounded-xl p-5 border border-[#14283F]/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'students', label: `Data Santri (${db.students.length})` },
              {
                id: 'teachers',
                label: `Data Pengajar (${db.teachers.length})`,
              },
              {
                id: 'admins',
                label: `Akun Pengguna (${db.users.length})`,
              },
              { id: 'rbac', label: 'Role & Permission Matrix (RBAC)' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setUserSubTab(t.id as typeof userSubTab)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  userSubTab === t.id
                    ? 'bg-[#087451] text-white'
                    : 'bg-[#F5F0E4]/60 text-[#14283F]/75 hover:text-[#14283F]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {userSubTab === 'students' && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    exportCsv(
                      'data_santri.csv',
                      filteredStudents as unknown as Record<string, unknown>[]
                    )
                  }
                  className="px-3.5 py-2 text-xs font-semibold text-[#14283F] bg-[#F5F0E4] rounded-lg flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingStudent(null);
                    setStudentForm({
                      fullName: '',
                      email: '',
                      whatsapp: '',
                      gender: 'Laki-laki',
                      city: '',
                      programId: db.programs[0]?.id || 'prg-lughah',
                      classId: db.classes[0]?.id || 'cls-nahwu-a',
                    });
                    setIsStudentModalOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#087451] hover:bg-[#065d40] rounded-lg flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  Tambah Santri
                </button>
              </>
            )}
            {userSubTab === 'teachers' && (
              <button
                type="button"
                onClick={() => setIsTeacherModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#087451] hover:bg-[#065d40] rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Tambah Pengajar
              </button>
            )}
          </div>
        </div>

        {/* STUDENTS TABLE */}
        {userSubTab === 'students' && (
          <div className="bg-white rounded-xl p-6 border border-[#14283F]/10 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#14283F]/50 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  aria-label="Cari Santri"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama santri, NIS, email, atau kota..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#14283F]/20"
                />
              </div>
              <select
                aria-label="Filter Program Santri"
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-[#14283F]/20 bg-white"
              >
                <option value="ALL">Semua Program Studi</option>
                {db.programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#14283F]/15 text-[#14283F]/70">
                    <th className="py-3 px-3 font-semibold">NIS</th>
                    <th className="py-3 px-3 font-semibold">Nama Lengkap</th>
                    <th className="py-3 px-3 font-semibold">Kontak & Kota</th>
                    <th className="py-3 px-3 font-semibold">Program & Kelas</th>
                    <th className="py-3 px-3 font-semibold">Status Akun</th>
                    <th className="py-3 px-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#14283F]/10">
                  {filteredStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-[#F5F0E4]/40">
                      <td className="py-3 px-3 font-mono-num font-semibold text-[#087451]">
                        {st.nis}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#14283F]">
                          {st.fullName}
                        </div>
                        <div className="text-[#14283F]/60">
                          {st.gender} · Bergabung {st.joinedAt}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div>{st.email}</div>
                        <div className="text-[#14283F]/60 font-mono-num">
                          {st.whatsapp} · {st.city}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {st.classIds
                          .map(
                            (cid) =>
                              db.classes.find((c) => c.id === cid)?.name || cid
                          )
                          .join(', ')}
                      </td>
                      <td className="py-3 px-3 font-semibold">
                        {st.accountStatus}
                      </td>
                      <td className="py-3 px-3 text-right space-x-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStudent(st);
                            setStudentForm({
                              fullName: st.fullName,
                              email: st.email,
                              whatsapp: st.whatsapp,
                              gender: st.gender,
                              city: st.city,
                              programId:
                                st.programIds[0] || db.programs[0]?.id || '',
                              classId:
                                st.classIds[0] || db.classes[0]?.id || '',
                            });
                            setIsStudentModalOpen(true);
                          }}
                          className="text-[#087451] font-semibold hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleArchiveStudent(st)}
                          className="text-[#14283F]/70 font-semibold hover:underline"
                        >
                          {st.accountStatus === 'Archived'
                            ? 'Aktifkan'
                            : 'Arsipkan'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TEACHERS TABLE */}
        {userSubTab === 'teachers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {db.teachers.map((tch) => (
              <div
                key={tch.id}
                className="bg-white rounded-xl p-5 border border-[#14283F]/10 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono-num font-bold text-[#087451]">
                    {tch.nip}
                  </span>
                  <span className="font-semibold">
                    Status: {tch.accountStatus}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#14283F]">
                  {tch.fullName}
                </h3>
                <p className="text-xs text-[#14283F]/75 leading-relaxed">
                  {tch.biography}
                </p>
                <div className="text-xs text-[#14283F]/70">
                  <strong>Bidang Keahlian:</strong> {tch.expertise.join(' · ')}
                </div>
                <div className="pt-2 border-t border-[#14283F]/10 text-xs text-[#14283F]/65 flex items-center justify-between">
                  <span>{tch.email}</span>
                  <span className="font-mono-num">{tch.whatsapp}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ALL USER ACCOUNTS */}
        {userSubTab === 'admins' && (
          <div className="bg-white rounded-xl p-6 border border-[#14283F]/10 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#14283F]/15 text-[#14283F]/70">
                  <th className="py-3 px-3 font-semibold">Nama Pengguna</th>
                  <th className="py-3 px-3 font-semibold">Username / Email</th>
                  <th className="py-3 px-3 font-semibold">Role RBAC</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14283F]/10">
                {db.users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F5F0E4]/40">
                    <td className="py-3 px-3 font-bold text-[#14283F]">
                      {u.fullName}
                    </td>
                    <td className="py-3 px-3 font-mono-num">
                      {u.username} · {u.email}
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#087451]">
                      {u.role}
                    </td>
                    <td className="py-3 px-3">{u.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* RBAC MATRIX */}
        {userSubTab === 'rbac' && (
          <div className="bg-white rounded-xl p-6 border border-[#14283F]/10 space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#14283F]">
                Pengaturan Hak Akses & Role-Based Access Control (Section 4.7)
              </h3>
              <p className="text-xs text-[#14283F]/70">
                Setiap perubahan izin modul langsung diverifikasi di Frontend dan Backend API (`/api/db/mutate`).
              </p>
            </div>

            <div className="space-y-4">
              {db.roles.map((role) => (
                <div
                  key={role.id}
                  className="p-4 rounded-xl bg-[#F5F0E4]/45 border border-[#14283F]/10 space-y-3"
                >
                  <div>
                    <h4 className="text-sm font-bold text-[#14283F]">
                      {role.name}{' '}
                      <span className="font-mono-num text-xs text-[#087451]">
                        ({role.id})
                      </span>
                    </h4>
                    <p className="text-xs text-[#14283F]/70">
                      {role.description}
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs bg-white rounded-lg overflow-hidden">
                      <thead>
                        <tr className="border-b border-[#14283F]/10 text-[#14283F]/65">
                          <th className="py-2 px-3">Modul</th>
                          {(
                            [
                              'view',
                              'create',
                              'edit',
                              'delete',
                              'publish',
                            ] as const
                          ).map((act) => (
                            <th key={act} className="py-2 px-3 text-center">
                              {act}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#14283F]/10">
                        {(
                          [
                            'dashboard',
                            'users',
                            'academic',
                            'lms',
                            'library',
                            'knowledge',
                            'reports',
                            'settings',
                          ] as const
                        ).map((mod) => (
                          <tr key={mod}>
                            <td className="py-2 px-3 font-semibold">{mod}</td>
                            {(
                              [
                                'view',
                                'create',
                                'edit',
                                'delete',
                                'publish',
                              ] as const
                            ).map((act) => {
                              const checked = (
                                role.permissions[mod] || []
                              ).includes(act);
                              return (
                                <td key={act} className="py-2 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    aria-label={`${role.name} ${mod} ${act}`}
                                    checked={checked}
                                    disabled={role.id === 'super_admin'}
                                    onChange={() =>
                                      handleToggleRolePermission(
                                        role.id,
                                        mod,
                                        act
                                      )
                                    }
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADD/EDIT STUDENT MODAL */}
        {isStudentModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-[#14283F]/65 backdrop-blur-xs flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="std-modal-title"
          >
            <div className="bg-white border border-[#C5A45B]/40 rounded-xl max-w-lg w-full overflow-hidden shadow-xl">
              <div className="bg-[#14283F] text-white px-5 py-4 flex items-center justify-between">
                <h3 id="std-modal-title" className="text-sm font-bold">
                  {editingStudent
                    ? `Edit Data Santri: ${editingStudent.fullName}`
                    : 'Tambah Santri Baru'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  aria-label="Tutup modal santri"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSaveStudent} className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold mb-1">
                    Nama Lengkap Santri *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentForm.fullName}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        fullName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={studentForm.email}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">
                      Nomor WhatsApp *
                    </label>
                    <input
                      type="text"
                      required
                      value={studentForm.whatsapp}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          whatsapp: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 font-mono-num"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">
                      Jenis Kelamin
                    </label>
                    <select
                      value={studentForm.gender}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          gender: e.target.value as 'Laki-laki' | 'Perempuan',
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 bg-white"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Asal Kota</label>
                    <input
                      type="text"
                      value={studentForm.city}
                      onChange={(e) =>
                        setStudentForm({ ...studentForm, city: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Program</label>
                    <select
                      value={studentForm.programId}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          programId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 bg-white"
                    >
                      {db.programs.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">
                      Penempatan Kelas
                    </label>
                    <select
                      value={studentForm.classId}
                      onChange={(e) =>
                        setStudentForm({
                          ...studentForm,
                          classId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 bg-white"
                    >
                      {db.classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsStudentModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-[#14283F]/20 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#087451] text-white font-semibold"
                  >
                    Simpan Data Santri
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD TEACHER MODAL */}
        {isTeacherModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-[#14283F]/65 backdrop-blur-xs flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tch-modal-title"
          >
            <div className="bg-white border border-[#C5A45B]/40 rounded-xl max-w-lg w-full overflow-hidden shadow-xl">
              <div className="bg-[#14283F] text-white px-5 py-4 flex items-center justify-between">
                <h3 id="tch-modal-title" className="text-sm font-bold">
                  Tambah Pengajar (Asatidzah) Baru
                </h3>
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  aria-label="Tutup modal pengajar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSaveTeacher} className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold mb-1">
                    Nama Lengkap & Gelar *
                  </label>
                  <input
                    type="text"
                    required
                    value={teacherForm.fullName}
                    onChange={(e) =>
                      setTeacherForm({
                        ...teacherForm,
                        fullName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={teacherForm.email}
                      onChange={(e) =>
                        setTeacherForm({
                          ...teacherForm,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={teacherForm.whatsapp}
                      onChange={(e) =>
                        setTeacherForm({
                          ...teacherForm,
                          whatsapp: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 font-mono-num"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Bidang Keahlian (Pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={teacherForm.expertiseText}
                    onChange={(e) =>
                      setTeacherForm({
                        ...teacherForm,
                        expertiseText: e.target.value,
                      })
                    }
                    placeholder="Contoh: Fikih Syafi’i, Ushul Fikih, Balaghah"
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Biografi Singkat
                  </label>
                  <textarea
                    rows={2}
                    value={teacherForm.biography}
                    onChange={(e) =>
                      setTeacherForm({
                        ...teacherForm,
                        biography: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsTeacherModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-[#14283F]/20 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#087451] text-white font-semibold"
                  >
                    Simpan Pengajar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // MODE B: ACADEMIC MANAGEMENT (PROGRAMS, CLASSES, SCHEDULES, ADMISSIONS, ANNOUNCEMENTS)
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-5 border border-[#14283F]/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'programs', label: `Program (${db.programs.length})` },
            { id: 'classes', label: `Kelas & Kuota (${db.classes.length})` },
            { id: 'schedules', label: `Jadwal (${db.schedules.length})` },
            {
              id: 'admissions',
              label: `Pendaftaran (${db.admissions.length})`,
            },
            {
              id: 'announcements',
              label: `Papan Informasi (${db.announcements.length})`,
            },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setAcadSubTab(t.id as typeof acadSubTab)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                acadSubTab === t.id
                  ? 'bg-[#087451] text-white'
                  : 'bg-[#F5F0E4]/60 text-[#14283F]/75 hover:text-[#14283F]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div>
          {acadSubTab === 'programs' && (
            <button
              type="button"
              onClick={() => setIsProgramModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#087451] rounded-lg"
            >
              + Buat Program Baru
            </button>
          )}
          {acadSubTab === 'classes' && (
            <button
              type="button"
              onClick={() => setIsClassModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#087451] rounded-lg"
            >
              + Tambah Kelas
            </button>
          )}
          {acadSubTab === 'schedules' && (
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#087451] rounded-lg"
            >
              + Tambah Jadwal Pertemuan
            </button>
          )}
          {acadSubTab === 'announcements' && (
            <button
              type="button"
              onClick={() => setIsAnnModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#087451] rounded-lg"
            >
              + Terbitkan Pengumuman
            </button>
          )}
        </div>
      </div>

      {/* PROGRAMS */}
      {acadSubTab === 'programs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {db.programs.map((prg) => (
            <div
              key={prg.id}
              className="bg-white rounded-xl p-5 border border-[#14283F]/10 space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono-num font-bold text-[#087451]">
                  {prg.code} · {prg.level}
                </span>
                <select
                  aria-label={`Status program ${prg.title}`}
                  value={prg.status}
                  onChange={(e) => {
                    const nextStatus = e.target.value as ProgramStatus;
                    onMutate({
                      moduleKey: 'academic',
                      action: 'edit',
                      actionLabel: 'UBAH_STATUS_PROGRAM',
                      targetDescription: `Mengubah status program ${prg.title} menjadi ${nextStatus}`,
                      updater: (prev) => ({
                        ...prev,
                        programs: prev.programs.map((p) =>
                          p.id === prg.id ? { ...p, status: nextStatus } : p
                        ),
                      }),
                    });
                  }}
                  className="px-2.5 py-1 rounded border border-[#14283F]/20 text-xs font-semibold"
                >
                  <option value="Draft">Draft</option>
                  <option value="Open Registration">Open Registration</option>
                  <option value="Full">Full</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              <h3 className="text-base font-bold text-[#14283F]">{prg.title}</h3>
              <p className="text-xs text-[#14283F]/75">{prg.description}</p>
              <div className="pt-2 border-t border-[#14283F]/10 text-xs text-[#14283F]/70 flex justify-between">
                <span>Durasi: {prg.duration}</span>
                <span>Biaya: {prg.fee}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CLASSES */}
      {acadSubTab === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {db.classes.map((cls) => (
            <div
              key={cls.id}
              className="bg-white rounded-xl p-5 border border-[#14283F]/10 space-y-2.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono-num font-bold text-[#087451]">
                  {cls.code}
                </span>
                <span className="font-mono-num">
                  Kuota: {cls.studentIds.length} / {cls.quota} Santri
                </span>
              </div>
              <h3 className="text-base font-bold text-[#14283F]">{cls.name}</h3>
              <p className="text-xs text-[#14283F]/75">
                Pengajar:{' '}
                <strong>
                  {db.teachers.find((t) => t.id === cls.teacherId)?.fullName}
                </strong>
              </p>
              <p className="text-xs text-[#087451] font-medium">
                Jadwal: {cls.scheduleSummary}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* SCHEDULES */}
      {acadSubTab === 'schedules' && (
        <div className="bg-white rounded-xl p-6 border border-[#14283F]/10 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#14283F]/15 text-[#14283F]/70">
                <th className="py-3 px-3 font-semibold">Hari & Tanggal</th>
                <th className="py-3 px-3 font-semibold">Jam (Asia/Jakarta)</th>
                <th className="py-3 px-3 font-semibold">Kelas</th>
                <th className="py-3 px-3 font-semibold">Topik Pertemuan</th>
                <th className="py-3 px-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#14283F]/10">
              {db.schedules.map((sch) => (
                <tr key={sch.id}>
                  <td className="py-3 px-3 font-mono-num">
                    {sch.dayOfWeek}, {sch.date}
                  </td>
                  <td className="py-3 px-3 font-mono-num">
                    {sch.startTime} – {sch.endTime}
                  </td>
                  <td className="py-3 px-3 font-semibold">
                    {db.classes.find((c) => c.id === sch.classId)?.name}
                  </td>
                  <td className="py-3 px-3">{sch.topic}</td>
                  <td className="py-3 px-3 font-semibold text-[#087451]">
                    {sch.sessionStatus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADMISSIONS */}
      {acadSubTab === 'admissions' && (
        <div className="bg-white rounded-xl p-6 border border-[#14283F]/10 space-y-4">
          <h3 className="text-base font-bold text-[#14283F]">
            Manajemen Pendaftaran & Penempatan Kelas Santri Baru (Section 7.4)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#14283F]/15 text-[#14283F]/70">
                  <th className="py-3 px-3 font-semibold">No. Registrasi</th>
                  <th className="py-3 px-3 font-semibold">Calon Santri</th>
                  <th className="py-3 px-3 font-semibold">Program Tujuan</th>
                  <th className="py-3 px-3 font-semibold">Latar Belakang</th>
                  <th className="py-3 px-3 font-semibold">Status & Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14283F]/10">
                {db.admissions.map((adm) => {
                  const prog = db.programs.find((p) => p.id === adm.programId);
                  return (
                    <tr key={adm.id} className="hover:bg-[#F5F0E4]/40">
                      <td className="py-3 px-3 font-mono-num font-bold text-[#087451]">
                        {adm.registrationNumber}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#14283F]">
                          {adm.fullName}
                        </div>
                        <div className="text-[#14283F]/60">
                          {adm.email} · {adm.whatsapp} ({adm.city})
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold">
                        {prog?.title || adm.programId}
                      </td>
                      <td className="py-3 px-3 max-w-xs text-[#14283F]/75">
                        {adm.backgroundNotes}
                      </td>
                      <td className="py-3 px-3">
                        <select
                          aria-label={`Ubah status pendaftaran ${adm.fullName}`}
                          value={adm.status}
                          onChange={(e) =>
                            handleProcessAdmission(
                              adm.id,
                              e.target.value as AdmissionStatus
                            )
                          }
                          className="px-2.5 py-1.5 rounded border border-[#14283F]/20 bg-white text-xs font-semibold"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Approved">Approved</option>
                          <option value="Enrolled">
                            Enrolled (Tempatkan Kelas & Buat Akun)
                          </option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENTS */}
      {acadSubTab === 'announcements' && (
        <div className="space-y-4">
          {db.announcements.map((ann) => (
            <div
              key={ann.id}
              className="bg-white rounded-xl p-5 border border-[#14283F]/10 space-y-2"
            >
              <div className="flex items-center justify-between text-xs text-[#14283F]/60">
                <span className="font-semibold text-[#087451]">
                  {ann.category} · Audiens: {ann.targetAudience}
                </span>
                <span className="font-mono-num">{ann.publishedAt}</span>
              </div>
              <h4 className="text-base font-bold text-[#14283F]">
                {ann.title}
              </h4>
              <p className="text-xs text-[#14283F]/80">{ann.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* CREATE PROGRAM MODAL */}
      {isProgramModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#14283F]/65 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="prg-modal-title"
        >
          <div className="bg-white border border-[#C5A45B]/40 rounded-xl max-w-lg w-full overflow-hidden shadow-xl">
            <div className="bg-[#14283F] text-white px-5 py-4 flex items-center justify-between">
              <h3 id="prg-modal-title" className="text-sm font-bold">
                Buat Program Pembelajaran Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsProgramModalOpen(false)}
                aria-label="Tutup modal program"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveProgram} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Kode</label>
                  <input
                    type="text"
                    value={programForm.code}
                    onChange={(e) =>
                      setProgramForm({ ...programForm, code: e.target.value })
                    }
                    placeholder="PRG-05"
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 font-mono-num"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold mb-1">
                    Nama Program *
                  </label>
                  <input
                    type="text"
                    required
                    value={programForm.title}
                    onChange={(e) =>
                      setProgramForm({ ...programForm, title: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  value={programForm.description}
                  onChange={(e) =>
                    setProgramForm({
                      ...programForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Tingkat</label>
                  <select
                    value={programForm.level}
                    onChange={(e) =>
                      setProgramForm({
                        ...programForm,
                        level: e.target.value as
                          | 'Pemula'
                          | 'Menengah'
                          | 'Lanjutan',
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 bg-white"
                  >
                    <option value="Pemula">Pemula</option>
                    <option value="Menengah">Menengah</option>
                    <option value="Lanjutan">Lanjutan</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  <select
                    value={programForm.status}
                    onChange={(e) =>
                      setProgramForm({
                        ...programForm,
                        status: e.target.value as ProgramStatus,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 bg-white"
                  >
                    <option value="Open Registration">Open Registration</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProgramModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#14283F]/20 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#087451] text-white font-semibold"
                >
                  Simpan Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CLASS MODAL */}
      {isClassModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#14283F]/65 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cls-modal-title"
        >
          <div className="bg-white border border-[#C5A45B]/40 rounded-xl max-w-lg w-full overflow-hidden shadow-xl">
            <div className="bg-[#14283F] text-white px-5 py-4 flex items-center justify-between">
              <h3 id="cls-modal-title" className="text-sm font-bold">
                Tambah Kelas Halaqah Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsClassModalOpen(false)}
                aria-label="Tutup modal kelas"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveClass} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nama Kelas *</label>
                <input
                  type="text"
                  required
                  value={classForm.name}
                  onChange={(e) =>
                    setClassForm({ ...classForm, name: e.target.value })
                  }
                  placeholder="Contoh: Halaqah Balaghah — Jauharul Maknun"
                  className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    Program Induk
                  </label>
                  <select
                    value={classForm.programId}
                    onChange={(e) =>
                      setClassForm({ ...classForm, programId: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 bg-white"
                  >
                    {db.programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Pengajar</label>
                  <select
                    value={classForm.teacherId}
                    onChange={(e) =>
                      setClassForm({ ...classForm, teacherId: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 bg-white"
                  >
                    {db.teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    Kuota Santri
                  </label>
                  <input
                    type="number"
                    value={classForm.quota}
                    onChange={(e) =>
                      setClassForm({
                        ...classForm,
                        quota: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Ringkasan Jadwal
                  </label>
                  <input
                    type="text"
                    value={classForm.scheduleSummary}
                    onChange={(e) =>
                      setClassForm({
                        ...classForm,
                        scheduleSummary: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#14283F]/20 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#087451] text-white font-semibold"
                >
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SCHEDULE MODAL */}
      {isScheduleModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#14283F]/65 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sch-modal-title"
        >
          <div className="bg-white border border-[#C5A45B]/40 rounded-xl max-w-lg w-full overflow-hidden shadow-xl">
            <div className="bg-[#14283F] text-white px-5 py-4 flex items-center justify-between">
              <h3 id="sch-modal-title" className="text-sm font-bold">
                Tambah Jadwal Kalender Akademik (Asia/Jakarta)
              </h3>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                aria-label="Tutup modal jadwal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveSchedule} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Pilih Kelas</label>
                <select
                  value={scheduleForm.classId}
                  onChange={(e) =>
                    setScheduleForm({
                      ...scheduleForm,
                      classId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 bg-white"
                >
                  {db.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Hari</label>
                  <select
                    value={scheduleForm.dayOfWeek}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        dayOfWeek: e.target.value as ClassSchedule['dayOfWeek'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 bg-white"
                  >
                    {(
                      [
                        'Senin',
                        'Selasa',
                        'Rabu',
                        'Kamis',
                        'Jumat',
                        'Sabtu',
                        'Ahad',
                      ] as const
                    ).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={scheduleForm.date}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, date: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 font-mono-num"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Topik Pembahasan *
                </label>
                <input
                  type="text"
                  required
                  value={scheduleForm.topic}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, topic: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#14283F]/20 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#087451] text-white font-semibold"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ANNOUNCEMENT MODAL */}
      {isAnnModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#14283F]/65 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ann-modal-title"
        >
          <div className="bg-white border border-[#C5A45B]/40 rounded-xl max-w-lg w-full overflow-hidden shadow-xl">
            <div className="bg-[#14283F] text-white px-5 py-4 flex items-center justify-between">
              <h3 id="ann-modal-title" className="text-sm font-bold">
                Terbitkan Informasi ke Papan Pengumuman
              </h3>
              <button
                type="button"
                onClick={() => setIsAnnModalOpen(false)}
                aria-label="Tutup modal pengumuman"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={handleSaveAnnouncement}
              className="p-5 space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-semibold mb-1">
                  Judul Pengumuman *
                </label>
                <input
                  type="text"
                  required
                  value={annForm.title}
                  onChange={(e) =>
                    setAnnForm({ ...annForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Kategori</label>
                  <select
                    value={annForm.category}
                    onChange={(e) =>
                      setAnnForm({
                        ...annForm,
                        category: e.target.value as Announcement['category'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 bg-white"
                  >
                    <option value="Pengumuman Resmi">Pengumuman Resmi</option>
                    <option value="Informasi Pendaftaran">
                      Informasi Pendaftaran
                    </option>
                    <option value="Perubahan Jadwal">Perubahan Jadwal</option>
                    <option value="Agenda Akademik">Agenda Akademik</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Target Audiens
                  </label>
                  <select
                    value={annForm.targetAudience}
                    onChange={(e) =>
                      setAnnForm({
                        ...annForm,
                        targetAudience: e.target
                          .value as Announcement['targetAudience'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 bg-white"
                  >
                    <option value="Public">Public (Umum)</option>
                    <option value="All Users">Seluruh Sivitas</option>
                    <option value="Santri">Khusus Santri</option>
                    <option value="Pengajar">Khusus Pengajar</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Isi Pengumuman *
                </label>
                <textarea
                  rows={3}
                  required
                  value={annForm.content}
                  onChange={(e) =>
                    setAnnForm({ ...annForm, content: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAnnModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#14283F]/20 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#087451] text-white font-semibold"
                >
                  Publikasikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
