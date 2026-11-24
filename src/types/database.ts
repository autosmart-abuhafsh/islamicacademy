export type RoleId =
  | 'super_admin'
  | 'admin_akademik'
  | 'admin_perpustakaan'
  | 'admin_konten'
  | 'pengajar'
  | 'santri';

export type ModuleKey =
  | 'dashboard'
  | 'users'
  | 'academic'
  | 'lms'
  | 'library'
  | 'knowledge'
  | 'reports'
  | 'settings';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'publish';

export interface RoleDefinition {
  id: RoleId;
  name: string;
  description: string;
  permissions: Record<ModuleKey, PermissionAction[]>;
}

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: RoleId;
  whatsapp: string;
  gender: 'Laki-laki' | 'Perempuan';
  city: string;
  avatarUrl?: string;
  status: 'Active' | 'Inactive' | 'Archived';
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  nis: string; // Nomor Induk Santri
  fullName: string;
  email: string;
  whatsapp: string;
  gender: 'Laki-laki' | 'Perempuan';
  city: string;
  joinedAt: string;
  programIds: string[];
  classIds: string[];
  membershipStatus: 'Active' | 'On Leave' | 'Graduated' | 'Archived';
  accountStatus: 'Active' | 'Inactive' | 'Archived';
}

export interface TeacherProfile {
  id: string;
  userId: string;
  nip: string; // Nomor Induk Pengajar
  fullName: string;
  email: string;
  whatsapp: string;
  expertise: string[];
  biography: string;
  classIds: string[];
  accountStatus: 'Active' | 'Inactive' | 'Archived';
}

export type ProgramStatus =
  | 'Draft'
  | 'Open Registration'
  | 'Full'
  | 'Ongoing'
  | 'Completed'
  | 'Archived';

export interface AcademicProgram {
  id: string;
  code: string;
  title: string;
  arabicTitle?: string;
  description: string;
  teacherIds: string[];
  duration: string;
  level: 'Pemula' | 'Menengah' | 'Lanjutan';
  fee: string;
  requirements: string[];
  status: ProgramStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicClass {
  id: string;
  code: string;
  name: string;
  programId: string;
  teacherId: string;
  studentIds: string[];
  quota: number;
  scheduleSummary: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Upcoming' | 'Completed' | 'Archived';
  zoomLink: string;
  zoomMeetingId: string;
  zoomPasscode: string;
  zoomNotes: string;
}

export interface ClassSchedule {
  id: string;
  classId: string;
  teacherId: string;
  dayOfWeek: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Ahad';
  date: string;
  startTime: string;
  endTime: string;
  topic: string;
  sessionStatus: 'Scheduled' | 'Live' | 'Completed' | 'Rescheduled';
  onlineLink: string;
  timezone: string;
}

export type AdmissionStatus =
  | 'Pending'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Enrolled';

export interface AdmissionApplication {
  id: string;
  registrationNumber: string;
  fullName: string;
  email: string;
  whatsapp: string;
  gender: 'Laki-laki' | 'Perempuan';
  city: string;
  programId: string;
  assignedClassId?: string;
  backgroundNotes: string;
  status: AdmissionStatus;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  category:
    | 'Pengumuman Resmi'
    | 'Informasi Pendaftaran'
    | 'Perubahan Jadwal'
    | 'Informasi Kelas'
    | 'Agenda Akademik';
  content: string;
  publishedAt: string;
  status: 'Published' | 'Draft' | 'Archived';
  targetAudience: 'Public' | 'All Users' | 'Santri' | 'Pengajar';
  authorName: string;
}

export type MaterialType =
  | 'PDF'
  | 'Document'
  | 'Audio'
  | 'Video'
  | 'External URL'
  | 'Text Lesson';

export interface LearningMaterial {
  id: string;
  classId: string;
  orderIndex: number;
  title: string;
  description: string;
  type: MaterialType;
  fileUrl: string;
  fileName?: string;
  fileSizeKb?: number;
  externalUrl?: string;
  textContent?: string;
  accessScope: 'Enrolled Only' | 'All Santri' | 'Public';
  distributionRight: DistributionRight;
  uploadedBy: string;
  uploadedAt: string;
  completedByStudentIds: string[];
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface AttendanceSession {
  id: string;
  classId: string;
  date: string;
  topic: string;
  createdBy: string;
  records: Record<string, AttendanceStatus>; // studentUserId -> AttendanceStatus
}

export type SubmissionStatus =
  | 'Not Submitted'
  | 'Submitted'
  | 'Late'
  | 'Reviewed'
  | 'Returned for Revision';

export interface Assignment {
  id: string;
  classId: string;
  title: string;
  instructions: string;
  attachmentUrl?: string;
  dueDate: string;
  maxScore: number;
  createdBy: string;
  createdAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  answerText: string;
  attachmentUrl?: string;
  submittedAt: string;
  status: SubmissionStatus;
  score?: number;
  teacherFeedback?: string;
  reviewedBy?: string;
}

export interface ExamQuestion {
  id: string;
  type: 'objective' | 'essay';
  questionText: string;
  options?: string[];
  correctOptionIndex?: number;
  points: number;
}

export interface Examination {
  id: string;
  classId: string;
  title: string;
  description: string;
  durationMinutes: number;
  scheduledAt: string;
  maxAttempts: number;
  maxScore: number;
  questions: ExamQuestion[];
  status: 'Published' | 'Draft' | 'Closed';
}

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  answers: Record<string, string | number>;
  objectiveScore: number;
  essayScore: number;
  totalScore: number;
  gradingStatus: 'Auto-Graded' | 'Pending Essay Review' | 'Finalized';
  submittedAt: string;
}

export interface GradeRecord {
  id: string;
  studentId: string;
  classId: string;
  componentType: 'Assignment' | 'Examination' | 'Final';
  referenceId: string;
  title: string;
  score: number;
  maxScore: number;
  gradedAt: string;
  gradedBy: string;
}

export type VerificationStatus =
  | 'Verified'
  | 'Partially Verified'
  | 'Unverified'
  | 'Archived';

export type DistributionRight =
  | 'Public Domain'
  | 'Licensed'
  | 'Permission Documented'
  | 'External Authorized Link'
  | 'Restricted Access'
  | 'Metadata Only';

export interface LibraryCategory {
  id: string;
  orderIndex: number;
  code: string;
  name: string;
  arabicName: string;
  description: string;
}

export interface LibrarySubcategory {
  id: string;
  categoryId: string;
  orderIndex: number;
  name: string;
  arabicName?: string;
  description: string;
}

export interface BookMediaItem {
  id: string;
  type: 'PDF' | 'Audio' | 'Video' | 'External Link' | 'Syarah Note';
  title: string;
  url: string;
  distributionRight: DistributionRight;
  fileSizeKb?: number;
}

export interface LibraryBook {
  id: string;
  code: string;
  arabicTitle: string;
  transliterationTitle: string;
  translatedTitle: string;
  description: string;
  coverAccent: string;
  // Author info
  authorName: string;
  authorArabicName?: string;
  authorDeathYearHijri?: string;
  authorBiography: string;
  authorBioSource: string;
  // Classification
  categoryId: string;
  subcategoryId: string;
  fieldOfStudy: string;
  difficultyLevel: 'Pemula' | 'Menengah' | 'Lanjutan';
  prerequisites: string[];
  learningOrder: number;
  previousBookId?: string;
  nextBookId?: string;
  // Edition info
  language: 'Arab' | 'Indonesia' | 'Arab & Indonesia';
  publisher: string;
  publicationYear?: string;
  editionNumber?: string;
  pageCount?: number;
  tableOfContents: string[];
  // Credibility & Verification
  bibliographySource: string;
  externalReferenceUrl?: string;
  verificationNotes: string;
  metadataCompleteness: 'Complete' | 'Partial' | 'Draft';
  verificationStatus: VerificationStatus;
  distributionRight: DistributionRight;
  verifiedAt?: string;
  verifiedBy?: string;
  // Media & Access
  pdfUrl?: string;
  externalUrl?: string;
  mediaItems: BookMediaItem[];
  isPublished: boolean;
  accessCount: number;
}

export interface FatwaRecord {
  id: string;
  code: string;
  title: string;
  category: 'Akidah' | 'Ibadah' | 'Muamalah' | 'Keluarga' | 'Adab & Akhlak' | 'Kontemporer';
  questionContext: string;
  answerContent: string;
  muftiName: string;
  sourceReference: string;
  publishedDate: string;
  kitabReferences: string[];
  verificationStatus: 'Verified' | 'Under Review' | 'Archived';
  reviewerName: string;
}

export type QuestionModerationStatus =
  | 'Pending Moderation'
  | 'Waiting for Answer'
  | 'Under Review'
  | 'Answered'
  | 'Published'
  | 'Rejected';

export interface ForumQuestion {
  id: string;
  studentId: string;
  studentName: string;
  category: 'Akidah' | 'Ibadah' | 'Muamalah' | 'Lughah' | 'Hadis & Tafsir' | 'Adab';
  title: string;
  questionText: string;
  status: QuestionModerationStatus;
  assignedTeacherId?: string;
  answerText?: string;
  answeredBy?: string;
  answeredAt?: string;
  rejectionReason?: string;
  reviewerName?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: RoleId;
  action: string;
  module: ModuleKey;
  targetDescription: string;
  timestamp: string;
}

export interface SystemNotification {
  id: string;
  userId: string; // 'ALL' or specific userId
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface GoogleSheetSyncConfig {
  appsScriptWebAppUrl: string;
  spreadsheetUrl: string;
  autoSyncEnabled: boolean;
  syncIntervalSeconds: number;
  lastSyncedAt: string;
  lastSyncStatus: 'Connected & Synced' | 'Local Real-Time Mode' | 'Sync Error';
  lastSyncMessage: string;
  syncRevision: number;
}

export interface SystemSettings {
  academyName: string;
  academyArabicName: string;
  tagline: string;
  timezone: string;
  academicYear: string;
  contactEmail: string;
  contactWhatsapp: string;
  address: string;
  allowPublicRegistration: boolean;
  requireBookVerificationBeforeDownload: boolean;
  googleSheetSync: GoogleSheetSyncConfig;
}

export interface AcademyDatabase {
  revision: number;
  updatedAt: string;
  roles: RoleDefinition[];
  users: UserAccount[];
  students: StudentProfile[];
  teachers: TeacherProfile[];
  programs: AcademicProgram[];
  classes: AcademicClass[];
  schedules: ClassSchedule[];
  admissions: AdmissionApplication[];
  announcements: Announcement[];
  materials: LearningMaterial[];
  attendanceSessions: AttendanceSession[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  examinations: Examination[];
  examAttempts: ExamAttempt[];
  grades: GradeRecord[];
  libraryCategories: LibraryCategory[];
  librarySubcategories: LibrarySubcategory[];
  books: LibraryBook[];
  fatwas: FatwaRecord[];
  questions: ForumQuestion[];
  activityLogs: ActivityLog[];
  notifications: SystemNotification[];
  settings: SystemSettings;
}
