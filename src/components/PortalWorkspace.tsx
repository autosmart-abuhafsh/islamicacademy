import React, { useEffect, useState } from 'react';
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Database,
  ExternalLink,
  FileText,
  GraduationCap,
  Home,
  KeyRound,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Scale,
  Settings,
  Shield,
  Sun,
  User,
  Users,
  Video,
  X,
} from 'lucide-react';
import {
  AcademyDatabase,
  ModuleKey,
  PermissionAction,
  UserAccount,
} from '../types/database';
import {
  calculateStudentProgress,
  canAccessZoomLink,
  hasPermission,
  validateAccountCredentialsUpdate,
} from '../utils/academicLogic';
import { IslamicAcademyLogo } from './IslamicOrnament';
import { KnowledgeReportsAndSettings } from './KnowledgeReportsAndSettings';
import { LibraryModule } from './LibraryModule';
import { LmsModule } from './LmsModule';
import { UsersAndAcademicAdmin } from './UsersAndAcademicAdmin';

type WorkspaceMenuId =
  | 'dashboard'
  | 'users_students'
  | 'users_teachers'
  | 'users_accounts'
  | 'users_rbac'
  | 'academic_programs'
  | 'academic_classes'
  | 'academic_schedules'
  | 'academic_admissions'
  | 'academic_announcements'
  | 'lms_materials'
  | 'lms_zoom'
  | 'lms_attendance'
  | 'lms_assignments'
  | 'lms_exams'
  | 'lms_progress'
  | 'library_catalog'
  | 'library_silsilah'
  | 'library_pathway'
  | 'knowledge_fatwa'
  | 'knowledge_forum'
  | 'reports'
  | 'settings'
  | 'profile';

interface PortalWorkspaceProps {
  db: AcademyDatabase;
  currentUser: UserAccount;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onSwitchUser: (user: UserAccount) => void;
  onLogout: () => void;
  onBackToPublic: () => void;
  onOpenSyncModal: () => void;
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

export function PortalWorkspace({
  db,
  currentUser,
  theme,
  onToggleTheme,
  onSwitchUser,
  onLogout,
  onBackToPublic,
  onOpenSyncModal,
  onMutate,
  onUploadFile,
  onNotify,
}: PortalWorkspaceProps) {
  const [activeMenu, setActiveMenu] = useState<WorkspaceMenuId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [selfAccountForm, setSelfAccountForm] = useState({
    fullName: currentUser.fullName,
    username: currentUser.username,
    email: currentUser.email,
    password: currentUser.passwordHash,
    whatsapp: currentUser.whatsapp,
    city: currentUser.city,
  });

  useEffect(() => {
    setSelfAccountForm({
      fullName: currentUser.fullName,
      username: currentUser.username,
      email: currentUser.email,
      password: currentUser.passwordHash,
      whatsapp: currentUser.whatsapp,
      city: currentUser.city,
    });
  }, [currentUser]);

  const currentStudent = db.students.find((s) => s.userId === currentUser.id);
  const currentTeacher = db.teachers.find((t) => t.userId === currentUser.id);

  // Build dynamic navigation structure per Role & Permission (PRD Section 16)
  const getMenuGroups = () => {
    if (currentUser.role === 'santri') {
      return [
        {
          group: 'PORTAL SANTRI',
          items: [
            { id: 'dashboard' as const, label: 'Dashboard Santri', icon: LayoutDashboard },
            { id: 'lms_materials' as const, label: 'Kelas & Materi Saya', icon: BookOpen },
            { id: 'lms_zoom' as const, label: 'Kelas Zoom Halaqah', icon: Video },
            { id: 'lms_assignments' as const, label: 'Tugas Saya', icon: ClipboardList },
            { id: 'lms_exams' as const, label: 'Ujian (Imtihan)', icon: Award },
            { id: 'lms_attendance' as const, label: 'Rekap Absensi', icon: Calendar },
            { id: 'lms_progress' as const, label: 'Nilai & Progres Belajar', icon: BarChart3 },
          ],
        },
        {
          group: 'KEILMUAN & PUSTAKA',
          items: [
            { id: 'library_catalog' as const, label: 'Perpustakaan Digital', icon: Library },
            { id: 'library_silsilah' as const, label: '9 Silsilah Keilmuan', icon: BookOpen },
            { id: 'knowledge_forum' as const, label: 'Forum Tanya Jawab', icon: MessageSquare },
            { id: 'profile' as const, label: 'Profil Saya', icon: User },
          ],
        },
      ];
    }

    if (currentUser.role === 'pengajar') {
      return [
        {
          group: 'PORTAL PENGAJAR',
          items: [
            { id: 'dashboard' as const, label: 'Dashboard Pengajar', icon: LayoutDashboard },
            { id: 'lms_materials' as const, label: 'Kelas & Materi Ajar', icon: BookOpen },
            { id: 'lms_zoom' as const, label: 'Zoom Meeting Kelas', icon: Video },
            { id: 'lms_attendance' as const, label: 'Absensi Santri', icon: Calendar },
            { id: 'lms_assignments' as const, label: 'Tugas & Pemeriksaan', icon: ClipboardList },
            { id: 'lms_exams' as const, label: 'Ujian & Penilaian', icon: Award },
            { id: 'lms_progress' as const, label: 'Progres Santri', icon: BarChart3 },
          ],
        },
        {
          group: 'PUSTAKA & FATWA',
          items: [
            { id: 'library_catalog' as const, label: 'Perpustakaan 9 Silsilah', icon: Library },
            { id: 'knowledge_forum' as const, label: 'Forum Tanya Jawab', icon: MessageSquare },
            { id: 'profile' as const, label: 'Profil Pengajar', icon: User },
          ],
        },
      ];
    }

    // ADMIN ROLES (Super Admin, Admin Akademik, Admin Perpustakaan, Admin Konten)
    const groups: {
      group: string;
      items: { id: WorkspaceMenuId; label: string; icon: React.ComponentType<{ className?: string }> }[];
    }[] = [
      {
        group: 'PUSAT KENDALI',
        items: [
          { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
        ],
      },
    ];

    if (hasPermission(currentUser, db.roles, 'users', 'view')) {
      groups.push({
        group: 'MANAJEMEN PENGGUNA',
        items: [
          { id: 'users_students', label: 'Santri & Pengajar', icon: Users },
          { id: 'users_accounts', label: 'Manajemen Akun & Password', icon: KeyRound },
          { id: 'users_rbac', label: 'Role & Permission', icon: Shield },
        ],
      });
    }

    if (hasPermission(currentUser, db.roles, 'academic', 'view')) {
      groups.push({
        group: 'AKADEMIK',
        items: [
          { id: 'academic_programs', label: 'Program & Kelas', icon: GraduationCap },
          { id: 'academic_admissions', label: 'Pendaftaran & Jadwal', icon: Calendar },
        ],
      });
    }

    if (hasPermission(currentUser, db.roles, 'lms', 'view')) {
      groups.push({
        group: 'LMS INTERAKTIF',
        items: [
          { id: 'lms_materials', label: 'Materi & Zoom', icon: BookOpen },
          { id: 'lms_assignments', label: 'Absensi, Tugas & Ujian', icon: ClipboardList },
        ],
      });
    }

    if (hasPermission(currentUser, db.roles, 'library', 'view')) {
      groups.push({
        group: 'PERPUSTAKAAN DIGITAL',
        items: [
          { id: 'library_catalog', label: 'Katalog & Smart Search', icon: Library },
          { id: 'library_silsilah', label: '9 Silsilah & Pathway', icon: BookOpen },
        ],
      });
    }

    if (hasPermission(currentUser, db.roles, 'knowledge', 'view')) {
      groups.push({
        group: 'KNOWLEDGE CENTER',
        items: [
          { id: 'knowledge_fatwa', label: 'Fatwa & Moderasi Forum', icon: Scale },
        ],
      });
    }

    const utilItems: { id: WorkspaceMenuId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [];
    if (hasPermission(currentUser, db.roles, 'reports', 'view')) {
      utilItems.push({ id: 'reports', label: 'Laporan & Analitik', icon: BarChart3 });
    }
    if (
      currentUser.role === 'super_admin' &&
      hasPermission(currentUser, db.roles, 'settings', 'view')
    ) {
      utilItems.push({ id: 'settings', label: 'Pengaturan Sistem', icon: Settings });
    }
    utilItems.push({ id: 'profile', label: 'Profil Saya', icon: User });

    groups.push({
      group: 'LAPORAN & SISTEM',
      items: utilItems,
    });

    return groups;
  };

  const menuGroups = getMenuGroups();

  return (
    <div className="min-h-screen flex bg-[#F5F0E4] text-[#14283F]">
      {/* SIDEBAR NAVIGATION (EXPANDABLE / COLLAPSIBLE) */}
      <aside
        aria-label="Navigasi Portal Akademik"
        className={`fixed inset-y-0 left-0 z-40 lg:static bg-[#14283F] text-white flex flex-col border-r border-[#C5A45B]/30 transition-transform duration-200 no-print ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${
          mobileSidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <IslamicAcademyLogo className="w-7 h-7 shrink-0" />
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="text-sm font-display font-bold text-white truncate">
                  Islamic Academy Portal
                </div>
                <div className="text-[11px] text-[#C5A45B] truncate">
                  {db.roles.find((r) => r.id === currentUser.role)?.name}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Perluas Sidebar' : 'Persempit Sidebar'}
            className="hidden lg:flex p-1.5 rounded-lg text-[#F5F0E4]/70 hover:text-white hover:bg-white/10"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Tutup Sidebar Mobile"
            className="lg:hidden p-1.5 rounded-lg text-[#F5F0E4]/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {menuGroups.map((grp) => (
            <div key={grp.group} className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-2.5 text-[10px] font-bold tracking-wider text-[#C5A45B]/85">
                  {grp.group}
                </div>
              )}
              {grp.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveMenu(item.id);
                      setMobileSidebarOpen(false);
                    }}
                    title={item.label}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#087451] text-white font-semibold'
                        : 'text-[#F5F0E4]/75 hover:text-white hover:bg-white/8'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/10 space-y-1.5">
          <button
            type="button"
            onClick={onBackToPublic}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-[#F5F0E4]/80 hover:text-white hover:bg-white/10"
          >
            <Home className="w-4 h-4 shrink-0 text-[#C5A45B]" />
            {!sidebarCollapsed && <span>Ke Beranda Publik</span>}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-red-300 hover:text-white hover:bg-red-500/20"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Keluar (Logout)</span>}
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOPBAR CONTRACT FOR WORKSPACE */}
        <header className="sticky top-0 z-20 bg-white border-b border-[#14283F]/10 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Buka Navigasi Sidebar"
              className="lg:hidden p-2 rounded-lg text-[#14283F] hover:bg-[#F5F0E4]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-xs sm:text-sm font-semibold text-[#14283F] truncate">
              {db.settings.academyName}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            {/* Role Switcher for Instant Multi-Role Inspection */}
            <select
              aria-label="Beralih Role Pengguna"
              value={currentUser.id}
              onChange={(e) => {
                const target = db.users.find((u) => u.id === e.target.value);
                if (target) onSwitchUser(target);
              }}
              className="max-w-[145px] sm:max-w-[260px] truncate px-2 sm:px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#14283F]/20 bg-[#F5F0E4]/60 text-[#14283F]"
            >
              {db.users
                .filter((u) => u.status === 'Active')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.role.toUpperCase()} — {u.fullName.split(',')[0]}
                  </option>
                ))}
            </select>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Ganti Tema Gelap atau Terang"
              title={
                theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'
              }
              className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[#14283F] bg-[#F5F0E4] hover:bg-[#C5A45B]/25 border border-[#C5A45B]/40 rounded-lg flex items-center gap-1.5 whitespace-nowrap"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#C5A45B]" />
                  <span className="hidden sm:inline">Mode Terang</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#087451]" />
                  <span className="hidden sm:inline">Mode Gelap</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* WORKSPACE BODY */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* 1. DASHBOARD VIEW (ROLE-SPECIFIC) */}
          {activeMenu === 'dashboard' && (
            <>
              {/* A. SANTRI DASHBOARD (PRD Section 8.1) */}
              {currentUser.role === 'santri' && currentStudent ? (
                <div className="space-y-6">
                  {(() => {
                    const prog = calculateStudentProgress({
                      studentId: currentStudent.id,
                      enrolledClassIds: currentStudent.classIds,
                      materials: db.materials,
                      assignments: db.assignments,
                      submissions: db.submissions,
                      attendanceSessions: db.attendanceSessions,
                      grades: db.grades,
                    });
                    const myClasses = db.classes.filter((c) =>
                      currentStudent.classIds.includes(c.id)
                    );
                    const mySchedules = db.schedules.filter((s) =>
                      currentStudent.classIds.includes(s.classId)
                    );

                    return (
                      <>
                        {/* Welcome Banner */}
                        <div className="bg-[#14283F] text-white rounded-xl p-6 border border-[#C5A45B]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="text-xs text-[#C5A45B] font-mono-num">
                              Student Dashboard · NIS: {currentStudent.nis}
                            </div>
                            <h1 className="text-xl sm:text-2xl font-display font-bold">
                              Ahlan wa Sahlan, {currentStudent.fullName}
                            </h1>
                            <p className="text-xs text-[#F5F0E4]/80">
                              Mengikuti {myClasses.length} Halaqah Aktif · Kota:{' '}
                              {currentStudent.city} · Status:{' '}
                              {currentStudent.membershipStatus}
                            </p>
                          </div>

                          <div className="bg-white/10 rounded-xl px-5 py-3 text-center border border-[#C5A45B]/35">
                            <div className="text-2xl font-bold font-mono-num text-[#C5A45B]">
                              {prog.overallProgressPercent}%
                            </div>
                            <div className="text-[11px] text-[#F5F0E4]/80">
                              Progres Pembelajaran
                            </div>
                          </div>
                        </div>

                        {/* 4 Key Academic Metrics */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-white rounded-xl p-4 border border-[#14283F]/10">
                            <div className="text-xs text-[#14283F]/65">
                              Materi Diselesaikan
                            </div>
                            <div className="text-2xl font-bold font-mono-num mt-1 text-[#14283F]">
                              {prog.completedMaterialsCount}/
                              {prog.totalMaterialsCount}
                            </div>
                            <div className="text-[11px] text-[#087451] mt-1 font-medium">
                              {prog.materialCompletionPercent}% Tuntas
                            </div>
                          </div>

                          <div className="bg-white rounded-xl p-4 border border-[#14283F]/10">
                            <div className="text-xs text-[#14283F]/65">
                              Rekap Kehadiran
                            </div>
                            <div className="text-2xl font-bold font-mono-num mt-1 text-[#087451]">
                              {prog.attendanceRatePercent}%
                            </div>
                            <div className="text-[11px] text-[#14283F]/65 mt-1 font-mono-num">
                              {prog.attendancePresentCount}/
                              {prog.totalAttendanceSessions} Sesi Hadir
                            </div>
                          </div>

                          <div className="bg-white rounded-xl p-4 border border-[#14283F]/10">
                            <div className="text-xs text-[#14283F]/65">
                              Tugas Dikumpulkan
                            </div>
                            <div className="text-2xl font-bold font-mono-num mt-1 text-[#14283F]">
                              {prog.submittedAssignmentsCount}/
                              {prog.totalAssignmentsCount}
                            </div>
                            <div className="text-[11px] text-[#14283F]/65 mt-1">
                              Tathbiq & Latihan
                            </div>
                          </div>

                          <div className="bg-white rounded-xl p-4 border border-[#14283F]/10">
                            <div className="text-xs text-[#14283F]/65">
                              Nilai Rata-Rata
                            </div>
                            <div className="text-2xl font-bold font-mono-num mt-1 text-[#087451]">
                              {prog.averageScore}
                            </div>
                            <div className="text-[11px] text-[#14283F]/65 mt-1">
                              Skala 100
                            </div>
                          </div>
                        </div>

                        {/* Active Classes & Authorized Zoom Links */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                          <div className="lg:col-span-7 bg-white rounded-xl p-6 border border-[#14283F]/10 space-y-4">
                            <div className="flex items-center justify-between">
                              <h2 className="text-base font-bold text-[#14283F]">
                                Kelas Aktif & Akses Zoom Halaqah Saya
                              </h2>
                              <button
                                type="button"
                                onClick={() => setActiveMenu('lms_materials')}
                                className="text-xs font-semibold text-[#087451] hover:underline"
                              >
                                Buka Semua Materi &rarr;
                              </button>
                            </div>

                            <div className="space-y-3">
                              {myClasses.map((cls) => {
                                const canZoom = canAccessZoomLink(
                                  currentUser,
                                  cls,
                                  currentStudent.id
                                );
                                return (
                                  <div
                                    key={cls.id}
                                    className="p-4 rounded-xl bg-[#F5F0E4]/50 border border-[#14283F]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                  >
                                    <div>
                                      <div className="text-xs font-mono-num text-[#087451] font-semibold">
                                        {cls.code} · {cls.scheduleSummary}
                                      </div>
                                      <h3 className="text-sm font-bold text-[#14283F] mt-0.5">
                                        {cls.name}
                                      </h3>
                                      <div className="text-xs text-[#14283F]/70 mt-1 font-mono-num">
                                        Meeting ID: {cls.zoomMeetingId} · Passcode:{' '}
                                        {cls.zoomPasscode}
                                      </div>
                                    </div>
                                    {canZoom && (
                                      <a
                                        href={cls.zoomLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 text-xs font-semibold text-white bg-[#087451] hover:bg-[#065d40] rounded-lg flex items-center gap-1.5 shrink-0"
                                      >
                                        <Video className="w-3.5 h-3.5" />
                                        Masuk Kelas Zoom
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Upcoming Schedule & Announcements */}
                          <div className="lg:col-span-5 bg-white rounded-xl p-6 border border-[#14283F]/10 space-y-4">
                            <h2 className="text-base font-bold text-[#14283F]">
                              Jadwal Pembelajaran Terdekat
                            </h2>
                            <div className="space-y-3 text-xs">
                              {mySchedules.map((sch) => (
                                <div
                                  key={sch.id}
                                  className="p-3 rounded-lg bg-[#F5F0E4]/45 border border-[#14283F]/10 space-y-1"
                                >
                                  <div className="font-mono-num font-semibold text-[#087451]">
                                    {sch.dayOfWeek}, {sch.date} · {sch.startTime}–
                                    {sch.endTime} WIB
                                  </div>
                                  <div className="font-bold text-[#14283F]">
                                    {sch.topic}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : currentUser.role === 'pengajar' && currentTeacher ? (
                /* B. TEACHER DASHBOARD (PRD Section 8.2) */
                <div className="space-y-6">
                  {(() => {
                    const myClasses = db.classes.filter(
                      (c) => c.teacherId === currentTeacher.id
                    );
                    const totalMyStudents = new Set(
                      myClasses.flatMap((c) => c.studentIds)
                    ).size;
                    const pendingSubmissions = db.submissions.filter(
                      (s) => s.status === 'Submitted'
                    );

                    return (
                      <>
                        <div className="bg-[#14283F] text-white rounded-xl p-6 border border-[#C5A45B]/40">
                          <div className="text-xs text-[#C5A45B] font-mono-num">
                            Teacher Dashboard · NIP: {currentTeacher.nip}
                          </div>
                          <h1 className="text-xl sm:text-2xl font-display font-bold mt-1">
                            Ahlan wa Sahlan, {currentTeacher.fullName}
                          </h1>
                          <p className="text-xs text-[#F5F0E4]/80 mt-1">
                            Bidang Keahlian: {currentTeacher.expertise.join(' · ')}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-white rounded-xl p-4 border border-[#14283F]/10">
                            <div className="text-xs text-[#14283F]/65">
                              Kelas yang Diampu
                            </div>
                            <div className="text-2xl font-bold font-mono-num mt-1">
                              {myClasses.length} Kelas
                            </div>
                          </div>
                          <div className="bg-white rounded-xl p-4 border border-[#14283F]/10">
                            <div className="text-xs text-[#14283F]/65">
                              Total Santri Halaqah
                            </div>
                            <div className="text-2xl font-bold font-mono-num mt-1 text-[#087451]">
                              {totalMyStudents} Santri
                            </div>
                          </div>
                          <div className="bg-white rounded-xl p-4 border border-[#14283F]/10">
                            <div className="text-xs text-[#14283F]/65">
                              Tugas Perlu Diperiksa
                            </div>
                            <div className="text-2xl font-bold font-mono-num mt-1 text-[#C5A45B]">
                              {pendingSubmissions.length} Kiriman
                            </div>
                          </div>
                          <div className="bg-white rounded-xl p-4 border border-[#14283F]/10">
                            <div className="text-xs text-[#14283F]/65">
                              Sesi Absensi Tercatat
                            </div>
                            <div className="text-2xl font-bold font-mono-num mt-1">
                              {db.attendanceSessions.length} Sesi
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 border border-[#14283F]/10 space-y-4">
                          <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-[#14283F]">
                              Kelas Halaqah yang Diampu
                            </h2>
                            <button
                              type="button"
                              onClick={() => setActiveMenu('lms_assignments')}
                              className="text-xs font-semibold text-[#087451] hover:underline"
                            >
                              Periksa Tugas & Absensi &rarr;
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {myClasses.map((cls) => (
                              <div
                                key={cls.id}
                                className="p-4 rounded-xl bg-[#F5F0E4]/50 border border-[#14283F]/10 space-y-2"
                              >
                                <div className="text-xs font-mono-num text-[#087451] font-semibold">
                                  {cls.code} · {cls.studentIds.length}/{cls.quota}{' '}
                                  Santri
                                </div>
                                <h3 className="text-sm font-bold text-[#14283F]">
                                  {cls.name}
                                </h3>
                                <div className="text-xs text-[#14283F]/75">
                                  Jadwal: {cls.scheduleSummary}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                /* C. ADMIN DASHBOARD (PRD Section 5.1, 5.2, 5.3) */
                <div className="space-y-6">
                  <div className="bg-[#14283F] text-white rounded-xl p-6 border border-[#C5A45B]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs text-[#C5A45B] font-semibold">
                        Pusat Kendali Akademi · Tahun Akademik{' '}
                        {db.settings.academicYear}
                      </div>
                      <h1 className="text-xl sm:text-2xl font-display font-bold mt-1">
                        Admin Dashboard & Monitoring Terintegrasi
                      </h1>
                      <p className="text-xs text-[#F5F0E4]/80 mt-0.5">
                        Seluruh metrik dihitung langsung dari database aktif dan tersinkronisasi secara real-time untuk HP & PC.
                      </p>
                    </div>
                    {currentUser.role === 'super_admin' && (
                      <button
                        type="button"
                        onClick={() => setActiveMenu('settings')}
                        className="px-4 py-2.5 text-xs font-semibold text-white bg-[#087451] hover:bg-[#065d40] rounded-lg flex items-center gap-2 shrink-0"
                      >
                        <Settings className="w-4 h-4" />
                        Pengaturan Sistem & Database
                      </button>
                    )}
                  </div>

                  {/* 9 Requested KPI Cards from PRD Section 5.1 */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    {[
                      {
                        label: 'Total Santri',
                        val: db.students.length,
                        sub: `${db.students.filter((s) => s.accountStatus === 'Active').length} Aktif`,
                        nav: 'users_students' as const,
                      },
                      {
                        label: 'Total Pengajar',
                        val: db.teachers.length,
                        sub: 'Asatidzah',
                        nav: 'users_students' as const,
                      },
                      {
                        label: 'Total Administrator',
                        val: db.users.filter((u) =>
                          [
                            'super_admin',
                            'admin_akademik',
                            'admin_perpustakaan',
                            'admin_konten',
                          ].includes(u.role)
                        ).length,
                        sub: '4 Role Admin',
                        nav: 'users_rbac' as const,
                      },
                      {
                        label: 'Program & Kelas Aktif',
                        val: `${db.programs.length} / ${db.classes.filter((c) => c.status === 'Active').length}`,
                        sub: 'Program / Kelas',
                        nav: 'academic_programs' as const,
                      },
                      {
                        label: 'Total Pendaftaran',
                        val: db.admissions.length,
                        sub: `${db.admissions.filter((a) => a.status === 'Pending').length} Pending`,
                        nav: 'academic_admissions' as const,
                      },
                      {
                        label: 'Total Materi LMS',
                        val: db.materials.length,
                        sub: 'Modul & Dokumen',
                        nav: 'lms_materials' as const,
                      },
                      {
                        label: 'Koleksi Kitab Turats',
                        val: db.books.length,
                        sub: '9 Silsilah Keilmuan',
                        nav: 'library_catalog' as const,
                      },
                      {
                        label: 'Publikasi Fatwa',
                        val: db.fatwas.length,
                        sub: 'Terverifikasi',
                        nav: 'knowledge_fatwa' as const,
                      },
                      {
                        label: 'Forum Pertanyaan',
                        val: db.questions.length,
                        sub: `${db.questions.filter((q) => q.status === 'Published').length} Dijawab`,
                        nav: 'knowledge_fatwa' as const,
                      },
                      {
                        label: 'Papan Pengumuman',
                        val: db.announcements.length,
                        sub: `${db.announcements.filter((a) => a.status === 'Published').length} Aktif`,
                        nav: 'academic_admissions' as const,
                      },
                    ].map((card) => (
                      <button
                        key={card.label}
                        type="button"
                        onClick={() => setActiveMenu(card.nav)}
                        className="bg-white rounded-xl p-4 border border-[#14283F]/10 text-left hover:border-[#087451] transition-colors"
                      >
                        <div className="text-xs text-[#14283F]/65">
                          {card.label}
                        </div>
                        <div className="text-2xl font-bold font-mono-num text-[#14283F] mt-1">
                          {card.val}
                        </div>
                        <div className="text-[11px] text-[#087451] font-medium mt-1 truncate">
                          {card.sub}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Section 5.2 & 5.3: Monitoring Overview & Recent Activities */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Visual Monitoring */}
                    <div className="lg:col-span-7 bg-white rounded-xl p-6 border border-[#14283F]/10 space-y-5">
                      <div>
                        <h2 className="text-base font-bold text-[#14283F]">
                          Visualisasi Monitoring Program & Kuota Kelas
                        </h2>
                        <p className="text-xs text-[#14283F]/70">
                          Keterisian kuota santri pada masing-masing halaqah aktif.
                        </p>
                      </div>

                      <div className="space-y-3.5 text-xs">
                        {db.classes.map((cls) => {
                          const pct = Math.min(
                            100,
                            Math.round((cls.studentIds.length / cls.quota) * 100)
                          );
                          return (
                            <div key={cls.id} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-[#14283F]">
                                  {cls.name}
                                </span>
                                <span className="font-mono-num text-[#14283F]/70">
                                  {cls.studentIds.length} / {cls.quota} Santri (
                                  {pct}%)
                                </span>
                              </div>
                              <div className="w-full h-2.5 bg-[#F5F0E4] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#087451] rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Distribusi Kitab per Silsilah */}
                      <div className="pt-4 border-t border-[#14283F]/10 space-y-2.5">
                        <h3 className="text-xs font-bold text-[#14283F]">
                          Distribusi Koleksi Kitab pada 9 Silsilah Keilmuan:
                        </h3>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {db.libraryCategories.map((cat) => {
                            const count = db.books.filter(
                              (b) => b.categoryId === cat.id
                            ).length;
                            return (
                              <div
                                key={cat.id}
                                className="p-2.5 rounded-lg bg-[#F5F0E4]/55 flex items-center justify-between"
                              >
                                <span className="truncate font-medium">
                                  {cat.name.replace('Silsilah ', '')}
                                </span>
                                <span className="font-mono-num font-bold text-[#087451]">
                                  {count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Recent Activities (PRD Section 5.3) */}
                    <div className="lg:col-span-5 bg-white rounded-xl p-6 border border-[#14283F]/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-[#14283F]">
                          Aktivitas Akademik Terbaru
                        </h2>
                        <span className="text-xs font-mono-num text-[#14283F]/60">
                          Live Log
                        </span>
                      </div>
                      <div className="divide-y divide-[#14283F]/10 text-xs">
                        {db.activityLogs.slice(0, 7).map((log) => (
                          <div
                            key={log.id}
                            className="py-2.5 first:pt-0 last:pb-0 space-y-0.5"
                          >
                            <div className="flex items-center justify-between text-[11px] text-[#14283F]/60">
                              <span className="font-mono-num font-semibold text-[#087451]">
                                {log.action}
                              </span>
                              <span className="font-mono-num">
                                {new Date(log.timestamp).toLocaleTimeString(
                                  'id-ID',
                                  { hour: '2-digit', minute: '2-digit' }
                                )}
                              </span>
                            </div>
                            <div className="font-medium text-[#14283F]">
                              {log.targetDescription}
                            </div>
                            <div className="text-[11px] text-[#14283F]/60">
                              Oleh: {log.actorName} ({log.actorRole})
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 2. USER MANAGEMENT & RBAC */}
          {(activeMenu === 'users_students' ||
            activeMenu === 'users_teachers' ||
            activeMenu === 'users_accounts' ||
            activeMenu === 'users_rbac') && (
            <UsersAndAcademicAdmin
              key={activeMenu}
              db={db}
              currentUser={currentUser}
              mode="users"
              initialSubTab={
                activeMenu === 'users_rbac'
                  ? 'rbac'
                  : activeMenu === 'users_accounts'
                  ? 'admins'
                  : activeMenu === 'users_teachers'
                  ? 'teachers'
                  : 'students'
              }
              onMutate={onMutate}
              onNotify={onNotify}
            />
          )}

          {/* 3. ACADEMIC MANAGEMENT */}
          {(activeMenu === 'academic_programs' ||
            activeMenu === 'academic_classes' ||
            activeMenu === 'academic_schedules' ||
            activeMenu === 'academic_admissions' ||
            activeMenu === 'academic_announcements') && (
            <UsersAndAcademicAdmin
              key={activeMenu}
              db={db}
              currentUser={currentUser}
              mode="academic"
              initialSubTab={
                activeMenu === 'academic_admissions'
                  ? 'admissions'
                  : activeMenu === 'academic_schedules'
                  ? 'schedules'
                  : activeMenu === 'academic_classes'
                  ? 'classes'
                  : activeMenu === 'academic_announcements'
                  ? 'announcements'
                  : 'programs'
              }
              onMutate={onMutate}
              onNotify={onNotify}
            />
          )}

          {/* 4. LMS MODULE */}
          {(activeMenu === 'lms_materials' ||
            activeMenu === 'lms_zoom' ||
            activeMenu === 'lms_attendance' ||
            activeMenu === 'lms_assignments' ||
            activeMenu === 'lms_exams' ||
            activeMenu === 'lms_progress') && (
            <LmsModule
              key={activeMenu}
              db={db}
              currentUser={currentUser}
              initialTab={
                activeMenu === 'lms_zoom'
                  ? 'zoom'
                  : activeMenu === 'lms_attendance'
                  ? 'attendance'
                  : activeMenu === 'lms_assignments'
                  ? 'assignments'
                  : activeMenu === 'lms_exams'
                  ? 'exams'
                  : activeMenu === 'lms_progress'
                  ? 'progress'
                  : 'materials'
              }
              onMutate={onMutate}
              onUploadFile={onUploadFile}
              onNotify={onNotify}
            />
          )}

          {/* 5. DIGITAL LIBRARY & 9 SILSILAH */}
          {(activeMenu === 'library_catalog' ||
            activeMenu === 'library_silsilah' ||
            activeMenu === 'library_pathway') && (
            <LibraryModule
              key={activeMenu}
              db={db}
              currentUser={currentUser}
              initialSubView={
                activeMenu === 'library_silsilah'
                  ? 'silsilah'
                  : activeMenu === 'library_pathway'
                  ? 'pathway'
                  : 'catalog'
              }
              onMutate={onMutate}
              onUploadFile={onUploadFile}
              onNotify={onNotify}
            />
          )}

          {/* 6. KNOWLEDGE CENTER & FATWA */}
          {(activeMenu === 'knowledge_fatwa' ||
            activeMenu === 'knowledge_forum') && (
            <KnowledgeReportsAndSettings
              key={activeMenu}
              db={db}
              currentUser={currentUser}
              mode="knowledge"
              onOpenSyncModal={onOpenSyncModal}
              onMutate={onMutate}
              onNotify={onNotify}
            />
          )}

          {/* 7. ANALYTICS & REPORTS */}
          {activeMenu === 'reports' && (
            <KnowledgeReportsAndSettings
              key={activeMenu}
              db={db}
              currentUser={currentUser}
              mode="reports"
              onOpenSyncModal={onOpenSyncModal}
              onMutate={onMutate}
              onNotify={onNotify}
            />
          )}

          {/* 8. SYSTEM SETTINGS */}
          {activeMenu === 'settings' && (
            <KnowledgeReportsAndSettings
              key={activeMenu}
              db={db}
              currentUser={currentUser}
              mode="settings"
              onOpenSyncModal={onOpenSyncModal}
              onMutate={onMutate}
              onNotify={onNotify}
            />
          )}

          {/* 9. USER PROFILE & SELF-SERVICE ID/PASSWORD EDITOR */}
          {activeMenu === 'profile' && (
            <div className="bg-white rounded-xl p-6 border border-[#14283F]/10 max-w-2xl space-y-5 text-xs">
              <div>
                <div className="text-xs font-semibold text-[#087451]">
                  Profil &amp; Pengaturan Kredensial Akun Saya
                </div>
                <h2 className="text-xl font-display font-bold text-[#14283F] mt-0.5">
                  {currentUser.fullName}
                </h2>
                <p className="text-[#14283F]/70 mt-1">
                  Anda dapat memperbarui ID Login (Username), Password, Email, dan informasi kontak akun Anda secara langsung di bawah ini.
                </p>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const validation = validateAccountCredentialsUpdate({
                    users: db.users,
                    targetUserId: currentUser.id,
                    username: selfAccountForm.username,
                    email: selfAccountForm.email,
                    password: selfAccountForm.password,
                    requirePassword: true,
                  });
                  if (!validation.valid) {
                    onNotify(validation.error || 'Data akun tidak valid.', 'error');
                    return;
                  }
                  const nowIso = new Date().toISOString();
                  await onMutate({
                    moduleKey: 'dashboard',
                    action: 'view',
                    actionLabel: 'UPDATE_PROFIL_ID_PASSWORD',
                    targetDescription: `Memperbarui profil, ID Login (${validation.cleanUsername}) & password akun ${selfAccountForm.fullName}`,
                    updater: (prev) => ({
                      ...prev,
                      users: prev.users.map((u) =>
                        u.id === currentUser.id
                          ? {
                              ...u,
                              fullName: selfAccountForm.fullName.trim(),
                              username: validation.cleanUsername,
                              email: validation.cleanEmail,
                              passwordHash: selfAccountForm.password.trim(),
                              whatsapp: selfAccountForm.whatsapp.trim(),
                              city: selfAccountForm.city.trim(),
                              updatedAt: nowIso,
                            }
                          : u
                      ),
                      students: prev.students.map((s) =>
                        s.userId === currentUser.id
                          ? {
                              ...s,
                              fullName: selfAccountForm.fullName.trim(),
                              email: validation.cleanEmail,
                              whatsapp: selfAccountForm.whatsapp.trim(),
                              city: selfAccountForm.city.trim(),
                            }
                          : s
                      ),
                      teachers: prev.teachers.map((t) =>
                        t.userId === currentUser.id
                          ? {
                              ...t,
                              fullName: selfAccountForm.fullName.trim(),
                              email: validation.cleanEmail,
                              whatsapp: selfAccountForm.whatsapp.trim(),
                            }
                          : t
                      ),
                    }),
                  });
                  onNotify(
                    `Profil, ID Login (${validation.cleanUsername}) & Password Anda berhasil diperbarui!`,
                    'success'
                  );
                }}
                className="space-y-4 pt-2 border-t border-[#14283F]/10"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="self-fullname" className="block font-semibold mb-1">
                      Nama Lengkap *
                    </label>
                    <input
                      id="self-fullname"
                      type="text"
                      required
                      value={selfAccountForm.fullName}
                      onChange={(e) =>
                        setSelfAccountForm({
                          ...selfAccountForm,
                          fullName: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#14283F]/20"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">
                      Role &amp; Hak Akses
                    </label>
                    <div className="px-3.5 py-2.5 rounded-lg bg-[#F5F0E4]/65 font-semibold text-[#087451]">
                      {db.roles.find((r) => r.id === currentUser.role)?.name} (
                      {currentUser.role})
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#F5F0E4]/60 border border-[#C5A45B]/35">
                  <div>
                    <label htmlFor="self-username" className="block font-bold text-[#14283F] mb-1">
                      ID Login (Username) *
                    </label>
                    <input
                      id="self-username"
                      type="text"
                      required
                      value={selfAccountForm.username}
                      onChange={(e) =>
                        setSelfAccountForm({
                          ...selfAccountForm,
                          username: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#14283F]/25 bg-white font-mono-num font-bold"
                    />
                  </div>
                  <div>
                    <label htmlFor="self-password" className="block font-bold text-[#087451] mb-1">
                      Password Login *
                    </label>
                    <input
                      id="self-password"
                      type="text"
                      required
                      value={selfAccountForm.password}
                      onChange={(e) =>
                        setSelfAccountForm({
                          ...selfAccountForm,
                          password: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#087451]/35 bg-white font-mono-num font-bold text-[#087451]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="self-email" className="block font-semibold mb-1">
                      Alamat Email *
                    </label>
                    <input
                      id="self-email"
                      type="email"
                      required
                      value={selfAccountForm.email}
                      onChange={(e) =>
                        setSelfAccountForm({
                          ...selfAccountForm,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#14283F]/20 font-mono-num"
                    />
                  </div>
                  <div>
                    <label htmlFor="self-whatsapp" className="block font-semibold mb-1">
                      Nomor WhatsApp
                    </label>
                    <input
                      id="self-whatsapp"
                      type="text"
                      value={selfAccountForm.whatsapp}
                      onChange={(e) =>
                        setSelfAccountForm({
                          ...selfAccountForm,
                          whatsapp: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#14283F]/20 font-mono-num"
                    />
                  </div>
                  <div>
                    <label htmlFor="self-city" className="block font-semibold mb-1">
                      Domisili / Kota
                    </label>
                    <input
                      id="self-city"
                      type="text"
                      value={selfAccountForm.city}
                      onChange={(e) =>
                        setSelfAccountForm({
                          ...selfAccountForm,
                          city: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#14283F]/20"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-[#087451] hover:bg-[#065d40] text-white font-semibold flex items-center gap-2 transition-colors"
                  >
                    <KeyRound className="w-4 h-4" />
                    Simpan Perubahan ID &amp; Password Saya
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
