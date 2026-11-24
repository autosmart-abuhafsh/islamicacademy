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
 * Generates a ready-to-deploy Google Apps Script (Code.gs) for real-time Google Sheets database storage and bidirectional sync across mobile (HP) and desktop (PC).
 */
export function generateGoogleAppsScriptCode(academyName: string): string {
  return `/**
 * ============================================================================
 * GOOGLE APPS SCRIPT - REAL-TIME DATABASE ENGINE FOR ${academyName.toUpperCase()}
 * ============================================================================
 * Cara Penggunaan:
 * 1. Buka Google Sheets baru di https://sheets.new
 * 2. Klik menu Extensions (Ekstensi) -> Apps Script
 * 3. Hapus kode lama, tempelkan (Paste) seluruh kode ini ke dalam Code.gs
 * 4. Klik tombol "Deploy" -> "New deployment" (Deployment baru)
 * 5. Pilih jenis: "Web app"
 *    - Execute as: "Me" (Saya)
 *    - Who has access: "Anyone" (Siapa saja) -> agar HP & PC dapat sinkronisasi otomatis
 * 6. Salin "Web App URL" (https://script.google.com/macros/s/.../exec)
 * 7. Tempelkan URL tersebut pada menu "Pengaturan Sistem -> Integrasi Google Sheet" di aplikasi.
 */

const SHEET_TABS = [
  'Meta_State',
  'Users',
  'Students',
  'Teachers',
  'Programs',
  'Classes',
  'Schedules',
  'Admissions',
  'Announcements',
  'Materials',
  'Attendance',
  'Assignments',
  'Submissions',
  'Examinations',
  'Grades',
  'Library_Categories',
  'Library_Subcategories',
  'Books',
  'Fatwas',
  'Questions',
  'Activity_Logs'
];

function ensureSheetsExist(ss) {
  SHEET_TABS.forEach(function(tabName) {
    if (!ss.getSheetByName(tabName)) {
      ss.insertSheet(tabName);
    }
  });
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheetsExist(ss);
  var metaSheet = ss.getSheetByName('Meta_State');
  var rawJson = metaSheet.getRange('A2').getValue();
  var updatedAt = metaSheet.getRange('B2').getValue();

  if (!rawJson) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'empty',
      message: 'Spreadsheet siap digunakan. Silakan klik Push / Sinkronisasi dari aplikasi.'
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
    ensureSheetsExist(ss);
    var payload = JSON.parse(e.postData.contents);
    var db = payload.database;
    var now = new Date().toISOString();

    // 1. Simpan snapshot JSON utuh pada Meta_State untuk sinkronisasi instan HP <-> PC
    var metaSheet = ss.getSheetByName('Meta_State');
    metaSheet.clear();
    metaSheet.getRange('A1:C1').setValues([['Database_JSON', 'Updated_At', 'Revision']]);
    metaSheet.getRange('A2:C2').setValues([[JSON.stringify(db), now, db.revision || 1]]);

    // 2. Ekspor tabel terstruktur ke masing-masing Tab Sheet agar mudah dibaca & diedit di Google Sheets
    writeCollectionToSheet(ss, 'Users', db.users || []);
    writeCollectionToSheet(ss, 'Students', db.students || []);
    writeCollectionToSheet(ss, 'Teachers', db.teachers || []);
    writeCollectionToSheet(ss, 'Programs', db.programs || []);
    writeCollectionToSheet(ss, 'Classes', db.classes || []);
    writeCollectionToSheet(ss, 'Schedules', db.schedules || []);
    writeCollectionToSheet(ss, 'Admissions', db.admissions || []);
    writeCollectionToSheet(ss, 'Announcements', db.announcements || []);
    writeCollectionToSheet(ss, 'Materials', db.materials || []);
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
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  sheet.clear();
  if (!rows || rows.length === 0) {
    sheet.getRange(1, 1).setValue('No Data');
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
}
`;
}
