import {
  AcademicClass,
  AcademyDatabase,
  Assignment,
  AssignmentSubmission,
  AttendanceSession,
  DistributionRight,
  ExamQuestion,
  Examination,
  GradeRecord,
  LearningMaterial,
  LibraryBook,
  ModuleKey,
  PermissionAction,
  RoleDefinition,
  UserAccount,
  VerificationStatus,
} from '../types/database';

/**
 * Checks if a user has a specific permission on a given module according to RBAC configuration.
 */
export function hasPermission(
  user: UserAccount | null,
  roles: RoleDefinition[],
  moduleKey: ModuleKey,
  action: PermissionAction
): boolean {
  if (!user || user.status !== 'Active') return false;
  if (user.role === 'super_admin') return true;
  const roleDef = roles.find((r) => r.id === user.role);
  if (!roleDef) return false;
  const allowedActions = roleDef.permissions[moduleKey] || [];
  return allowedActions.includes(action);
}

/**
 * Enforces Zoom link security (PRD Section 8.4 & 15.7):
 * - Super Admin & Admin Akademik can access all class Zoom links
 * - Pengajar can access Zoom links for classes they teach
 * - Santri can ONLY access Zoom links for classes they are enrolled in
 * - Unauthenticated visitors or non-enrolled Santri are strictly denied
 */
export function canAccessZoomLink(
  user: UserAccount | null,
  academicClass: AcademicClass,
  studentProfileId?: string,
  teacherProfileId?: string
): boolean {
  if (!user || user.status !== 'Active') return false;
  if (user.role === 'super_admin' || user.role === 'admin_akademik') {
    return true;
  }
  if (user.role === 'pengajar') {
    return (
      academicClass.teacherId === teacherProfileId ||
      academicClass.teacherId === user.id
    );
  }
  if (user.role === 'santri') {
    return (
      (studentProfileId ? academicClass.studentIds.includes(studentProfileId) : false) ||
      academicClass.studentIds.includes(user.id)
    );
  }
  return false;
}

/**
 * Enforces Book Copyright & Distribution Responsibility (PRD Section 9.4):
 * Files can only be downloaded/opened if distribution rights are clear and authorized.
 * If 'Metadata Only' or 'Unverified' (when verification is required), only bibliographic metadata is shown.
 */
export function canAccessBookFile(
  book: Pick<LibraryBook, 'distributionRight' | 'verificationStatus'>,
  user: UserAccount | null,
  requireVerification: boolean = true
): { allowed: boolean; reason: string } {
  if (book.distributionRight === 'Metadata Only') {
    return {
      allowed: false,
      reason: 'Status hak distribusi adalah Metadata Only. Unduhan dokumen dinonaktifkan demi kepatuhan hak cipta.',
    };
  }
  if (requireVerification && book.verificationStatus === 'Unverified') {
    return {
      allowed: false,
      reason: 'Metadata dan izin distribusi kitab ini belum terverifikasi oleh tim perpustakaan.',
    };
  }
  if (book.distributionRight === 'Restricted Access') {
    if (!user || user.status !== 'Active') {
      return {
        allowed: false,
        reason: 'Koleksi terbatas (Restricted Access). Silakan login sebagai sivitas akademika untuk mengakses.',
      };
    }
  }
  return {
    allowed: true,
    reason: `Akses diizinkan (${book.distributionRight})`,
  };
}

/**
 * Normalizes Arabic and Latin text for Smart Library Search (strips Arabic diacritics/harakat, normalizes hamzah/alif, lowercases Latin).
 */
export function normalizeSearchText(input: string): string {
  if (!input) return '';
  return input
    .toLowerCase()
    // Remove Arabic Tashkeel / Harakat
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    // Normalize Alif variants
    .replace(/[أإآ]/g, 'ا')
    // Normalize Teh Marbuta and Yeh
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    // Normalize common Latin transliteration apostrophes/hyphens
    .replace(/['’`\-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface LibrarySearchFilters {
  query?: string;
  categoryId?: string;
  subcategoryId?: string;
  authorName?: string;
  difficultyLevel?: string;
  language?: string;
  verificationStatus?: VerificationStatus | 'ALL';
  distributionRight?: DistributionRight | 'ALL';
  onlyPublished?: boolean;
}

/**
 * Smart Library Search across Arabic Title, Transliteration, Translation, Author, Category, Field of Study, and Description.
 */
export function searchAndFilterBooks(
  books: LibraryBook[],
  filters: LibrarySearchFilters
): LibraryBook[] {
  const normQuery = normalizeSearchText(filters.query || '');

  return books.filter((book) => {
    if (filters.onlyPublished && !book.isPublished) return false;
    if (filters.categoryId && filters.categoryId !== 'ALL' && book.categoryId !== filters.categoryId) {
      return false;
    }
    if (
      filters.subcategoryId &&
      filters.subcategoryId !== 'ALL' &&
      book.subcategoryId !== filters.subcategoryId
    ) {
      return false;
    }
    if (
      filters.difficultyLevel &&
      filters.difficultyLevel !== 'ALL' &&
      book.difficultyLevel !== filters.difficultyLevel
    ) {
      return false;
    }
    if (filters.language && filters.language !== 'ALL' && book.language !== filters.language) {
      return false;
    }
    if (
      filters.verificationStatus &&
      filters.verificationStatus !== 'ALL' &&
      book.verificationStatus !== filters.verificationStatus
    ) {
      return false;
    }
    if (
      filters.distributionRight &&
      filters.distributionRight !== 'ALL' &&
      book.distributionRight !== filters.distributionRight
    ) {
      return false;
    }
    if (filters.authorName && filters.authorName !== 'ALL') {
      if (
        !normalizeSearchText(book.authorName).includes(
          normalizeSearchText(filters.authorName)
        )
      ) {
        return false;
      }
    }

    if (!normQuery) return true;

    const searchableBlob = normalizeSearchText(
      [
        book.code,
        book.arabicTitle,
        book.transliterationTitle,
        book.translatedTitle,
        book.authorName,
        book.authorArabicName || '',
        book.fieldOfStudy,
        book.description,
        book.difficultyLevel,
        book.language,
      ].join(' ')
    );

    const queryTokens = normQuery.split(' ').filter(Boolean);
    return queryTokens.every((token) => searchableBlob.includes(token));
  });
}

export interface StudentProgressSummary {
  completedMaterialsCount: number;
  totalMaterialsCount: number;
  materialCompletionPercent: number;
  submittedAssignmentsCount: number;
  totalAssignmentsCount: number;
  attendancePresentCount: number;
  totalAttendanceSessions: number;
  attendanceRatePercent: number;
  averageScore: number;
  overallProgressPercent: number;
}

/**
 * Calculates deterministic student progress from real database records (PRD Section 8.9).
 */
export function calculateStudentProgress(params: {
  studentId: string;
  enrolledClassIds: string[];
  materials: LearningMaterial[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  attendanceSessions: AttendanceSession[];
  grades: GradeRecord[];
}): StudentProgressSummary {
  const {
    studentId,
    enrolledClassIds,
    materials,
    assignments,
    submissions,
    attendanceSessions,
    grades,
  } = params;

  const classMaterials = materials.filter((m) =>
    enrolledClassIds.includes(m.classId)
  );
  const completedMaterialsCount = classMaterials.filter((m) =>
    m.completedByStudentIds.includes(studentId)
  ).length;
  const totalMaterialsCount = classMaterials.length;
  const materialCompletionPercent =
    totalMaterialsCount > 0
      ? Math.round((completedMaterialsCount / totalMaterialsCount) * 100)
      : 0;

  const classAssignments = assignments.filter((a) =>
    enrolledClassIds.includes(a.classId)
  );
  const totalAssignmentsCount = classAssignments.length;
  const submittedAssignmentsCount = classAssignments.filter((a) =>
    submissions.some(
      (s) =>
        s.assignmentId === a.id &&
        s.studentId === studentId &&
        s.status !== 'Not Submitted'
    )
  ).length;
  const assignmentPercent =
    totalAssignmentsCount > 0
      ? Math.round((submittedAssignmentsCount / totalAssignmentsCount) * 100)
      : 0;

  const classSessions = attendanceSessions.filter((s) =>
    enrolledClassIds.includes(s.classId)
  );
  const totalAttendanceSessions = classSessions.length;
  const attendancePresentCount = classSessions.filter((s) => {
    const status = s.records[studentId];
    return status === 'Present' || status === 'Late' || status === 'Excused';
  }).length;
  const attendanceRatePercent =
    totalAttendanceSessions > 0
      ? Math.round((attendancePresentCount / totalAttendanceSessions) * 100)
      : 0;

  const studentGrades = grades.filter((g) => g.studentId === studentId);
  const averageScore =
    studentGrades.length > 0
      ? Math.round(
          studentGrades.reduce(
            (acc, g) => acc + (g.maxScore > 0 ? (g.score / g.maxScore) * 100 : 0),
            0
          ) / studentGrades.length
        )
      : 0;

  // Weighted overall class progress: 40% materials + 30% assignments + 30% attendance
  const activeComponents: number[] = [];
  if (totalMaterialsCount > 0) activeComponents.push(materialCompletionPercent);
  if (totalAssignmentsCount > 0) activeComponents.push(assignmentPercent);
  if (totalAttendanceSessions > 0) activeComponents.push(attendanceRatePercent);

  const overallProgressPercent =
    activeComponents.length > 0
      ? Math.round(
          activeComponents.reduce((a, b) => a + b, 0) / activeComponents.length
        )
      : 0;

  return {
    completedMaterialsCount,
    totalMaterialsCount,
    materialCompletionPercent,
    submittedAssignmentsCount,
    totalAssignmentsCount,
    attendancePresentCount,
    totalAttendanceSessions,
    attendanceRatePercent,
    averageScore,
    overallProgressPercent,
  };
}

/**
 * Automatically scores objective questions and determines if manual essay review is pending (PRD Section 8.8).
 */
export function gradeExamAttempt(
  exam: Pick<Examination, 'questions'>,
  answers: Record<string, string | number>
): {
  objectiveScore: number;
  hasEssay: boolean;
  gradingStatus: 'Auto-Graded' | 'Pending Essay Review';
} {
  let objectiveScore = 0;
  let hasEssay = false;

  for (const q of exam.questions) {
    if (q.type === 'objective') {
      const selected = answers[q.id];
      if (
        typeof selected === 'number' &&
        selected === q.correctOptionIndex
      ) {
        objectiveScore += q.points;
      }
    } else if (q.type === 'essay') {
      hasEssay = true;
    }
  }

  return {
    objectiveScore,
    hasEssay,
    gradingStatus: hasEssay ? 'Pending Essay Review' : 'Auto-Graded',
  };
}

/**
 * Verifies the Owner Passcode required to unlock the System Settings & Database Sync menu.
 */
export const OWNER_SETTINGS_PASSCODE = '2026';

export function verifyOwnerSettingsPasscode(inputCode: string): boolean {
  return inputCode.trim() === OWNER_SETTINGS_PASSCODE;
}

/**
 * FILE 1: Code.gs
 * Generates the Web App API Engine (doGet, doPost, and real-time table synchronization) for Google Apps Script.
 */
export function generateGoogleAppsScriptCode(academyName: string): string {
  return `/**
 * ============================================================================
 * FILE 1: Code.gs — WEB APP API & REAL-TIME SYNC ENGINE
 * ${academyName.toUpperCase()}
 * ============================================================================
 * Panduan Pemasangan (2 File Terpisah: Code.gs & Setup.gs):
 * 1. Buka Google Sheets Anda -> Klik Extensions (Ekstensi) -> Apps Script.
 * 2. Pada file "Code.gs", hapus kode lama lalu tempelkan (Paste) kode ini.
 * 3. Buat file script kedua bernama "Setup.gs" (klik ikon + -> Script),
 *    lalu tempelkan kode dari tab "3. File Kedua: Setup.gs".
 * 4. Jalankan fungsi "setupIslamicAcademyDatabase()" pada Setup.gs satu kali
 *    untuk membuat 21 tab sheet beserta format header-nya.
 * 5. Klik "Deploy" -> "New deployment" -> Jenis: "Web app"
 *    - Execute as: "Me" (Saya)
 *    - Who has access: "Anyone" (Siapa saja)
 * 6. Salin "Web App URL" dan tempelkan ke menu Pengaturan Sistem di aplikasi.
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (typeof ensureSheetsExist === 'function') {
    ensureSheetsExist(ss);
  }
  var metaSheet = ss.getSheetByName('Meta_State') || ss.insertSheet('Meta_State');
  var rawJson = metaSheet.getRange('A2').getValue();
  var updatedAt = metaSheet.getRange('B2').getValue();

  if (!rawJson) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'empty',
      message: 'Spreadsheet siap digunakan. Silakan klik Push Data ke Google Sheet dari aplikasi.'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    updatedAt: updatedAt,
    database: JSON.parse(rawJson)
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (typeof ensureSheetsExist === 'function') {
      ensureSheetsExist(ss);
    }
    var payload = JSON.parse(e.postData.contents);
    var db = payload.database;
    var now = new Date().toISOString();

    // 1. Simpan snapshot JSON utuh pada Meta_State untuk sinkronisasi instan HP <-> PC
    var metaSheet = ss.getSheetByName('Meta_State') || ss.insertSheet('Meta_State');
    metaSheet.clearContents();
    metaSheet.getRange('A1:C1').setValues([['Database_JSON', 'Updated_At', 'Revision']]);
    metaSheet.getRange('A2:C2').setValues([[JSON.stringify(db), now, db.revision || 1]]);

    // 2. Ekspor tabel terstruktur ke masing-masing 20 Tab Sheet operasional
    writeCollectionToSheet(ss, 'Users', db.users || []);
    writeCollectionToSheet(ss, 'Students', db.students || []);
    writeCollectionToSheet(ss, 'Teachers', db.teachers || []);
    writeCollectionToSheet(ss, 'Programs', db.programs || []);
    writeCollectionToSheet(ss, 'Classes', db.classes || []);
    writeCollectionToSheet(ss, 'Schedules', db.schedules || []);
    writeCollectionToSheet(ss, 'Admissions', db.admissions || []);
    writeCollectionToSheet(ss, 'Announcements', db.announcements || []);
    writeCollectionToSheet(ss, 'Materials', db.materials || []);
    writeCollectionToSheet(ss, 'Attendance', db.attendanceSessions || []);
    writeCollectionToSheet(ss, 'Assignments', db.assignments || []);
    writeCollectionToSheet(ss, 'Submissions', db.submissions || []);
    writeCollectionToSheet(ss, 'Examinations', db.examinations || []);
    writeCollectionToSheet(ss, 'Grades', db.grades || []);
    writeCollectionToSheet(ss, 'Library_Categories', db.libraryCategories || []);
    writeCollectionToSheet(ss, 'Library_Subcategories', db.librarySubcategories || []);
    writeCollectionToSheet(ss, 'Books', db.books || []);
    writeCollectionToSheet(ss, 'Fatwas', db.fatwas || []);
    writeCollectionToSheet(ss, 'Questions', db.questions || []);
    writeCollectionToSheet(ss, 'Activity_Logs', (db.activityLogs || []).slice(0, 200));

    return ContentService.createTextOutput(JSON.stringify({
      status: 'ok',
      syncedAt: now,
      revision: db.revision
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function writeCollectionToSheet(ss, sheetName, rows) {
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  sheet.clearContents();
  if (!rows || rows.length === 0) {
    var defaultHeaders = (typeof SHEET_SCHEMA !== 'undefined' && SHEET_SCHEMA[sheetName])
      ? SHEET_SCHEMA[sheetName]
      : ['id', 'status', 'updatedAt'];
    sheet.getRange(1, 1, 1, defaultHeaders.length).setValues([defaultHeaders]);
    return;
  }
  var headers = Object.keys(rows[0]);
  var values = [headers];
  rows.forEach(function(item) {
    var row = headers.map(function(k) {
      var val = item[k];
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val);
    });
    values.push(row);
  });
  sheet.getRange(1, 1, values.length, headers.length).setValues(values);
  if (typeof formatSheetHeader === 'function') {
    formatSheetHeader(sheet, headers.length);
  }
}
`;
}

/**
 * FILE 2: Setup.gs
 * Generates the Database Schema Initializer, 21-Tab Creator, Header Styling, and Custom Menu for Google Sheets.
 */
export function generateGoogleAppsScriptSetupCode(academyName: string): string {
  return `/**
 * ============================================================================
 * FILE 2: Setup.gs — INISIALISASI 21 TAB DATABASE & SKEMA HEADER GOOGLE SHEET
 * ${academyName.toUpperCase()}
 * ============================================================================
 * Cara Penggunaan Setup.gs:
 * 1. Di editor Google Apps Script, klik tanda "+" (Add a file) -> pilih "Script".
 * 2. Beri nama file: Setup (sehingga menjadi Setup.gs).
 * 3. Tempelkan (Paste) seluruh kode ini ke dalam Setup.gs lalu tekan Ctrl+S (Simpan).
 * 4. Pilih fungsi "setupIslamicAcademyDatabase" pada dropdown toolbar atas,
 *    lalu klik tombol "Run" (Jalankan) untuk membuat dan memformat 21 tab sekaligus!
 */

const SHEET_SCHEMA = {
  Meta_State: ['Database_JSON', 'Updated_At', 'Revision'],
  Users: ['id', 'username', 'email', 'passwordHash', 'fullName', 'role', 'whatsapp', 'gender', 'city', 'status', 'joinedAt', 'createdAt', 'updatedAt'],
  Students: ['id', 'userId', 'nis', 'fullName', 'email', 'whatsapp', 'gender', 'city', 'joinedAt', 'programIds', 'classIds', 'accountStatus', 'membershipStatus', 'notes'],
  Teachers: ['id', 'userId', 'nip', 'fullName', 'arabicName', 'specialization', 'biography', 'email', 'whatsapp', 'gender', 'city', 'classIds', 'accountStatus'],
  Programs: ['id', 'code', 'title', 'arabicTitle', 'level', 'duration', 'description', 'fee', 'quota', 'status', 'curriculumTopics'],
  Classes: ['id', 'code', 'name', 'programId', 'teacherId', 'studentIds', 'quota', 'scheduleSummary', 'startDate', 'endDate', 'status', 'zoomLink', 'zoomMeetingId', 'zoomPasscode', 'zoomNotes'],
  Schedules: ['id', 'classId', 'programId', 'teacherId', 'dayOfWeek', 'date', 'startTime', 'endTime', 'timezone', 'topic', 'roomOrChannel', 'sessionStatus'],
  Admissions: ['id', 'registrationNumber', 'fullName', 'email', 'whatsapp', 'gender', 'city', 'programId', 'backgroundNotes', 'status', 'submittedAt', 'assignedClassId', 'reviewedBy'],
  Announcements: ['id', 'title', 'category', 'content', 'targetAudience', 'status', 'publishedAt', 'authorName'],
  Materials: ['id', 'classId', 'orderIndex', 'title', 'description', 'type', 'fileUrl', 'fileName', 'fileSizeKb', 'accessScope', 'distributionRight', 'uploadedBy', 'uploadedAt', 'completedByStudentIds'],
  Attendance: ['id', 'classId', 'date', 'topic', 'createdBy', 'records'],
  Assignments: ['id', 'classId', 'title', 'instructions', 'dueDate', 'maxScore', 'attachmentUrl', 'createdBy', 'createdAt'],
  Submissions: ['id', 'assignmentId', 'studentId', 'answerText', 'fileUrl', 'fileName', 'submittedAt', 'status', 'score', 'feedback'],
  Examinations: ['id', 'classId', 'title', 'description', 'durationMinutes', 'passingScore', 'status', 'questions', 'attempts'],
  Grades: ['id', 'studentId', 'classId', 'componentType', 'referenceId', 'title', 'score', 'maxScore', 'feedback', 'gradedAt', 'gradedBy'],
  Library_Categories: ['id', 'orderNumber', 'slug', 'name', 'arabicName', 'description', 'corecompetency'],
  Library_Subcategories: ['id', 'categoryId', 'name', 'arabicName', 'description', 'recommendedOrder'],
  Books: ['id', 'code', 'arabicTitle', 'transliterationTitle', 'translatedTitle', 'description', 'coverAccent', 'authorName', 'authorDeathYearHijri', 'categoryId', 'subcategoryId', 'difficultyLevel', 'verificationStatus', 'distributionRight', 'isPublished', 'accessCount'],
  Fatwas: ['id', 'code', 'title', 'category', 'questionContext', 'answerContent', 'muftiName', 'sourceReference', 'kitabReferences', 'publishedDate', 'verificationStatus'],
  Questions: ['id', 'studentId', 'studentName', 'category', 'title', 'questionText', 'createdAt', 'status', 'answeredBy', 'answerText', 'answeredAt'],
  Activity_Logs: ['id', 'actorId', 'actorName', 'actorRole', 'action', 'module', 'targetDescription', 'timestamp']
};

const SHEET_TABS = Object.keys(SHEET_SCHEMA);

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Islamic Academy DB')
    .addItem('1. Inisialisasi & Format 21 Tab Database', 'setupIslamicAcademyDatabase')
    .addItem('2. Bersihkan Cache Snapshot Meta_State', 'resetMetaStateSnapshot')
    .addToUi();
}

function ensureSheetsExist(ss) {
  var targetSs = ss || SpreadsheetApp.getActiveSpreadsheet();
  SHEET_TABS.forEach(function(tabName) {
    if (!targetSs.getSheetByName(tabName)) {
      var newSheet = targetSs.insertSheet(tabName);
      var headers = SHEET_SCHEMA[tabName];
      newSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      formatSheetHeader(newSheet, headers.length);
    }
  });
}

function formatSheetHeader(sheet, colCount) {
  var headerRange = sheet.getRange(1, 1, 1, colCount);
  headerRange
    .setBackground('#087451')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('left');
  sheet.setFrozenRows(1);
}

function setupIslamicAcademyDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  SHEET_TABS.forEach(function(tabName) {
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
    }
    var headers = SHEET_SCHEMA[tabName];
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    formatSheetHeader(sheet, headers.length);
  });
  return 'Inisialisasi 21 Tab Database Islamic Academy Portal selesai!';
}

function resetMetaStateSnapshot() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var metaSheet = ss.getSheetByName('Meta_State');
  if (metaSheet) {
    metaSheet.clearContents();
    var headers = SHEET_SCHEMA.Meta_State;
    metaSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    formatSheetHeader(metaSheet, headers.length);
  }
}
`;
}

export const VERCEL_ENV_APPS_SCRIPT_KEY = 'VITE_APPS_SCRIPT_URL';

export const DEFAULT_APPS_SCRIPT_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbwVVIpsKaBwP2VBDLS6nHrj7EQ7xct1nTAqLKhlpGPJmE8jm6OVYwm7hX7fzD5AhCmw/exec';

/**
 * Resolves the active Google Apps Script Web App URL with priority:
 * 1. Explicit URL saved in settings (if valid script.google.com URL)
 * 2. Single Vercel Environment Variable (VITE_APPS_SCRIPT_URL)
 * 3. Pre-configured default Apps Script Web App URL
 */
export function resolveAppsScriptWebAppUrl(
  configuredUrl?: string,
  envUrl?: string
): string {
  const cleanConfigured = (configuredUrl || '').trim();
  const cleanEnv = (envUrl || '').trim();

  if (
    cleanConfigured.startsWith('https://script.google.com/') &&
    cleanConfigured !== DEFAULT_APPS_SCRIPT_WEB_APP_URL
  ) {
    return cleanConfigured;
  }
  if (cleanEnv.startsWith('https://script.google.com/')) {
    return cleanEnv;
  }
  if (cleanConfigured.startsWith('https://script.google.com/')) {
    return cleanConfigured;
  }
  return DEFAULT_APPS_SCRIPT_WEB_APP_URL;
}

/**
 * Validates updates or creation of user account ID (username), email, and password.
 */
export function validateAccountCredentialsUpdate(params: {
  users: Pick<UserAccount, 'id' | 'username' | 'email'>[];
  targetUserId?: string;
  username: string;
  email: string;
  password?: string;
  requirePassword?: boolean;
}): { valid: boolean; error?: string; cleanUsername: string; cleanEmail: string } {
  const cleanUsername = (params.username || '').trim().toLowerCase().replace(/\s+/g, '_');
  const cleanEmail = (params.email || '').trim().toLowerCase();
  const cleanPass = (params.password || '').trim();

  if (!cleanUsername || cleanUsername.length < 3) {
    return {
      valid: false,
      error: 'ID Login (Username) wajib diisi minimal 3 karakter.',
      cleanUsername,
      cleanEmail,
    };
  }

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return {
      valid: false,
      error: 'Alamat email tidak valid.',
      cleanUsername,
      cleanEmail,
    };
  }

  const duplicateUsername = params.users.find(
    (u) =>
      u.id !== params.targetUserId &&
      u.username.trim().toLowerCase() === cleanUsername
  );
  if (duplicateUsername) {
    return {
      valid: false,
      error: `ID Login "${cleanUsername}" sudah digunakan oleh akun lain.`,
      cleanUsername,
      cleanEmail,
    };
  }

  const duplicateEmail = params.users.find(
    (u) =>
      u.id !== params.targetUserId &&
      u.email.trim().toLowerCase() === cleanEmail
  );
  if (duplicateEmail) {
    return {
      valid: false,
      error: `Email "${cleanEmail}" sudah terdaftar pada akun lain.`,
      cleanUsername,
      cleanEmail,
    };
  }

  if (params.requirePassword && cleanPass.length < 4) {
    return {
      valid: false,
      error: 'Password wajib diisi minimal 4 karakter.',
      cleanUsername,
      cleanEmail,
    };
  }

  if (cleanPass.length > 0 && cleanPass.length < 4) {
    return {
      valid: false,
      error: 'Password baru minimal terdiri dari 4 karakter.',
      cleanUsername,
      cleanEmail,
    };
  }

  return {
    valid: true,
    cleanUsername,
    cleanEmail,
  };
}

