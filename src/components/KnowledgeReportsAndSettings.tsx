import React, { useState } from 'react';
import {
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  KeyRound,
  Lock,
  MessageSquare,
  Plus,
  Printer,
  Scale,
  Send,
  Settings,
  Unlock,
  X,
} from 'lucide-react';
import {
  AcademyDatabase,
  FatwaRecord,
  ForumQuestion,
  ModuleKey,
  PermissionAction,
  QuestionModerationStatus,
  UserAccount,
} from '../types/database';
import {
  hasPermission,
  verifyOwnerSettingsPasscode,
} from '../utils/academicLogic';

interface KnowledgeReportsAndSettingsProps {
  db: AcademyDatabase;
  currentUser: UserAccount;
  mode: 'knowledge' | 'reports' | 'settings';
  onOpenSyncModal: () => void;
  onMutate: (params: {
    moduleKey: ModuleKey;
    action: PermissionAction;
    actionLabel: string;
    targetDescription: string;
    updater: (prev: AcademyDatabase) => AcademyDatabase;
  }) => Promise<void>;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export function KnowledgeReportsAndSettings({
  db,
  currentUser,
  mode,
  onOpenSyncModal,
  onMutate,
  onNotify,
}: KnowledgeReportsAndSettingsProps) {
  const [knowTab, setKnowTab] = useState<'fatwas' | 'forum' | 'ask'>('fatwas');
  const [repTab, setRepTab] = useState<
    'academic' | 'teacher' | 'library' | 'operational'
  >('academic');

  // Fatwa Form
  const [isFatwaModalOpen, setIsFatwaModalOpen] = useState(false);
  const [fatwaForm, setFatwaForm] = useState({
    title: '',
    category: 'Ibadah' as FatwaRecord['category'],
    questionContext: '',
    answerContent: '',
    muftiName: 'Dewan Syariah Akademi — Syaikh Dr. Luqman Hakim Al-Azhari',
    sourceReference: 'Lajnah Ilmiyyah Islamic Academy Portal',
    kitabRefsText: 'Al-Majmu’ Syarah Al-Muhadzdzab, Al-Waraqat',
    verificationStatus: 'Verified' as FatwaRecord['verificationStatus'],
  });

  // Student Ask Question Form
  const [askForm, setAskForm] = useState({
    category: 'Ibadah' as ForumQuestion['category'],
    title: '',
    questionText: '',
  });

  // Moderation & Answer Drafts
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [rejectDrafts, setRejectDrafts] = useState<Record<string, string>>({});

  // Settings Form & Owner Passcode Gate (Code: 2026)
  const [isOwnerUnlocked, setIsOwnerUnlocked] = useState(false);
  const [ownerPasscodeInput, setOwnerPasscodeInput] = useState('');
  const [ownerPasscodeError, setOwnerPasscodeError] = useState('');

  const [settingsForm, setSettingsForm] = useState({
    academyName: db.settings.academyName,
    academyArabicName: db.settings.academyArabicName,
    tagline: db.settings.tagline,
    academicYear: db.settings.academicYear,
    timezone: db.settings.timezone,
    contactEmail: db.settings.contactEmail,
    contactWhatsapp: db.settings.contactWhatsapp,
    address: db.settings.address,
    allowPublicRegistration: db.settings.allowPublicRegistration,
    requireBookVerificationBeforeDownload:
      db.settings.requireBookVerificationBeforeDownload,
  });
  const [inlineAppsScriptUrl, setInlineAppsScriptUrl] = useState(
    db.settings.googleSheetSync.appsScriptWebAppUrl || ''
  );

  const canPublishFatwa =
    currentUser.role === 'super_admin' || currentUser.role === 'admin_konten';
  const canModerateOrAnswer =
    currentUser.role === 'super_admin' ||
    currentUser.role === 'admin_konten' ||
    currentUser.role === 'pengajar';

  const handleSaveFatwa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fatwaForm.title.trim() || !fatwaForm.answerContent.trim()) {
      onNotify('Judul fatwa dan isi ketetapan wajib diisi.', 'error');
      return;
    }
    const newFtw: FatwaRecord = {
      id: `ftw-${Date.now()}`,
      code: `FTW-2026-00${db.fatwas.length + 1}`,
      title: fatwaForm.title.trim(),
      category: fatwaForm.category,
      questionContext: fatwaForm.questionContext.trim(),
      answerContent: fatwaForm.answerContent.trim(),
      muftiName: fatwaForm.muftiName.trim(),
      sourceReference: fatwaForm.sourceReference.trim(),
      publishedDate: new Date().toISOString().slice(0, 10),
      kitabReferences: fatwaForm.kitabRefsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      verificationStatus: fatwaForm.verificationStatus,
      reviewerName: currentUser.fullName,
    };

    await onMutate({
      moduleKey: 'knowledge',
      action: 'publish',
      actionLabel: 'PUBLIKASI_FATWA',
      targetDescription: `Menerbitkan fatwa resmi "${newFtw.title}" (${newFtw.code})`,
      updater: (prev) => ({
        ...prev,
        fatwas: [newFtw, ...prev.fatwas],
      }),
    });
    setIsFatwaModalOpen(false);
    onNotify(`Fatwa "${newFtw.code}" berhasil diterbitkan.`, 'success');
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!askForm.title.trim() || !askForm.questionText.trim()) {
      onNotify('Judul dan isi pertanyaan wajib diisi.', 'error');
      return;
    }
    const currentStudent = db.students.find((s) => s.userId === currentUser.id);
    const newQ: ForumQuestion = {
      id: `qst-${Date.now()}`,
      studentId: currentStudent?.id || currentUser.id,
      studentName: currentUser.fullName,
      category: askForm.category,
      title: askForm.title.trim(),
      questionText: askForm.questionText.trim(),
      status: 'Pending Moderation',
      createdAt: new Date().toISOString().slice(0, 10),
    };

    await onMutate({
      moduleKey: 'knowledge',
      action: 'create',
      actionLabel: 'AJUKAN_PERTANYAAN_FORUM',
      targetDescription: `Mengajukan pertanyaan "${newQ.title}" ke Forum Tanya Jawab`,
      updater: (prev) => ({
        ...prev,
        questions: [newQ, ...prev.questions],
      }),
    });
    setAskForm({ category: 'Ibadah', title: '', questionText: '' });
    setKnowTab('forum');
    onNotify(
      'Pertanyaan Anda berhasil dikirim dan masuk ke antrean moderasi.',
      'success'
    );
  };

  const handleModerateQuestion = async (
    q: ForumQuestion,
    nextStatus: QuestionModerationStatus
  ) => {
    const draftAns =
      answerDrafts[q.id] !== undefined ? answerDrafts[q.id] : q.answerText;
    const draftRej =
      rejectDrafts[q.id] !== undefined
        ? rejectDrafts[q.id]
        : q.rejectionReason;

    await onMutate({
      moduleKey: 'knowledge',
      action: 'edit',
      actionLabel: 'MODERASI_PERTANYAAN',
      targetDescription: `Memperbarui status pertanyaan "${q.title}" menjadi ${nextStatus}`,
      updater: (prev) => ({
        ...prev,
        questions: prev.questions.map((item) =>
          item.id === q.id
            ? {
                ...item,
                status: nextStatus,
                answerText: draftAns,
                answeredBy: draftAns ? currentUser.fullName : item.answeredBy,
                answeredAt: draftAns
                  ? new Date().toISOString().slice(0, 10)
                  : item.answeredAt,
                rejectionReason:
                  nextStatus === 'Rejected' ? draftRej : item.rejectionReason,
                reviewerName: currentUser.fullName,
              }
            : item
        ),
      }),
    });
    onNotify(`Status pertanyaan diubah menjadi ${nextStatus}.`, 'success');
  };

  // MODE 1: KNOWLEDGE & FATWA CENTER
  if (mode === 'knowledge') {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-5 border border-[#14283F]/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setKnowTab('fatwas')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                knowTab === 'fatwas'
                  ? 'bg-[#087451] text-white'
                  : 'bg-[#F5F0E4]/60 text-[#14283F]/75 hover:text-[#14283F]'
              }`}
            >
              Arsip Fatwa Resmi ({db.fatwas.length})
            </button>
            <button
              type="button"
              onClick={() => setKnowTab('forum')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                knowTab === 'forum'
                  ? 'bg-[#087451] text-white'
                  : 'bg-[#F5F0E4]/60 text-[#14283F]/75 hover:text-[#14283F]'
              }`}
            >
              Forum Tanya Jawab & Moderasi ({db.questions.length})
            </button>
            <button
              type="button"
              onClick={() => setKnowTab('ask')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                knowTab === 'ask'
                  ? 'bg-[#087451] text-white'
                  : 'bg-[#F5F0E4]/60 text-[#14283F]/75 hover:text-[#14283F]'
              }`}
            >
              + Kirim Pertanyaan Baru
            </button>
          </div>

          {canPublishFatwa && (
            <button
              type="button"
              onClick={() => setIsFatwaModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#087451] hover:bg-[#065d40] rounded-lg flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Publikasi Fatwa Resmi
            </button>
          )}
        </div>

        {/* FATWAS LIST */}
        {knowTab === 'fatwas' && (
          <div className="space-y-4">
            {db.fatwas.map((ftw) => (
              <div
                key={ftw.id}
                className="bg-white rounded-xl p-6 border border-[#14283F]/10 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#14283F]/65">
                  <div>
                    <span className="font-mono-num font-bold text-[#087451]">
                      {ftw.code}
                    </span>{' '}
                    · Kategori: <strong>{ftw.category}</strong> · Tanggal:{' '}
                    <span className="font-mono-num">{ftw.publishedDate}</span>
                  </div>
                  <span className="font-semibold text-[#087451]">
                    Status: {ftw.verificationStatus}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#14283F]">
                  {ftw.title}
                </h3>
                <div className="p-3.5 rounded-lg bg-[#F5F0E4]/60 text-xs">
                  <strong>Konteks Istifta’:</strong> {ftw.questionContext}
                </div>
                <p className="text-xs sm:text-sm text-[#14283F]/90 leading-relaxed">
                  {ftw.answerContent}
                </p>
                <div className="pt-3 border-t border-[#14283F]/10 text-xs text-[#14283F]/70 flex flex-wrap justify-between gap-2">
                  <span>
                    Mufti: <strong>{ftw.muftiName}</strong> · Sumber:{' '}
                    {ftw.sourceReference}
                  </span>
                  <span>Rujukan: {ftw.kitabReferences.join(', ')}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FORUM QUESTIONS & MODERATION */}
        {knowTab === 'forum' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#F5F0E4]/60 border border-[#C5A45B]/35 text-xs text-[#14283F]/80">
              <strong>Pemisahan Otoritas Keilmuan (PRD Section 11.2):</strong> Pertanyaan santri yang berstatus <em>Pending Moderation</em> atau <em>Waiting for Answer</em> tidak ditampilkan sebagai fatwa resmi dan memerlukan pemeriksaan sebelum dipublikasikan.
            </div>

            {db.questions.map((q) => (
              <div
                key={q.id}
                className="bg-white rounded-xl p-6 border border-[#14283F]/10 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="text-[#14283F]/65">
                    Bidang: <strong className="text-[#087451]">{q.category}</strong> ·
                    Penanya: <strong>{q.studentName}</strong> ·{' '}
                    <span className="font-mono-num">{q.createdAt}</span>
                  </div>
                  <span className="font-semibold text-[#14283F]">
                    Status Moderasi: {q.status}
                  </span>
                </div>

                <h4 className="text-base font-bold text-[#14283F]">{q.title}</h4>
                <p className="text-xs text-[#14283F]/80 leading-relaxed">
                  {q.questionText}
                </p>

                {q.answerText && (
                  <div className="p-4 rounded-lg bg-[#F5F0E4]/55 border border-[#C5A45B]/35 text-xs space-y-1">
                    <div className="font-bold text-[#087451]">
                      Jawaban Asatidzah ({q.answeredBy}):
                    </div>
                    <p className="text-[#14283F]/90 leading-relaxed">
                      {q.answerText}
                    </p>
                  </div>
                )}

                {canModerateOrAnswer && (
                  <div className="pt-3 border-t border-[#14283F]/10 space-y-2.5 text-xs">
                    <label className="block font-semibold text-[#14283F]">
                      Tulis / Edit Jawaban Ilmiah & Moderasi Status:
                    </label>
                    <textarea
                      rows={2}
                      value={
                        answerDrafts[q.id] !== undefined
                          ? answerDrafts[q.id]
                          : q.answerText || ''
                      }
                      onChange={(e) =>
                        setAnswerDrafts({
                          ...answerDrafts,
                          [q.id]: e.target.value,
                        })
                      }
                      placeholder="Tuliskan jawaban ilmiah beserta rujukan kitab..."
                      className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      {(
                        [
                          'Pending Moderation',
                          'Waiting for Answer',
                          'Under Review',
                          'Answered',
                          'Published',
                          'Rejected',
                        ] as const
                      ).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleModerateQuestion(q, st)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            q.status === st
                              ? 'bg-[#087451] text-white'
                              : 'bg-[#F5F0E4] text-[#14283F] hover:bg-[#C5A45B]/25'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ASK NEW QUESTION */}
        {knowTab === 'ask' && (
          <form
            onSubmit={handleAskQuestion}
            className="bg-white rounded-xl p-6 border border-[#14283F]/10 space-y-4 text-xs max-w-2xl"
          >
            <h3 className="text-base font-bold text-[#14283F]">
              Ajukan Pertanyaan Keilmuan ke Forum Tanya Jawab
            </h3>
            <div>
              <label className="block font-semibold mb-1">
                Kategori Bidang Keilmuan
              </label>
              <select
                value={askForm.category}
                onChange={(e) =>
                  setAskForm({
                    ...askForm,
                    category: e.target.value as ForumQuestion['category'],
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 bg-white"
              >
                <option value="Akidah">Akidah</option>
                <option value="Ibadah">Ibadah</option>
                <option value="Muamalah">Muamalah</option>
                <option value="Lughah">Lughah Arabiyyah</option>
                <option value="Hadis & Tafsir">Hadis & Tafsir</option>
                <option value="Adab">Adab Penuntut Ilmu</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Judul Pertanyaan *
              </label>
              <input
                type="text"
                required
                value={askForm.title}
                onChange={(e) =>
                  setAskForm({ ...askForm, title: e.target.value })
                }
                placeholder="Contoh: Kedudukan I’rab Mustatsna dengan Illa"
                className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Uraian Pertanyaan *
              </label>
              <textarea
                rows={4}
                required
                value={askForm.questionText}
                onChange={(e) =>
                  setAskForm({ ...askForm, questionText: e.target.value })
                }
                placeholder="Tuliskan konteks pertanyaan Anda dengan jelas..."
                className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#087451] text-white font-semibold flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Kirim Pertanyaan
            </button>
          </form>
        )}

        {/* FATWA MODAL */}
        {isFatwaModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-[#14283F]/65 backdrop-blur-xs flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ftw-modal-title"
          >
            <div className="bg-white border border-[#C5A45B]/40 rounded-xl max-w-xl w-full overflow-hidden shadow-xl">
              <div className="bg-[#14283F] text-white px-5 py-4 flex items-center justify-between">
                <h3 id="ftw-modal-title" className="text-sm font-bold">
                  Publikasi Dokumen Fatwa Resmi Terverifikasi
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFatwaModalOpen(false)}
                  aria-label="Tutup modal fatwa"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSaveFatwa} className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold mb-1">
                    Judul Ketetapan Fatwa *
                  </label>
                  <input
                    type="text"
                    required
                    value={fatwaForm.title}
                    onChange={(e) =>
                      setFatwaForm({ ...fatwaForm, title: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Kategori</label>
                    <select
                      value={fatwaForm.category}
                      onChange={(e) =>
                        setFatwaForm({
                          ...fatwaForm,
                          category: e.target.value as FatwaRecord['category'],
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 bg-white"
                    >
                      <option value="Akidah">Akidah</option>
                      <option value="Ibadah">Ibadah</option>
                      <option value="Muamalah">Muamalah</option>
                      <option value="Adab & Akhlak">Adab & Akhlak</option>
                      <option value="Kontemporer">Kontemporer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">
                      Pemberi Fatwa (Mufti)
                    </label>
                    <input
                      type="text"
                      value={fatwaForm.muftiName}
                      onChange={(e) =>
                        setFatwaForm({
                          ...fatwaForm,
                          muftiName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Konteks Pertanyaan (Istifta’) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={fatwaForm.questionContext}
                    onChange={(e) =>
                      setFatwaForm({
                        ...fatwaForm,
                        questionContext: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Uraian Jawaban & Dalil *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={fatwaForm.answerContent}
                    onChange={(e) =>
                      setFatwaForm({
                        ...fatwaForm,
                        answerContent: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFatwaModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-[#14283F]/20 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#087451] text-white font-semibold"
                  >
                    Publikasikan Fatwa
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // MODE 2: ANALYTICS & REPORTING (PRD Section 12)
  if (mode === 'reports') {
    const activeStudents = db.students.filter(
      (s) => s.accountStatus === 'Active'
    ).length;
    const archivedStudents = db.students.length - activeStudents;
    const verifiedBooksCount = db.books.filter(
      (b) => b.verificationStatus === 'Verified'
    ).length;

    const handleExportFullReportCsv = () => {
      const rows = [
        ['Metrik Laporan', 'Nilai Tercatat Database', 'Keterangan'],
        ['Total Santri', String(db.students.length), `${activeStudents} Aktif / ${archivedStudents} Nonaktif`],
        ['Total Pengajar', String(db.teachers.length), 'Asatidzah Aktif'],
        ['Total Program', String(db.programs.length), 'Program Studi'],
        ['Total Kelas', String(db.classes.length), 'Halaqah'],
        ['Total Silsilah Perpustakaan', String(db.libraryCategories.length), '9 Silsilah Utama'],
        ['Total Koleksi Kitab', String(db.books.length), `${verifiedBooksCount} Terverifikasi`],
        ['Total Fatwa Resmi', String(db.fatwas.length), 'Dewan Syariah'],
        ['Total Aktivitas Tercatat', String(db.activityLogs.length), 'Audit Log'],
      ];
      const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan_akademik_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      onNotify('Laporan berhasil diekspor dalam format CSV.', 'success');
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-5 border border-[#14283F]/10 flex flex-wrap items-center justify-between gap-4 no-print">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'academic', label: '1. Laporan Akademik' },
              { id: 'teacher', label: '2. Laporan Pengajar' },
              { id: 'library', label: '3. Laporan Perpustakaan' },
              { id: 'operational', label: '4. Operasional & Audit Log' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setRepTab(t.id as typeof repTab)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  repTab === t.id
                    ? 'bg-[#087451] text-white'
                    : 'bg-[#F5F0E4]/60 text-[#14283F]/75 hover:text-[#14283F]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportFullReportCsv}
              className="px-3.5 py-2 text-xs font-semibold text-[#14283F] bg-[#F5F0E4] rounded-lg flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#14283F] rounded-lg flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Laporan (Print)
            </button>
          </div>
        </div>

        {repTab === 'academic' && (
          <div className="bg-white rounded-xl p-6 border border-[#14283F]/10 space-y-6">
            <h3 className="text-base font-bold text-[#14283F]">
              Laporan Akademik & Statistik Evaluasi Santri (Data Aktual Database)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#F5F0E4]/55">
                <div className="text-[#14283F]/65">Total Santri (Aktif / Arsip)</div>
                <div className="text-xl font-bold font-mono-num mt-1">
                  {db.students.length} ({activeStudents} / {archivedStudents})
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#F5F0E4]/55">
                <div className="text-[#14283F]/65">Program & Kelas Aktif</div>
                <div className="text-xl font-bold font-mono-num mt-1">
                  {db.programs.length} Program · {db.classes.length} Kelas
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#F5F0E4]/55">
                <div className="text-[#14283F]/65">Sesi Absensi Tercatat</div>
                <div className="text-xl font-bold font-mono-num mt-1">
                  {db.attendanceSessions.length} Pertemuan
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#F5F0E4]/55">
                <div className="text-[#14283F]/65">Rata-Rata Nilai Akademik</div>
                <div className="text-xl font-bold font-mono-num mt-1 text-[#087451]">
                  {db.grades.length > 0
                    ? Math.round(
                        db.grades.reduce((a, b) => a + b.score, 0) /
                          db.grades.length
                      )
                    : 0}{' '}
                  / 100
                </div>
              </div>
            </div>
          </div>
        )}

        {repTab === 'teacher' && (
          <div className="bg-white rounded-xl p-6 border border-[#14283F]/10 space-y-4">
            <h3 className="text-base font-bold text-[#14283F]">
              Laporan Beban Mengajar & Aktivitas Asatidzah
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#14283F]/15 text-[#14283F]/70">
                    <th className="py-3 px-3 font-semibold">NIP</th>
                    <th className="py-3 px-3 font-semibold">Nama Pengajar</th>
                    <th className="py-3 px-3 font-semibold">Jumlah Kelas</th>
                    <th className="py-3 px-3 font-semibold">Jadwal Aktif</th>
                    <th className="py-3 px-3 font-semibold">Materi Diunggah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#14283F]/10">
                  {db.teachers.map((tch) => {
                    const clsCount = db.classes.filter(
                      (c) => c.teacherId === tch.id
                    ).length;
                    const schCount = db.schedules.filter(
                      (s) => s.teacherId === tch.id
                    ).length;
                    const matCount = db.materials.filter((m) =>
                      m.uploadedBy.includes(tch.fullName.split(' ')[1] || '')
                    ).length;
                    return (
                      <tr key={tch.id}>
                        <td className="py-3 px-3 font-mono-num font-bold text-[#087451]">
                          {tch.nip}
                        </td>
                        <td className="py-3 px-3 font-semibold">
                          {tch.fullName}
                        </td>
                        <td className="py-3 px-3 font-mono-num">
                          {clsCount} Kelas
                        </td>
                        <td className="py-3 px-3 font-mono-num">
                          {schCount} Sesi
                        </td>
                        <td className="py-3 px-3 font-mono-num">
                          {matCount} Modul
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {repTab === 'library' && (
          <div className="bg-white rounded-xl p-6 border border-[#14283F]/10 space-y-4">
            <h3 className="text-base font-bold text-[#14283F]">
              Laporan Perpustakaan Digital & 9 Silsilah Keilmuan
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#F5F0E4]/55">
                <div className="text-[#14283F]/65">Total Koleksi Kitab</div>
                <div className="text-xl font-bold font-mono-num mt-1">
                  {db.books.length} Kitab
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#F5F0E4]/55">
                <div className="text-[#14283F]/65">Silsilah & Subkategori</div>
                <div className="text-xl font-bold font-mono-num mt-1">
                  {db.libraryCategories.length} Silsilah ·{' '}
                  {db.librarySubcategories.length} Sub
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#F5F0E4]/55">
                <div className="text-[#14283F]/65">Status Verifikasi</div>
                <div className="text-xl font-bold font-mono-num mt-1 text-[#087451]">
                  {verifiedBooksCount} Verified
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#F5F0E4]/55">
                <div className="text-[#14283F]/65">Total Akses Baca</div>
                <div className="text-xl font-bold font-mono-num mt-1">
                  {db.books.reduce((a, b) => a + b.accessCount, 0)} Akses
                </div>
              </div>
            </div>
          </div>
        )}

        {repTab === 'operational' && (
          <div className="bg-white rounded-xl p-6 border border-[#14283F]/10 space-y-4">
            <h3 className="text-base font-bold text-[#14283F]">
              Log Aktivitas Pengguna & Audit Perubahan Data ({db.activityLogs.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#14283F]/15 text-[#14283F]/70">
                    <th className="py-2.5 px-3 font-semibold">Waktu</th>
                    <th className="py-2.5 px-3 font-semibold">Pelaku & Role</th>
                    <th className="py-2.5 px-3 font-semibold">Modul & Aksi</th>
                    <th className="py-2.5 px-3 font-semibold">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#14283F]/10">
                  {db.activityLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F5F0E4]/40">
                      <td className="py-2.5 px-3 font-mono-num text-[#14283F]/65">
                        {new Date(log.timestamp).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3">
                        <strong className="text-[#14283F]">
                          {log.actorName}
                        </strong>{' '}
                        <span className="text-[#14283F]/60">
                          ({log.actorRole})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono-num font-semibold text-[#087451]">
                        [{log.module}] {log.action}
                      </td>
                      <td className="py-2.5 px-3">{log.targetDescription}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // MODE 3: SYSTEM SETTINGS, GOOGLE SHEET APPS SCRIPT & VERCEL CONFIGURATION (SUPER ADMIN + OWNER PASSCODE 2026)
  if (currentUser.role !== 'super_admin') {
    return (
      <div className="bg-white rounded-xl p-8 border border-[#14283F]/10 text-center space-y-2">
        <h3 className="text-base font-bold text-[#14283F]">
          Akses Terbatas — Khusus Super Admin
        </h3>
        <p className="text-xs text-[#14283F]/75">
          Halaman pengaturan database sinkronisasi dan konfigurasi sistem hanya dapat diakses oleh Super Admin.
        </p>
      </div>
    );
  }

  const handleUnlockSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyOwnerSettingsPasscode(ownerPasscodeInput)) {
      setIsOwnerUnlocked(true);
      setOwnerPasscodeError('');
      setOwnerPasscodeInput('');
      onNotify(
        'Verifikasi kode pemilik berhasil! Pengaturan Sistem telah dibuka.',
        'success'
      );
    } else {
      setOwnerPasscodeError(
        'Kode password pemilik tidak sesuai. Hanya pemilik otoritas yang dapat membuka Pengaturan Sistem.'
      );
      onNotify('Kode password pemilik salah.', 'error');
    }
  };

  if (!isOwnerUnlocked) {
    return (
      <div className="max-w-md mx-auto my-8">
        <div className="bg-white rounded-2xl border border-[#C5A45B]/55 shadow-xl overflow-hidden islamic-pattern-subtle">
          <div className="bg-[#14283F] text-white px-6 py-5 border-b border-[#C5A45B]/35 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#C5A45B]/20 border border-[#C5A45B]/50 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-[#C5A45B]" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#C5A45B] tracking-wide">
                Otorisasi Khusus Pemilik (Owner Security Gate)
              </div>
              <h3 className="text-base font-display font-bold text-white">
                Pengaturan Sistem Terkunci
              </h3>
            </div>
          </div>

          <form
            onSubmit={handleUnlockSettings}
            className="p-6 bg-white/95 space-y-4 text-xs"
          >
            <p className="text-[#14283F]/80 leading-relaxed">
              Halaman <strong>Pengaturan Sistem &amp; Integrasi Database (Code.gs &amp; Setup.gs)</strong> dilindungi dengan kode rahasia pemilik. Silakan masukkan kode password pemilik untuk melanjutkan.
            </p>

            {ownerPasscodeError && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-red-500/15 border border-red-500/40 text-red-600 font-semibold"
              >
                {ownerPasscodeError}
              </div>
            )}

            <div>
              <label
                htmlFor="owner-settings-passcode"
                className="block font-semibold text-[#14283F] mb-1.5"
              >
                Kode Password Pemilik *
              </label>
              <div className="relative">
                <input
                  id="owner-settings-passcode"
                  type="password"
                  inputMode="numeric"
                  autoFocus
                  required
                  value={ownerPasscodeInput}
                  onChange={(e) => {
                    setOwnerPasscodeInput(e.target.value);
                    if (ownerPasscodeError) setOwnerPasscodeError('');
                  }}
                  placeholder="Masukkan kode password pemilik..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#14283F]/25 text-sm font-mono-num tracking-widest focus:outline-none focus:border-[#087451]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-5 py-2.5 rounded-lg bg-[#087451] hover:bg-[#065d40] text-white font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              Buka Pengaturan Sistem
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await onMutate({
      moduleKey: 'settings',
      action: 'edit',
      actionLabel: 'SIMPAN_PENGATURAN_SISTEM',
      targetDescription: 'Memperbarui konfigurasi sistem akademi',
      updater: (prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          ...settingsForm,
        },
      }),
    });
    onNotify('Pengaturan sistem berhasil disimpan dan disinkronkan.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Status Bar Otorisasi Pemilik */}
      <div className="bg-white rounded-xl px-5 py-3.5 border border-[#087451]/35 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#087451] font-semibold">
          <Unlock className="w-4 h-4 shrink-0" />
          <span>Akses Pemilik Terverifikasi — Pengaturan Sistem &amp; Database Aktif</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsOwnerUnlocked(false);
            setOwnerPasscodeInput('');
            onNotify('Pengaturan Sistem telah dikunci kembali.', 'success');
          }}
          className="px-3 py-1.5 rounded-lg bg-[#F5F0E4] hover:bg-[#C5A45B]/25 text-[#14283F] border border-[#14283F]/15 font-semibold flex items-center gap-1.5"
        >
          <Lock className="w-3.5 h-3.5 text-[#C5A45B]" />
          Kunci Kembali Pengaturan
        </button>
      </div>

      {/* A. Banner Integrasi Apps Script - Google Sheet (Exclusively in Super Admin Settings) */}
      <div className="bg-[#14283F] text-white rounded-xl p-6 border border-[#C5A45B]/45 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#C5A45B]">
            <span>Pusat Database Super Admin</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num">Revisi Database #{db.revision}</span>
            <span aria-hidden="true">·</span>
            <span>Real-Time Sync HP &amp; PC</span>
          </div>
          <h3 className="text-lg font-bold">
            A. Integrasi Database Google Apps Script — Google Sheet (Code.gs &amp; Setup.gs)
          </h3>
          <p className="text-xs text-[#F5F0E4]/85 leading-relaxed">
            Status Koneksi: <strong>{db.settings.googleSheetSync.lastSyncStatus}</strong> ({db.settings.googleSheetSync.lastSyncMessage}). Kode Google Apps Script telah dipisahkan menjadi 2 file terstruktur: <code>Code.gs</code> (API Sync Real-Time) dan <code>Setup.gs</code> (Inisialisasi 21 Tab Database).
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenSyncModal}
          className="px-4 py-2.5 text-xs font-semibold text-white bg-[#087451] hover:bg-[#065d40] rounded-lg flex items-center gap-2 shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Konfigurasi Apps Script &amp; Google Sheet
        </button>
      </div>

      {/* B. Integrasi & Kesiapan Deployment Vercel.app */}
      <div className="bg-white rounded-xl p-6 border border-[#14283F]/10 space-y-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-[#087451]">
              Cloud Deployment &amp; Serverless Architecture
            </div>
            <h3 className="text-base font-bold text-[#14283F]">
              B. Integrasi Environment &amp; Deployment Vercel.app (*.vercel.app)
            </h3>
          </div>
          <span className="px-3 py-1 rounded-md bg-[#087451]/15 text-[#087451] font-semibold">
            Vercel Build &amp; 1-Env-Var Ready
          </span>
        </div>
        <p className="text-[#14283F]/80 leading-relaxed">
          Anda dapat memasang link database Google Apps Script langsung pada kolom Environment di bawah ini sebelum deploy, maupun pada kolom <strong>Environment Variables</strong> di Vercel dengan cukup <strong>1 Environment Variable</strong> saja (Key: <code>VITE_APPS_SCRIPT_URL</code>). Konflik peer dependency <code>esbuild</code> pada Vercel juga telah diperbaiki melalui <code>package.json</code> (<code>esbuild@^0.28.0</code>), <code>.npmrc</code>, dan <code>vercel.json</code>.
        </p>

        {/* Inline Environment Variable Input right here in Settings */}
        <div className="p-4 rounded-xl bg-[#F5F0E4]/65 border border-[#C5A45B]/40 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-[#14283F]">
              Pasang Environment Variable Database Disini (Sebelum / Saat Deploy Vercel)
            </span>
            <code className="px-2 py-0.5 rounded bg-[#14283F] text-[#F5F0E4] font-mono-num text-[11px]">
              Key: VITE_APPS_SCRIPT_URL
            </code>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
            <div className="sm:col-span-9">
              <label
                htmlFor="inline-vite-apps-script-url"
                className="block font-semibold text-[#14283F] mb-1"
              >
                Value (Link Web App Google Apps Script Anda)
              </label>
              <input
                id="inline-vite-apps-script-url"
                type="url"
                value={inlineAppsScriptUrl}
                onChange={(e) => setInlineAppsScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#14283F]/20 bg-white font-mono-num text-xs focus:outline-none focus:border-[#087451]"
              />
            </div>
            <div className="sm:col-span-3">
              <button
                type="button"
                onClick={async () => {
                  const nextUrl = inlineAppsScriptUrl.trim();
                  await onMutate({
                    moduleKey: 'settings',
                    action: 'edit',
                    actionLabel: 'PASANG_ENV_APPS_SCRIPT',
                    targetDescription:
                      'Memasang link VITE_APPS_SCRIPT_URL untuk sinkronisasi Vercel & Google Sheet',
                    updater: (prev) => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        googleSheetSync: {
                          ...prev.settings.googleSheetSync,
                          appsScriptWebAppUrl: nextUrl,
                          lastSyncStatus: nextUrl
                            ? 'Connected & Synced'
                            : 'Local Real-Time Mode',
                          lastSyncMessage: nextUrl
                            ? 'Terhubung ke VITE_APPS_SCRIPT_URL & siap sinkronisasi real-time di Vercel.'
                            : prev.settings.googleSheetSync.lastSyncMessage,
                        },
                      },
                    }),
                  });
                  onNotify(
                    'Environment VITE_APPS_SCRIPT_URL berhasil dipasang & disinkronkan!',
                    'success'
                  );
                }}
                className="w-full px-4 py-2.5 rounded-lg bg-[#087451] hover:bg-[#065d40] text-white font-semibold transition-colors"
              >
                Pasang &amp; Simpan Environment
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-lg bg-[#F5F0E4]/55 border border-[#14283F]/10">
            <div className="font-bold text-[#14283F]">1. Build &amp; Peer Deps Fixed</div>
            <div className="text-[#14283F]/75 mt-1 font-mono-num">
              esbuild@^0.28.0 · .npmrc · legacy-peer-deps
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-[#F5F0E4]/55 border border-[#14283F]/10">
            <div className="font-bold text-[#14283F]">2. 1 Environment Variable</div>
            <div className="text-[#14283F]/75 mt-1 font-mono-num">
              Key: VITE_APPS_SCRIPT_URL
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-[#F5F0E4]/55 border border-[#14283F]/10">
            <div className="font-bold text-[#14283F]">3. Auto-Sync HP &amp; PC</div>
            <div className="text-[#14283F]/75 mt-1">
              Otomatis Push &amp; Pull ke Google Sheet melalui Apps Script
            </div>
          </div>
        </div>
      </div>

      {/* General Settings Form */}
      <form
        onSubmit={handleSaveSettings}
        className="bg-white rounded-xl p-6 border border-[#14283F]/10 space-y-4 text-xs"
      >
        <h3 className="text-base font-bold text-[#14283F]">
          Pengaturan Identitas & Kebijakan Akademi
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">Nama Akademi</label>
            <input
              type="text"
              value={settingsForm.academyName}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  academyName: e.target.value,
                })
              }
              className="w-full px-3.5 py-2 rounded-lg border border-[#14283F]/20"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">
              Nama Akademi (Bahasa Arab - RTL)
            </label>
            <input
              type="text"
              dir="rtl"
              value={settingsForm.academyArabicName}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  academyArabicName: e.target.value,
                })
              }
              className="w-full px-3.5 py-2 rounded-lg border border-[#14283F]/20 font-arabic text-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold mb-1">Tahun Akademik</label>
            <input
              type="text"
              value={settingsForm.academicYear}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  academicYear: e.target.value,
                })
              }
              className="w-full px-3.5 py-2 rounded-lg border border-[#14283F]/20"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">
              Zona Waktu Default
            </label>
            <input
              type="text"
              value={settingsForm.timezone}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, timezone: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-lg border border-[#14283F]/20 font-mono-num"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">
              Email Sekretariat
            </label>
            <input
              type="email"
              value={settingsForm.contactEmail}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  contactEmail: e.target.value,
                })
              }
              className="w-full px-3.5 py-2 rounded-lg border border-[#14283F]/20"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={settingsForm.allowPublicRegistration}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  allowPublicRegistration: e.target.checked,
                })
              }
            />
            <span>
              Buka Formulir Pendaftaran Santri Baru di Portal Publik
            </span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={settingsForm.requireBookVerificationBeforeDownload}
              onChange={(e) =>
                setSettingsForm({
                  ...settingsForm,
                  requireBookVerificationBeforeDownload: e.target.checked,
                })
              }
            />
            <span>
              Wajibkan Status &ldquo;Verified&rdquo; dan Izin Distribusi Jelas Sebelum Mengizinkan Unduhan File Kitab (PRD Section 9.4)
            </span>
          </label>
        </div>

        <div className="pt-3 border-t border-[#14283F]/10">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-[#087451] hover:bg-[#065d40] text-white font-semibold"
          >
            Simpan Pengaturan Sistem
          </button>
        </div>
      </form>
    </div>
  );
}
