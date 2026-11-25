import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LogIn,
  Menu,
  MessageSquare,
  Moon,
  Scale,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import {
  AcademyDatabase,
  AdmissionApplication,
  ModuleKey,
  PermissionAction,
  UserAccount,
} from '../types/database';
import {
  BerandaCelestialAura,
  IslamicAcademyLogo,
  IslamicSectionDivider,
} from './IslamicOrnament';
import { LibraryModule } from './LibraryModule';
import { ScrollReveal } from './ScrollReveal';
import { LanguageSwitcher } from './LanguageSwitcher';
import { AppLanguage } from '../utils/i18n';

export type PublicPageId =
  | 'beranda'
  | 'program'
  | 'perpustakaan'
  | 'fatwa'
  | 'pendaftaran';

interface PublicPortalProps {
  db: AcademyDatabase;
  currentUser: UserAccount | null;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  language: AppLanguage;
  onChangeLanguage: (nextLang: AppLanguage) => void;
  onLoginSuccess: (user: UserAccount) => void;
  onEnterWorkspace: () => void;
  onMutate: (params: {
    moduleKey: ModuleKey;
    action: PermissionAction;
    actionLabel: string;
    targetDescription: string;
    updater: (prev: AcademyDatabase) => AcademyDatabase;
    isPublicAction?: boolean;
  }) => Promise<void>;
  onUploadFile: (file: File) => Promise<{
    fileUrl: string;
    fileName: string;
    fileSizeKb: number;
  } | null>;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export function PublicPortal({
  db,
  currentUser,
  theme,
  onToggleTheme,
  language,
  onChangeLanguage,
  onLoginSuccess,
  onEnterWorkspace,
  onMutate,
  onUploadFile,
  onNotify,
}: PublicPortalProps) {
  const [activePage, setActivePage] = useState<PublicPageId>('beranda');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [spotlightPos, setSpotlightPos] = useState({ x: 68, y: 38 });

  // Login & Password Reset Modal State
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'reset'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetWhatsapp, setResetWhatsapp] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Admission Form State (PRD Section 7.4)
  const [admForm, setAdmForm] = useState({
    fullName: '',
    email: '',
    whatsapp: '',
    gender: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
    city: '',
    programId: db.programs[0]?.id || 'prg-lughah',
    backgroundNotes: '',
  });
  const [lastSubmittedRegNo, setLastSubmittedRegNo] = useState<string | null>(
    null
  );

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAuthError(data.error || 'Gagal login.');
        return;
      }
      setIsLoginOpen(false);
      onLoginSuccess(data.user);
    } catch {
      // Fallback authentication for static Vercel deployment
      const cleanId = identifier.trim().toLowerCase();
      const matched = db.users.find(
        (u) =>
          (u.username.toLowerCase() === cleanId ||
            u.email.toLowerCase() === cleanId) &&
          u.passwordHash === password
      );
      if (matched && matched.status === 'Active') {
        setIsLoginOpen(false);
        onLoginSuccess(matched);
      } else {
        setAuthError(
          'Kredensial tidak valid. Periksa kembali username/email dan kata sandi Anda.'
        );
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          whatsapp: resetWhatsapp,
          newPassword: resetNewPass,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAuthError(data.error || 'Gagal mereset password.');
        return;
      }
      onNotify(data.message || 'Password berhasil diperbarui.', 'success');
      setAuthMode('login');
      setIdentifier(resetEmail);
      setPassword(resetNewPass);
    } catch {
      setAuthError('Gagal menghubungi layanan reset password.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !admForm.fullName.trim() ||
      !admForm.email.trim() ||
      !admForm.whatsapp.trim() ||
      !admForm.city.trim()
    ) {
      onNotify('Mohon lengkapi seluruh kolom wajib pendaftaran.', 'error');
      return;
    }

    const regNo = `REG-2026-${1040 + db.admissions.length + 1}`;
    const newApplication: AdmissionApplication = {
      id: `adm-${Date.now()}`,
      registrationNumber: regNo,
      fullName: admForm.fullName.trim(),
      email: admForm.email.trim(),
      whatsapp: admForm.whatsapp.trim(),
      gender: admForm.gender,
      city: admForm.city.trim(),
      programId: admForm.programId,
      backgroundNotes: admForm.backgroundNotes.trim(),
      status: 'Pending',
      submittedAt: new Date().toISOString(),
    };

    await onMutate({
      moduleKey: 'academic',
      action: 'create',
      actionLabel: 'PENDAFTARAN_SANTRI_BARU',
      targetDescription: `Pendaftaran santri baru ${newApplication.fullName} (${regNo})`,
      isPublicAction: true,
      updater: (prev) => ({
        ...prev,
        admissions: [newApplication, ...prev.admissions],
      }),
    });

    setLastSubmittedRegNo(regNo);
    setAdmForm({
      fullName: '',
      email: '',
      whatsapp: '',
      gender: 'Laki-laki',
      city: '',
      programId: db.programs[0]?.id || 'prg-lughah',
      backgroundNotes: '',
    });
    onNotify(
      `Formulir pendaftaran berhasil dikirim! Nomor Registrasi Anda: ${regNo}`,
      'success'
    );
  };

  const publishedAnnouncements = db.announcements.filter(
    (a) =>
      a.status === 'Published' &&
      (a.targetAudience === 'Public' || a.targetAudience === 'All Users')
  );
  const verifiedFatwas = db.fatwas.filter(
    (f) => f.verificationStatus === 'Verified'
  );
  const publishedAnswers = db.questions.filter(
    (q) => q.status === 'Published' && q.answerText
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E4] text-[#14283F] overflow-x-hidden">
      {/* RESPONSIVE 3-ZONE TOP BAR CONTRACT */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-[#14283F]/10 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Brand Emblem & Wordmark */}
        <a
          href="#beranda"
          onClick={(e) => {
            e.preventDefault();
            setActivePage('beranda');
          }}
          className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-lg font-display font-bold tracking-tight text-[#14283F] min-w-0"
        >
          <IslamicAcademyLogo className="w-6 h-6 sm:w-8 sm:h-8 shrink-0" />
          <span className="truncate">Islamic Academy Portal</span>
        </a>

        {/* Zone 2: 5 clean single-line text navigation links */}
        <nav
          aria-label="Navigasi Portal Publik"
          className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#14283F]/75"
        >
          <button
            type="button"
            onClick={() => setActivePage('beranda')}
            className={`hover:text-[#087451] hover:underline transition-colors whitespace-nowrap shrink-0 ${
              activePage === 'beranda' ? 'text-[#087451] font-semibold underline' : ''
            }`}
          >
            Beranda
          </button>
          <button
            type="button"
            onClick={() => setActivePage('program')}
            className={`hover:text-[#087451] hover:underline transition-colors whitespace-nowrap shrink-0 ${
              activePage === 'program' ? 'text-[#087451] font-semibold underline' : ''
            }`}
          >
            Program & Jadwal
          </button>
          <button
            type="button"
            onClick={() => setActivePage('perpustakaan')}
            className={`hover:text-[#087451] hover:underline transition-colors whitespace-nowrap shrink-0 ${
              activePage === 'perpustakaan'
                ? 'text-[#087451] font-semibold underline'
                : ''
            }`}
          >
            Perpustakaan 9 Silsilah
          </button>
          <button
            type="button"
            onClick={() => setActivePage('fatwa')}
            className={`hover:text-[#087451] hover:underline transition-colors whitespace-nowrap shrink-0 ${
              activePage === 'fatwa' ? 'text-[#087451] font-semibold underline' : ''
            }`}
          >
            Fatwa & Tanya Jawab
          </button>
          <button
            type="button"
            onClick={() => setActivePage('pendaftaran')}
            className={`hover:text-[#087451] hover:underline transition-colors whitespace-nowrap shrink-0 ${
              activePage === 'pendaftaran'
                ? 'text-[#087451] font-semibold underline'
                : ''
            }`}
          >
            Pendaftaran Santri
          </button>
        </nav>

        {/* Zone 3: Language Switcher + Dark/Light Theme Toggle + Primary Portal Action */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          <LanguageSwitcher
            language={language}
            onChangeLanguage={onChangeLanguage}
          />
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Ganti Tema Gelap atau Terang"
            title={
              theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'
            }
            className="p-1.5 sm:p-2 rounded-lg border border-[#14283F]/15 bg-[#F5F0E4]/60 text-[#14283F] hover:border-[#C5A45B] transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-[#C5A45B]" />
                <span className="hidden sm:inline">Mode Terang</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[#087451]" />
                <span className="hidden sm:inline">Mode Gelap</span>
              </>
            )}
          </button>

          {currentUser ? (
            <button
              type="button"
              onClick={onEnterWorkspace}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-white bg-[#087451] hover:bg-[#065d40] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Buka Dashboard ({currentUser.fullName.split(' ')[0]})
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsLoginOpen(true)}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-white bg-[#087451] hover:bg-[#065d40] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Masuk Portal
            </button>
          )}
          <button
            type="button"
            aria-label="Menu Navigasi Mobile"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 rounded-lg text-[#14283F] hover:bg-[#F5F0E4]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Touch-Friendly Horizontal Quick Navigation Bar */}
      <nav
        aria-label="Navigasi Cepat Mobile"
        className="lg:hidden bg-white/95 border-b border-[#14283F]/10 px-3 py-2 flex items-center gap-1.5 overflow-x-auto"
      >
        {(
          [
            { id: 'beranda', label: 'Beranda' },
            { id: 'program', label: 'Program & Jadwal' },
            { id: 'perpustakaan', label: 'Perpustakaan 9 Silsilah' },
            { id: 'fatwa', label: 'Fatwa & Tanya Jawab' },
            { id: 'pendaftaran', label: 'Pendaftaran Santri' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setActivePage(item.id);
              setMobileMenuOpen(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              activePage === item.id
                ? 'bg-[#087451] text-white'
                : 'bg-[#F5F0E4]/75 text-[#14283F]/80 hover:text-[#14283F]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#14283F]/10 px-4 py-3 flex flex-col gap-1.5 text-xs">
          {(
            [
              { id: 'beranda', label: 'Beranda & Profil Akademi' },
              { id: 'program', label: 'Katalog Program & Jadwal' },
              { id: 'perpustakaan', label: 'Perpustakaan Digital 9 Silsilah' },
              { id: 'fatwa', label: 'Pusat Fatwa & Tanya Jawab' },
              { id: 'pendaftaran', label: 'Formulir Pendaftaran Santri' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActivePage(item.id);
                setMobileMenuOpen(false);
              }}
              className={`text-left px-3 py-2.5 rounded-lg font-medium ${
                activePage === item.id
                  ? 'bg-[#087451]/10 text-[#087451] font-bold'
                  : 'text-[#14283F] hover:bg-[#F5F0E4]/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* MAIN CONTENT VIEWPORT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-10 overflow-x-hidden">
        {/* PAGE 1: BERANDA & PROFIL AKADEMI */}
        {activePage === 'beranda' && (
          <div className="space-y-6 sm:space-y-10">
            {/* Hero Section with Interactive Celestial Light & Sacred Geometry Animation */}
            <section
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                setSpotlightPos({ x, y });
              }}
              className="relative overflow-hidden bg-[#14283F] text-white rounded-2xl p-4 sm:p-8 lg:p-10 border border-[#C5A45B]/55 shadow-2xl islamic-pattern-subtle"
            >
              {/* Animated Celestial Light Rays, Rotating Shamsa Mandala & Floating Nur Particles */}
              <BerandaCelestialAura spotlightPos={spotlightPos} />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                <ScrollReveal direction="left" className="lg:col-span-8 space-y-3.5 sm:space-y-4">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-[#C5A45B] font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-[#F8E5A8] animate-pulse shrink-0" />
                    <span>{db.settings.academyName}</span>
                    <span aria-hidden="true">·</span>
                    <span>Tahun Akademik {db.settings.academicYear}</span>
                  </div>

                  <p
                    className="font-arabic text-xl sm:text-3xl lg:text-4xl font-bold text-left text-gold-shimmer"
                    dir="rtl"
                  >
                    {db.settings.academyArabicName}
                  </p>

                  <h1
                    className="text-xl sm:text-4xl lg:text-5xl font-display font-bold text-white leading-snug sm:leading-tight"
                    style={{ textWrap: 'balance' }}
                  >
                    Pendidikan Akademik Islam Terpadu, Pembelajaran Talaqqi & Pusat Dokumentasi Kitab Turats
                  </h1>

                  <p className="text-xs sm:text-base text-[#F5F0E4]/90 max-w-2xl leading-relaxed">
                    Platform manajemen akademi pendidikan Islam terintegrasi yang menyatukan administrasi santri & asatidzah, LMS interaktif, Perpustakaan Digital 9 Silsilah Keilmuan dengan verifikasi hak distribusi, serta Pusat Fatwa & Tanya Jawab.
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                    <button
                      type="button"
                      onClick={() => setActivePage('pendaftaran')}
                      className="w-full sm:w-auto justify-center px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#087451] hover:bg-[#065d40] shadow-[0_0_24px_rgba(8,116,81,0.55)] rounded-lg flex items-center gap-2 transition-all"
                    >
                      Daftar Santri Baru
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePage('perpustakaan')}
                      className="w-full sm:w-auto justify-center px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#F5F0E4] bg-white/10 hover:bg-white/20 border border-[#C5A45B]/55 rounded-lg flex items-center transition-all backdrop-blur-xs"
                    >
                      Jelajahi 9 Silsilah Kitab
                    </button>
                  </div>
                </ScrollReveal>

                {/* Live Institutional Summary Panel */}
                <ScrollReveal
                  direction="right"
                  delay={0.12}
                  className="lg:col-span-4 bg-[#0D1B2D]/75 backdrop-blur-md border border-[#C5A45B]/45 rounded-xl p-4 sm:p-6 space-y-3.5 sm:space-y-4 shadow-xl"
                >
                  <div className="text-xs font-semibold text-[#C5A45B] border-b border-white/10 pb-2 flex items-center justify-between">
                    <span>Profil & Statistik Akademik</span>
                    <span className="inline-block w-2 h-2 rounded-full bg-[#34D399] animate-ping" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold font-mono-num text-white">
                        {db.students.filter((s) => s.accountStatus === 'Active').length}
                      </div>
                      <div className="text-xs text-[#F5F0E4]/75">Santri Aktif</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold font-mono-num text-white">
                        {db.teachers.filter((t) => t.accountStatus === 'Active').length}
                      </div>
                      <div className="text-xs text-[#F5F0E4]/75">Asatidzah Pengajar</div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-bold font-mono-num text-[#C5A45B] whitespace-nowrap">
                        {db.libraryCategories.length} Silsilah
                      </div>
                      <div className="text-xs text-[#F5F0E4]/75">
                        {db.books.length} Kitab Terdokumentasi
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold font-mono-num text-white">
                        {db.classes.filter((c) => c.status === 'Active').length}
                      </div>
                      <div className="text-xs text-[#F5F0E4]/75">Halaqah Kelas Aktif</div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/10 text-xs text-[#F5F0E4]/80 space-y-1">
                    <div>Zona Waktu: {db.settings.timezone} (WIB)</div>
                    <div className="truncate">Kontak: {db.settings.contactEmail}</div>
                  </div>
                </ScrollReveal>
              </div>
            </section>

            {/* Profil Akademi & Papan Pengumuman */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <ScrollReveal
                direction="left"
                className="lg:col-span-7 bg-white rounded-xl p-6 border border-[#14283F]/10 space-y-4"
              >
                <div className="text-xs font-semibold text-[#087451]">
                  01. Profil Akademi & Manhaj Pembelajaran
                </div>
                <h2 className="text-xl font-display font-bold text-[#14283F]">
                  Memadukan Tradisi Keilmuan Turats Bersanad dengan Teknologi Akademik Modern
                </h2>
                <p className="text-xs sm:text-sm text-[#14283F]/80 leading-relaxed">
                  <strong>{db.settings.academyName}</strong> dirancang sebagai pusat pendidikan Islam berjenjang yang menjaga kemurnian metodologi belajar kitab klasik (turats) melalui 9 Silsilah Keilmuan, dilengkapi sistem evaluasi terukur, dokumentasi bibliografi yang menghormati hak distribusi, dan akses pembelajaran multi-perangkat (Mobile & Desktop).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-lg bg-[#F5F0E4]/55 border border-[#14283F]/10">
                    <div className="text-xs font-bold text-[#14283F]">
                      Kurikulum Berjenjang
                    </div>
                    <p className="text-xs text-[#14283F]/75 mt-1">
                      Mulai dari tingkat Mubtadi’ (Pemula), Mutawassith (Menengah), hingga Mutaqaddim (Lanjutan).
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#F5F0E4]/55 border border-[#14283F]/10">
                    <div className="text-xs font-bold text-[#14283F]">
                      Kredibilitas Bibliografi
                    </div>
                    <p className="text-xs text-[#14283F]/75 mt-1">
                      Setiap kitab dilengkapi sumber biografi ulama, status verifikasi, dan kejelasan izin distribusi.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#F5F0E4]/55 border border-[#14283F]/10">
                    <div className="text-xs font-bold text-[#14283F]">
                      Akses Multi-Perangkat
                    </div>
                    <p className="text-xs text-[#14283F]/75 mt-1">
                      Tampilan responsif dan sinkronisasi data real-time untuk kenyamanan belajar dari HP maupun PC.
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              {/* Papan Pengumuman Resmi */}
              <ScrollReveal
                direction="right"
                delay={0.1}
                className="lg:col-span-5 bg-white rounded-xl p-6 border border-[#14283F]/10 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-[#087451]">
                    02. Papan Pengumuman Akademik
                  </div>
                  <span className="text-xs text-[#14283F]/60 font-mono-num">
                    {publishedAnnouncements.length} Pengumuman
                  </span>
                </div>
                <div className="divide-y divide-[#14283F]/10">
                  {publishedAnnouncements.map((ann) => (
                    <div key={ann.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex items-center gap-2 text-[11px] text-[#14283F]/60">
                        <span className="font-semibold text-[#087451]">
                          {ann.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-num">{ann.publishedAt}</span>
                      </div>
                      <h3 className="text-sm font-bold text-[#14283F]">
                        {ann.title}
                      </h3>
                      <p className="text-xs text-[#14283F]/75 leading-relaxed">
                        {ann.content}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </section>

            <IslamicSectionDivider label="Katalog Program & Jadwal Halaqah" />

            {/* Featured Programs Preview */}
            <section className="space-y-4">
              <ScrollReveal
                direction="left"
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <h2 className="text-lg sm:text-xl font-display font-bold text-[#14283F]">
                    Program Studi & Halaqah Keilmuan
                  </h2>
                  <p className="text-xs text-[#14283F]/70">
                    Pilih program pembelajaran sesuai tahapan keilmuan Anda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePage('program')}
                  className="text-xs font-semibold text-[#087451] hover:underline flex items-center gap-1 self-start sm:self-auto"
                >
                  Lihat Semua Program & Jadwal
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </ScrollReveal>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {db.programs
                  .filter((p) => p.status !== 'Archived')
                  .map((prg, idx) => (
                    <ScrollReveal
                      key={prg.id}
                      direction={idx % 2 === 0 ? 'left' : 'right'}
                      delay={(idx % 2) * 0.08}
                      className="bg-white rounded-xl p-4 sm:p-6 border border-[#14283F]/10 flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-[#14283F]/65">
                          <span className="font-mono-num font-semibold text-[#087451]">
                            {prg.code} · Tingkat {prg.level}
                          </span>
                          <span>Status: {prg.status}</span>
                        </div>
                        {prg.arabicTitle && (
                          <p
                            className="font-arabic text-base sm:text-lg font-bold text-[#14283F]"
                            dir="rtl"
                          >
                            {prg.arabicTitle}
                          </p>
                        )}
                        <h3 className="text-sm sm:text-base font-bold text-[#14283F]">
                          {prg.title}
                        </h3>
                        <p className="text-xs text-[#14283F]/75 leading-relaxed">
                          {prg.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#14283F]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                        <div className="text-[#14283F]/70">
                          Durasi: <strong>{prg.duration}</strong> · {prg.fee}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAdmForm((prev) => ({
                              ...prev,
                              programId: prg.id,
                            }));
                            setActivePage('pendaftaran');
                          }}
                          className="w-full sm:w-auto text-center justify-center px-3.5 py-2 text-xs font-semibold text-white bg-[#087451] hover:bg-[#065d40] rounded-lg"
                        >
                          Daftar Program Ini
                        </button>
                      </div>
                    </ScrollReveal>
                  ))}
              </div>
            </section>
          </div>
        )}

        {/* PAGE 2: KATALOG PROGRAM, KELAS & JADWAL */}
        {activePage === 'program' && (
          <div className="space-y-8">
            <ScrollReveal
              direction="left"
              className="bg-white rounded-xl p-6 border border-[#14283F]/10"
            >
              <div className="text-xs font-semibold text-[#087451]">
                Katalog Akademik & Kalender Halaqah ({db.settings.timezone})
              </div>
              <h2 className="text-2xl font-display font-bold text-[#14283F] mt-1">
                Program Pembelajaran, Kuota Kelas & Jadwal Pertemuan
              </h2>
              <p className="text-xs text-[#14283F]/75 mt-1">
                Informasi lengkap program, pengajar pengampu, sisa kuota santri, dan jadwal pertemuan mingguan.
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {db.classes.map((cls, idx) => {
                const prog = db.programs.find((p) => p.id === cls.programId);
                const teacher = db.teachers.find((t) => t.id === cls.teacherId);
                return (
                  <ScrollReveal
                    key={cls.id}
                    direction={idx % 2 === 0 ? 'left' : 'right'}
                    delay={(idx % 2) * 0.08}
                    className="bg-white rounded-xl p-6 border border-[#14283F]/10 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs text-[#14283F]/65">
                      <span className="font-mono-num font-semibold text-[#087451]">
                        {cls.code} · {prog?.level || 'Reguler'}
                      </span>
                      <span className="font-mono-num">
                        Terisi {cls.studentIds.length} / {cls.quota} Santri
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#14283F]">
                      {cls.name}
                    </h3>
                    <p className="text-xs text-[#14283F]/75">
                      Program Induk: <strong>{prog?.title}</strong>
                    </p>
                    <p className="text-xs text-[#14283F]/75">
                      Pengajar: <strong>{teacher?.fullName}</strong>
                    </p>
                    <div className="pt-3 border-t border-[#14283F]/10 flex items-center justify-between text-xs">
                      <span className="font-medium text-[#087451]">
                        Jadwal: {cls.scheduleSummary}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (prog) {
                            setAdmForm((prev) => ({
                              ...prev,
                              programId: prog.id,
                            }));
                          }
                          setActivePage('pendaftaran');
                        }}
                        className="font-semibold text-[#14283F] hover:text-[#087451] underline"
                      >
                        Daftar Kelas &rarr;
                      </button>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>

            {/* Tabel Jadwal Pertemuan */}
            <ScrollReveal
              direction="right"
              className="bg-white rounded-xl p-6 border border-[#14283F]/10 space-y-4"
            >
              <h3 className="text-base font-bold text-[#14283F]">
                Jadwal Pertemuan Halaqah Terdekat (Zona Waktu: {db.settings.timezone})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#14283F]/15 text-[#14283F]/70">
                      <th className="py-3 px-3 font-semibold">Hari & Tanggal</th>
                      <th className="py-3 px-3 font-semibold">Waktu (WIB)</th>
                      <th className="py-3 px-3 font-semibold">Kelas</th>
                      <th className="py-3 px-3 font-semibold">Topik Kajian</th>
                      <th className="py-3 px-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#14283F]/10">
                    {db.schedules.map((sch) => {
                      const cls = db.classes.find((c) => c.id === sch.classId);
                      return (
                        <tr key={sch.id} className="hover:bg-[#F5F0E4]/40">
                          <td className="py-3 px-3 font-mono-num">
                            {sch.dayOfWeek}, {sch.date}
                          </td>
                          <td className="py-3 px-3 font-mono-num">
                            {sch.startTime} – {sch.endTime}
                          </td>
                          <td className="py-3 px-3 font-semibold text-[#14283F]">
                            {cls?.name}
                          </td>
                          <td className="py-3 px-3 text-[#14283F]/80">
                            {sch.topic}
                          </td>
                          <td className="py-3 px-3 font-semibold text-[#087451]">
                            {sch.sessionStatus}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ScrollReveal>
          </div>
        )}

        {/* PAGE 3: PERPUSTAKAAN DIGITAL & 9 SILSILAH KITAB */}
        {activePage === 'perpustakaan' && (
          <LibraryModule
            db={db}
            currentUser={currentUser}
            onMutate={onMutate}
            onUploadFile={onUploadFile}
            onNotify={onNotify}
          />
        )}

        {/* PAGE 4: FATWA TERVERIFIKASI & TANYA JAWAB TERPUBLIKASI */}
        {activePage === 'fatwa' && (
          <div className="space-y-8">
            <ScrollReveal
              direction="left"
              className="bg-[#14283F] text-white rounded-xl p-6 border border-[#C5A45B]/40"
            >
              <div className="text-xs text-[#C5A45B] font-semibold">
                Pusat Dokumentasi Fatwa & Bahtsul Masail Ilmiah
              </div>
              <h2 className="text-2xl font-display font-bold mt-1">
                Arsip Fatwa Resmi Terverifikasi & Tanya Jawab Terpublikasi
              </h2>
              <p className="text-xs sm:text-sm text-[#F5F0E4]/80 mt-1 max-w-3xl">
                Sesuai standar otoritas keilmuan akademi (PRD Bagian 11), dokumen Fatwa Resmi yang telah diverifikasi Dewan Syariah dipisahkan secara tegas dari rubrik Tanya Jawab Santri. Pertanyaan yang belum dijawab atau masih dalam moderasi tidak ditampilkan di halaman publik.
              </p>
            </ScrollReveal>

            {/* Bagian A: Arsip Fatwa Resmi Terverifikasi */}
            <div className="space-y-4">
              <h3 className="text-lg font-display font-bold text-[#14283F] flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#087451]" />
                A. Arsip Fatwa Resmi Terverifikasi ({verifiedFatwas.length})
              </h3>
              <div className="space-y-4">
                {verifiedFatwas.map((ftw, idx) => (
                  <ScrollReveal
                    key={ftw.id}
                    direction={idx % 2 === 0 ? 'left' : 'right'}
                    className="bg-white rounded-xl p-6 border border-[#14283F]/10 space-y-3"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#14283F]/65">
                      <span className="font-mono-num font-bold text-[#087451]">
                        {ftw.code}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold">Kategori: {ftw.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>Status: {ftw.verificationStatus}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-num">
                        Tanggal: {ftw.publishedDate}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-[#14283F]">
                      {ftw.title}
                    </h4>

                    <div className="p-3.5 rounded-lg bg-[#F5F0E4]/60 text-xs space-y-1">
                      <div className="font-semibold text-[#14283F]">
                        Konteks Pertanyaan / Istifta’:
                      </div>
                      <p className="text-[#14283F]/80 leading-relaxed">
                        {ftw.questionContext}
                      </p>
                    </div>

                    <div className="text-xs sm:text-sm text-[#14283F]/90 leading-relaxed space-y-1">
                      <div className="text-xs font-bold text-[#087451]">
                        Uraian Jawaban & Ketetapan:
                      </div>
                      <p>{ftw.answerContent}</p>
                    </div>

                    <div className="pt-3 border-t border-[#14283F]/10 text-xs text-[#14283F]/70 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        Pemberi Fatwa: <strong>{ftw.muftiName}</strong> · Sumber:{' '}
                        <em>{ftw.sourceReference}</em>
                      </div>
                      <div>
                        Rujukan Kitab: {ftw.kitabReferences.join(', ')}
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>

            <IslamicSectionDivider label="Rubrik Tanya Jawab Santri Terpublikasi" />

            {/* Bagian B: Tanya Jawab Terpublikasi */}
            <div className="space-y-4">
              <h3 className="text-lg font-display font-bold text-[#14283F] flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#087451]" />
                B. Arsip Jawaban Forum Keilmuan Terpublikasi ({publishedAnswers.length})
              </h3>
              <div className="space-y-4">
                {publishedAnswers.map((q, idx) => (
                  <ScrollReveal
                    key={q.id}
                    direction={idx % 2 === 0 ? 'right' : 'left'}
                    className="bg-white rounded-xl p-6 border border-[#14283F]/10 space-y-3"
                  >
                    <div className="flex items-center gap-2 text-xs text-[#14283F]/60">
                      <span className="font-semibold text-[#087451]">
                        Bidang: {q.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Penanya: {q.studentName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-num">{q.createdAt}</span>
                    </div>
                    <h4 className="text-sm font-bold text-[#14283F]">
                      {q.title}
                    </h4>
                    <p className="text-xs text-[#14283F]/75">{q.questionText}</p>
                    <div className="p-4 rounded-lg bg-[#F5F0E4]/55 border border-[#C5A45B]/35 text-xs space-y-1.5">
                      <div className="font-bold text-[#087451]">
                        Jawaban Asatidzah ({q.answeredBy}):
                      </div>
                      <p className="text-[#14283F]/90 leading-relaxed">
                        {q.answerText}
                      </p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PAGE 5: PENDAFTARAN SANTRI BARU */}
        {activePage === 'pendaftaran' && (
          <ScrollReveal
            direction="left"
            className="max-w-3xl mx-auto bg-white rounded-2xl p-6 sm:p-8 border border-[#14283F]/10 space-y-6"
          >
            <div>
              <div className="text-xs font-semibold text-[#087451]">
                Penerimaan Santri Baru (Admission Management)
              </div>
              <h2 className="text-2xl font-display font-bold text-[#14283F] mt-1">
                Formulir Pendaftaran Program Akademi
              </h2>
              <p className="text-xs text-[#14283F]/75 mt-1 leading-relaxed">
                Data pendaftaran yang Anda kirimkan langsung tercatat di sistem manajemen akademik terpusat untuk diverifikasi oleh Admin Akademik dan ditempatkan ke kelas halaqah.
              </p>
            </div>

            {lastSubmittedRegNo && (
              <div
                data-testid="admission-success-banner"
                className="p-4 rounded-xl bg-[#087451]/10 border border-[#087451] text-xs space-y-1"
              >
                <div className="font-bold text-[#087451] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Pendaftaran Berhasil Direkam ke Database!
                </div>
                <p className="text-[#14283F]">
                  Nomor Registrasi Anda adalah{' '}
                  <strong className="font-mono-num">{lastSubmittedRegNo}</strong>.
                  Status pendaftaran saat ini: <strong>Pending Review</strong> oleh Admin Akademik.
                </p>
              </div>
            )}

            <form onSubmit={handleAdmissionSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="adm-fullname"
                    className="block font-semibold text-[#14283F] mb-1"
                  >
                    Nama Lengkap Sesuai Identitas *
                  </label>
                  <input
                    id="adm-fullname"
                    type="text"
                    required
                    value={admForm.fullName}
                    onChange={(e) =>
                      setAdmForm({ ...admForm, fullName: e.target.value })
                    }
                    placeholder="Contoh: Zaid bin Haritsah"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#14283F]/20"
                  />
                </div>
                <div>
                  <label
                    htmlFor="adm-email"
                    className="block font-semibold text-[#14283F] mb-1"
                  >
                    Alamat Email Aktif *
                  </label>
                  <input
                    id="adm-email"
                    type="email"
                    required
                    value={admForm.email}
                    onChange={(e) =>
                      setAdmForm({ ...admForm, email: e.target.value })
                    }
                    placeholder="zaid@email.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#14283F]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="adm-whatsapp"
                    className="block font-semibold text-[#14283F] mb-1"
                  >
                    Nomor WhatsApp *
                  </label>
                  <input
                    id="adm-whatsapp"
                    type="tel"
                    required
                    value={admForm.whatsapp}
                    onChange={(e) =>
                      setAdmForm({ ...admForm, whatsapp: e.target.value })
                    }
                    placeholder="+62812..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#14283F]/20 font-mono-num"
                  />
                </div>
                <div>
                  <label
                    htmlFor="adm-gender"
                    className="block font-semibold text-[#14283F] mb-1"
                  >
                    Jenis Kelamin *
                  </label>
                  <select
                    id="adm-gender"
                    value={admForm.gender}
                    onChange={(e) =>
                      setAdmForm({
                        ...admForm,
                        gender: e.target.value as 'Laki-laki' | 'Perempuan',
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#14283F]/20 bg-white"
                  >
                    <option value="Laki-laki">Laki-laki (Banin)</option>
                    <option value="Perempuan">Perempuan (Banat)</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="adm-city"
                    className="block font-semibold text-[#14283F] mb-1"
                  >
                    Kota / Domisili *
                  </label>
                  <input
                    id="adm-city"
                    type="text"
                    required
                    value={admForm.city}
                    onChange={(e) =>
                      setAdmForm({ ...admForm, city: e.target.value })
                    }
                    placeholder="Contoh: Surabaya"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#14283F]/20"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="adm-program"
                  className="block font-semibold text-[#14283F] mb-1"
                >
                  Pilih Program Studi yang Dituju *
                </label>
                <select
                  id="adm-program"
                  value={admForm.programId}
                  onChange={(e) =>
                    setAdmForm({ ...admForm, programId: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#14283F]/20 bg-white"
                >
                  {db.programs
                    .filter((p) => p.status !== 'Archived')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.title} (Tingkat {p.level})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="adm-notes"
                  className="block font-semibold text-[#14283F] mb-1"
                >
                  Riwayat Belajar Kitab / Kemampuan Bahasa Arab Sebelumnya
                </label>
                <textarea
                  id="adm-notes"
                  rows={3}
                  value={admForm.backgroundNotes}
                  onChange={(e) =>
                    setAdmForm({ ...admForm, backgroundNotes: e.target.value })
                  }
                  placeholder="Tuliskan kitab yang pernah dipelajari atau latar belakang pendidikan..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#14283F]/20"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 text-xs sm:text-sm font-semibold text-white bg-[#087451] hover:bg-[#065d40] rounded-lg transition-colors"
                >
                  Kirim Formulir Pendaftaran Santri
                </button>
              </div>
            </form>
          </ScrollReveal>
        )}
      </main>

      {/* QUIET FOOTER */}
      <footer className="bg-white border-t border-[#14283F]/10 px-4 sm:px-6 lg:px-8 py-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#14283F]/70 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <IslamicAcademyLogo className="w-5 h-5 shrink-0" />
            <span>
              <strong>{db.settings.academyName}</strong> · {db.settings.address}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>Tahun Akademik {db.settings.academicYear}</span>
          </div>
        </div>
      </footer>

      {/* LOGIN & PASSWORD RESET MODAL */}
      {isLoginOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#14283F]/65 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
        >
          <div className="bg-white border border-[#C5A45B]/45 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl islamic-pattern-subtle">
            <div className="bg-[#14283F] text-white px-6 py-4 flex items-center justify-between border-b border-[#C5A45B]/30">
              <div>
                <div className="text-xs text-[#C5A45B]">
                  Sistem Autentikasi & Role-Based Access Control
                </div>
                <h2 id="login-modal-title" className="text-base font-bold">
                  {authMode === 'login'
                    ? 'Masuk ke Islamic Academy Portal'
                    : 'Reset Kata Sandi Akun'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsLoginOpen(false)}
                aria-label="Tutup modal login"
                className="p-1.5 rounded-lg text-[#F5F0E4]/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {authMode === 'login' ? (
              <form
                onSubmit={handleLoginSubmit}
                className="p-6 bg-white/95 space-y-4 text-xs"
              >
                {authError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 font-medium">
                    {authError}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="login-identifier"
                    className="block font-semibold text-[#14283F] mb-1"
                  >
                    Username atau Email Terdaftar
                  </label>
                  <input
                    id="login-identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Masukkan ID Login (username) atau email..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#14283F]/20 bg-white text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block font-semibold text-[#14283F] mb-1"
                  >
                    Kata Sandi
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#14283F]/20 bg-white text-sm"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError('');
                      setAuthMode('reset');
                    }}
                    className="text-xs font-semibold text-[#087451] hover:underline"
                  >
                    Lupa / Reset Password?
                  </button>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-[#087451] hover:bg-[#065d40] rounded-lg flex items-center gap-1.5"
                  >
                    <LogIn className="w-4 h-4" />
                    {authLoading ? 'Memverifikasi...' : 'Masuk Sekarang'}
                  </button>
                </div>
              </form>
            ) : (
              <form
                onSubmit={handleResetPasswordSubmit}
                className="p-6 bg-white/95 space-y-4 text-xs"
              >
                {authError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 font-medium">
                    {authError}
                  </div>
                )}
                <div>
                  <label className="block font-semibold mb-1">
                    Email Akun Terdaftar *
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="farhan@santri.darulilm.id"
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Nomor WhatsApp Terdaftar (Verifikasi Keamanan) *
                  </label>
                  <input
                    type="text"
                    required
                    value={resetWhatsapp}
                    onChange={(e) => setResetWhatsapp(e.target.value)}
                    placeholder="+628571003301"
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Password Baru (Min. 6 Karakter) *
                  </label>
                  <input
                    type="password"
                    required
                    value={resetNewPass}
                    onChange={(e) => setResetNewPass(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError('');
                      setAuthMode('login');
                    }}
                    className="text-xs font-semibold text-[#14283F] hover:underline"
                  >
                    &larr; Kembali ke Login
                  </button>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#087451] rounded-lg flex items-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    Simpan Password Baru
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
