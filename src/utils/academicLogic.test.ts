import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateStudentProgress,
  canAccessBookFile,
  canAccessZoomLink,
  generateGoogleAppsScriptCode,
  gradeExamAttempt,
  hasPermission,
  normalizeSearchText,
  searchAndFilterBooks,
} from './academicLogic';
import {
  AcademicClass,
  LibraryBook,
  RoleDefinition,
  UserAccount,
} from '../types/database';

const mockRoles: RoleDefinition[] = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Full access',
    permissions: {
      dashboard: ['view'],
      users: ['view', 'create', 'edit', 'delete'],
      academic: ['view', 'create', 'edit', 'delete', 'publish'],
      lms: ['view', 'create', 'edit', 'delete', 'publish'],
      library: ['view', 'create', 'edit', 'delete', 'publish'],
      knowledge: ['view', 'create', 'edit', 'delete', 'publish'],
      reports: ['view'],
      settings: ['view', 'edit'],
    },
  },
  {
    id: 'admin_perpustakaan',
    name: 'Admin Perpustakaan',
    description: 'Library only',
    permissions: {
      dashboard: ['view'],
      users: [],
      academic: [],
      lms: [],
      library: ['view', 'create', 'edit', 'publish'],
      knowledge: [],
      reports: ['view'],
      settings: [],
    },
  },
];

const libraryAdminUser: UserAccount = {
  id: 'u-lib',
  username: 'admin_lib',
  email: 'lib@academy.id',
  passwordHash: 'hashed',
  fullName: 'Ustadz Hafizh',
  role: 'admin_perpustakaan',
  whatsapp: '08123456789',
  gender: 'Laki-laki',
  city: 'Jakarta',
  status: 'Active',
  joinedAt: '2026-01-01',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

const studentUser: UserAccount = {
  ...libraryAdminUser,
  id: 'u-santri-1',
  role: 'santri',
};

test('RBAC hasPermission enforces module boundaries accurately', () => {
  assert.equal(
    hasPermission(libraryAdminUser, mockRoles, 'library', 'create'),
    true
  );
  // PRD 15.5: Admin perpustakaan tidak otomatis memiliki akses penuh ke data akademik
  assert.equal(
    hasPermission(libraryAdminUser, mockRoles, 'academic', 'edit'),
    false
  );
  assert.equal(
    hasPermission(libraryAdminUser, mockRoles, 'users', 'view'),
    false
  );
});

test('canAccessZoomLink restricts Zoom URLs strictly to enrolled students and assigned teachers', () => {
  const sampleClass: AcademicClass = {
    id: 'cls-1',
    code: 'NHW-A',
    name: 'Nahwu Dasar A',
    programId: 'prg-1',
    teacherId: 'tch-1',
    studentIds: ['std-1'],
    quota: 30,
    scheduleSummary: 'Senin & Rabu 19:30 WIB',
    startDate: '2026-01-10',
    endDate: '2026-06-10',
    status: 'Active',
    zoomLink: 'https://zoom.us/j/9988776655',
    zoomMeetingId: '998 877 6655',
    zoomPasscode: 'ADAB2026',
    zoomNotes: 'Hadir 10 menit sebelum sesi dimulai',
  };

  assert.equal(canAccessZoomLink(null, sampleClass), false);
  assert.equal(
    canAccessZoomLink(studentUser, sampleClass, 'std-1'),
    true
  );
  assert.equal(
    canAccessZoomLink(studentUser, sampleClass, 'std-other'),
    false
  );
  assert.equal(
    canAccessZoomLink(libraryAdminUser, sampleClass),
    false
  );
});

test('canAccessBookFile blocks Metadata Only and Unverified downloads for copyright responsibility', () => {
  assert.equal(
    canAccessBookFile(
      { distributionRight: 'Metadata Only', verificationStatus: 'Verified' },
      studentUser,
      true
    ).allowed,
    false
  );
  assert.equal(
    canAccessBookFile(
      { distributionRight: 'Public Domain', verificationStatus: 'Unverified' },
      studentUser,
      true
    ).allowed,
    false
  );
  assert.equal(
    canAccessBookFile(
      { distributionRight: 'Public Domain', verificationStatus: 'Verified' },
      null,
      true
    ).allowed,
    true
  );
  assert.equal(
    canAccessBookFile(
      { distributionRight: 'Restricted Access', verificationStatus: 'Verified' },
      null,
      true
    ).allowed,
    false
  );
  assert.equal(
    canAccessBookFile(
      { distributionRight: 'Restricted Access', verificationStatus: 'Verified' },
      studentUser,
      true
    ).allowed,
    true
  );
});

test('Smart Library Search matches Arabic with harakat and Latin transliteration variations', () => {
  const sampleBooks: LibraryBook[] = [
    {
      id: 'bk-1',
      code: 'LGH-01',
      arabicTitle: 'المُقَدِّمَةُ الآجُرُّومِيَّةُ',
      transliterationTitle: "Al-Muqaddimah Al-Ajurrumiyyah",
      translatedTitle: 'Pengantar Ilmu Nahwu Dasar',
      description: 'Matan dasar kaidah ilmu nahwu bagi penuntut ilmu pemula.',
      coverAccent: '#087451',
      authorName: 'Ibnu Ajurrum Ash-Shinhaji',
      authorDeathYearHijri: '723 H',
      authorBiography: 'Ulama pakar nahwu dari Fes, Maroko.',
      authorBioSource: 'Bughyatul Wu’at karya Imam As-Suyuthi',
      categoryId: 'cat-lughah',
      subcategoryId: 'sub-nahwu',
      fieldOfStudy: 'Ilmu Nahwu',
      difficultyLevel: 'Pemula',
      prerequisites: [],
      learningOrder: 1,
      language: 'Arab',
      publisher: 'Darul Minhaj',
      tableOfContents: ['Bab Kalam', 'Bab I’rab'],
      bibliographySource: 'Katalog Perpustakaan Darul Minhaj Cetakan ke-4',
      verificationNotes: 'Teks matan telah dicocokkan dengan manuskrip tahqiq.',
      metadataCompleteness: 'Complete',
      verificationStatus: 'Verified',
      distributionRight: 'Public Domain',
      mediaItems: [],
      isPublished: true,
      accessCount: 120,
    },
  ];

  // Search Arabic without harakat
  const resArabic = searchAndFilterBooks(sampleBooks, {
    query: 'الاجروميه',
  });
  assert.equal(resArabic.length, 1);

  // Search Latin transliteration without hyphen
  const resLatin = searchAndFilterBooks(sampleBooks, {
    query: 'muqaddimah ajurrumiyyah',
  });
  assert.equal(resLatin.length, 1);
});

test('calculateStudentProgress computes accurate deterministic percentages from real records', () => {
  const progress = calculateStudentProgress({
    studentId: 'std-1',
    enrolledClassIds: ['cls-1'],
    materials: [
      {
        id: 'm1',
        classId: 'cls-1',
        orderIndex: 1,
        title: 'Bab Kalam',
        description: '',
        type: 'PDF',
        fileUrl: '/docs/kalam.pdf',
        accessScope: 'Enrolled Only',
        distributionRight: 'Public Domain',
        uploadedBy: 'tch-1',
        uploadedAt: '2026-02-01',
        completedByStudentIds: ['std-1'],
      },
      {
        id: 'm2',
        classId: 'cls-1',
        orderIndex: 2,
        title: 'Bab Irab',
        description: '',
        type: 'PDF',
        fileUrl: '/docs/irab.pdf',
        accessScope: 'Enrolled Only',
        distributionRight: 'Public Domain',
        uploadedBy: 'tch-1',
        uploadedAt: '2026-02-02',
        completedByStudentIds: [],
      },
    ],
    assignments: [
      {
        id: 'a1',
        classId: 'cls-1',
        title: 'I’rab Surah Al-Fatihah',
        instructions: '',
        dueDate: '2026-03-01',
        maxScore: 100,
        createdBy: 'tch-1',
        createdAt: '2026-02-10',
      },
    ],
    submissions: [
      {
        id: 'sub1',
        assignmentId: 'a1',
        studentId: 'std-1',
        answerText: 'Bismillahi jar majrur...',
        submittedAt: '2026-02-20',
        status: 'Reviewed',
        score: 90,
      },
    ],
    attendanceSessions: [
      {
        id: 'att1',
        classId: 'cls-1',
        date: '2026-02-01',
        topic: 'Pertemuan 1',
        createdBy: 'tch-1',
        records: { 'std-1': 'Present' },
      },
    ],
    grades: [
      {
        id: 'g1',
        studentId: 'std-1',
        classId: 'cls-1',
        componentType: 'Assignment',
        referenceId: 'a1',
        title: 'I’rab Surah Al-Fatihah',
        score: 90,
        maxScore: 100,
        gradedAt: '2026-02-21',
        gradedBy: 'tch-1',
      },
    ],
  });

  assert.equal(progress.materialCompletionPercent, 50);
  assert.equal(progress.attendanceRatePercent, 100);
  assert.equal(progress.averageScore, 90);
  assert.equal(progress.overallProgressPercent, 83);
});

test('gradeExamAttempt scores objective questions and detects essay questions', () => {
  const result = gradeExamAttempt(
    {
      questions: [
        {
          id: 'q1',
          type: 'objective',
          questionText: 'Berapa pembagian kalam dalam ilmu nahwu?',
          options: ['2', '3 (Isim, Fi’il, Huruf)', '4', '5'],
          correctOptionIndex: 1,
          points: 40,
        },
        {
          id: 'q2',
          type: 'essay',
          questionText: 'Jelaskan tanda-tanda isim!',
          points: 60,
        },
      ],
    },
    { q1: 1, q2: 'Khafadh, tanwin, masuknya alif lam, dan huruf khafadh.' }
  );

  assert.equal(result.objectiveScore, 40);
  assert.equal(result.hasEssay, true);
  assert.equal(result.gradingStatus, 'Pending Essay Review');
});

test('generateGoogleAppsScriptCode outputs valid doGet and doPost handlers', () => {
  const script = generateGoogleAppsScriptCode('Islamic Academy Portal');
  assert.equal(script.includes('function doGet(e)'), true);
  assert.equal(script.includes('function doPost(e)'), true);
  assert.equal(script.includes('SpreadsheetApp.getActiveSpreadsheet()'), true);
});
