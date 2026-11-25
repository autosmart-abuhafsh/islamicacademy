export type AppLanguage = 'id' | 'en' | 'ar';

export const DEFAULT_LANGUAGE: AppLanguage = 'id';

export const LANGUAGE_OPTIONS: {
  id: AppLanguage;
  shortLabel: string;
  label: string;
  nativeName: string;
}[] = [
  {
    id: 'id',
    shortLabel: 'ID',
    label: 'Bahasa Indonesia (Default)',
    nativeName: 'Indonesia',
  },
  {
    id: 'en',
    shortLabel: 'EN',
    label: 'Bahasa Inggris (English)',
    nativeName: 'English',
  },
  {
    id: 'ar',
    shortLabel: 'AR',
    label: 'Bahasa Arab Fushah (العربية الفصحى)',
    nativeName: 'العربية الفصحى',
  },
];

// Exact match dictionary for full UI strings (Key = Exact Indonesian string)
export const EXACT_TRANSLATIONS: Record<
  string,
  { en: string; ar: string }
> = {
  // Brand & Topbar Navigation
  'Islamic Academy Portal': {
    en: 'Islamic Academy Portal',
    ar: 'بوابة الأكاديمية الإسلامية',
  },
  Beranda: {
    en: 'Home',
    ar: 'الرئيسية',
  },
  'Program & Jadwal': {
    en: 'Programs & Schedule',
    ar: 'البرامج والجدول الدراسي',
  },
  'Perpustakaan 9 Silsilah': {
    en: '9 Silsilah Digital Library',
    ar: 'مكتبة السلاسل العلمية التسع',
  },
  'Fatwa & Tanya Jawab': {
    en: 'Fatwa & Q&A Center',
    ar: 'مركز الفتاوى والأسئلة العلمية',
  },
  'Pendaftaran Santri': {
    en: 'Student Admission',
    ar: 'تسجيل الطلاب الجدد',
  },
  'Beranda & Profil Akademi': {
    en: 'Home & Academy Profile',
    ar: 'الرئيسية وتعريف الأكاديمية',
  },
  'Katalog Program & Jadwal': {
    en: 'Program Catalog & Schedule',
    ar: 'دليل البرامج والجدول الدراسي',
  },
  'Perpustakaan Digital 9 Silsilah': {
    en: '9 Silsilah Digital Library',
    ar: 'المكتبة الرقمية للسلاسل العلمية التسع',
  },
  'Pusat Fatwa & Tanya Jawab': {
    en: 'Fatwa & Q&A Center',
    ar: 'مركز الفتاوى والأسئلة والأجوبة',
  },
  'Formulir Pendaftaran Santri': {
    en: 'Student Admission Form',
    ar: 'استمارة تسجيل الطلاب الجدد',
  },
  'Mode Terang': {
    en: 'Light Mode',
    ar: 'الوضع النهاري',
  },
  'Mode Gelap': {
    en: 'Dark Mode',
    ar: 'الوضع الليلي',
  },
  'Masuk Portal': {
    en: 'Sign In',
    ar: 'دخول البوابة',
  },

  // Hero & Public Beranda
  'Pendidikan Akademik Islam Terpadu, Pembelajaran Talaqqi & Pusat Dokumentasi Kitab Turats':
    {
      en: 'Integrated Islamic Academic Education, Talaqqi Learning & Classical Turats Documentation Center',
      ar: 'التعليم الأكاديمي الإسلامي المتكامل، والتلقي العلمي، ومركز توثيق كتب التراث',
    },
  'Platform manajemen akademi pendidikan Islam terintegrasi yang menyatukan administrasi santri & asatidzah, LMS interaktif, Perpustakaan Digital 9 Silsilah Keilmuan dengan verifikasi hak distribusi, serta Pusat Fatwa & Tanya Jawab.':
    {
      en: 'An integrated Islamic academy management platform uniting student & faculty administration, interactive LMS, a 9-Silsilah Digital Library with distribution rights verification, and a Verified Fatwa & Q&A Center.',
      ar: 'منصة متكاملة لإدارة الأكاديمية الإسلامية تجمع بين شؤون الطلاب والأساتذة، ونظام التعلم التفاعلي، والمكتبة الرقمية للسلاسل العلمية التسع مع توثيق حقوق النشر، ومركز الفتاوى والأسئلة العلمية.',
    },
  'Daftar Santri Baru': {
    en: 'Apply as New Student',
    ar: 'التسجيل كطالب جديد',
  },
  'Jelajahi 9 Silsilah Kitab': {
    en: 'Explore 9 Silsilah Library',
    ar: 'استكشاف السلاسل العلمية التسع',
  },
  'Profil & Statistik Akademik': {
    en: 'Academic Profile & Live Statistics',
    ar: 'الملف الأكاديمي والإحصاءات الحية',
  },
  'Santri Aktif': {
    en: 'Active Students',
    ar: 'الطلاب النشطون',
  },
  'Asatidzah Pengajar': {
    en: 'Faculty & Scholars',
    ar: 'الأساتذة والمحاضرون',
  },
  'Halaqah Kelas Aktif': {
    en: 'Active Study Circles',
    ar: 'الحلقات الدراسية النشطة',
  },
  '01. Profil Akademi & Manhaj Pembelajaran': {
    en: '01. Academy Profile & Learning Methodology',
    ar: '٠١. تعريف الأكاديمية ومنهج التلقي العلمي',
  },
  'Memadukan Tradisi Keilmuan Turats Bersanad dengan Teknologi Akademik Modern':
    {
      en: 'Combining Authentic Classical Turats Scholarship with Modern Academic Technology',
      ar: 'الجمع بين أصالة التراث العلمي المسند والتقنية الأكاديمية الحديثة',
    },
  'Kurikulum Berjenjang': {
    en: 'Staged Curriculum',
    ar: 'منهج دراسي متدرج',
  },
  'Mulai dari tingkat Mubtadi’ (Pemula), Mutawassith (Menengah), hingga Mutaqaddim (Lanjutan).':
    {
      en: 'Progressing systematically from Mubtadi’ (Beginner) and Mutawassith (Intermediate) to Mutaqaddim (Advanced).',
      ar: 'يتدرج الطالب علمياً من مرحلة المبتدئين، ثم المتوسطين، وصولاً إلى مرحلة المتقدمين.',
    },
  'Kredibilitas Bibliografi': {
    en: 'Bibliographic Credibility',
    ar: 'موثوقية المصادر والفهرسة',
  },
  'Setiap kitab dilengkapi sumber biografi ulama, status verifikasi, dan kejelasan izin distribusi.':
    {
      en: 'Every classical text includes scholar biographies, verification status, and clear distribution permissions.',
      ar: 'كل كتاب مزود بترجمة المؤلف ومصادرها، وحالة التوثيق العلمي، وبيان حقوق النشر والتوزيع.',
    },
  'Akses Multi-Perangkat': {
    en: 'Cross-Device Access',
    ar: 'الوصول عبر جميع الأجهزة',
  },
  'Tampilan responsif dan sinkronisasi data real-time untuk kenyamanan belajar dari HP maupun PC.':
    {
      en: 'Responsive layout and real-time data synchronization for seamless study across mobile phones and desktop PCs.',
      ar: 'واجهة متجاوبة ومزامنة فورية للبيانات لضمان سهولة التعلم عبر الهاتف المحمول والحاسوب.',
    },
  '02. Papan Pengumuman Akademik': {
    en: '02. Academic Announcements Board',
    ar: '٠٢. لوحة الإعلانات الأكاديمية الرسمية',
  },
  'Katalog Program & Jadwal Halaqah': {
    en: 'Program Catalog & Halaqah Schedule',
    ar: 'دليل البرامج العلمية وجدول الحلقات',
  },
  'Program Studi & Halaqah Keilmuan': {
    en: 'Academic Programs & Study Circles',
    ar: 'البرامج الدراسية والحلقات العلمية',
  },
  'Pilih program pembelajaran sesuai tahapan keilmuan Anda.': {
    en: 'Choose a study program tailored to your current stage of Islamic scholarship.',
    ar: 'اختر البرنامج الدراسي المناسب لمرحلتك العلمية.',
  },
  'Lihat Semua Program & Jadwal': {
    en: 'View All Programs & Schedules',
    ar: 'عرض جميع البرامج والجداول',
  },
  'Daftar Program Ini': {
    en: 'Apply for This Program',
    ar: 'التسجيل في هذا البرنامج',
  },

  // Programs & Schedules Public Page
  'Program Pembelajaran, Kuota Kelas & Jadwal Pertemuan': {
    en: 'Study Programs, Class Quotas & Session Schedules',
    ar: 'البرامج التعليمية، الطاقة الاستيعابية للحلقات، وجدول المحاضرات',
  },
  'Informasi lengkap program, pengajar pengampu, sisa kuota santri, dan jadwal pertemuan mingguan.':
    {
      en: 'Complete details on programs, assigned scholars, remaining student quotas, and weekly class schedules.',
      ar: 'معلومات شاملة عن البرامج، والأساتذة المشرفين، والمقاعد المتاحة، ومواعيد الدروس الأسبوعية.',
    },
  'Hari & Tanggal': {
    en: 'Day & Date',
    ar: 'اليوم والتاريخ',
  },
  'Waktu (WIB)': {
    en: 'Time (WIB)',
    ar: 'الوقت',
  },
  Kelas: {
    en: 'Class',
    ar: 'الحلقة الدراسية',
  },
  'Topik Kajian': {
    en: 'Study Topic',
    ar: 'موضوع الدرس',
  },
  Status: {
    en: 'Status',
    ar: 'الحالة',
  },

  // Fatwa & Q&A Page
  'Pusat Dokumentasi Fatwa & Bahtsul Masail Ilmiah': {
    en: 'Fatwa Documentation & Scholarly Research Center',
    ar: 'مركز توثيق الفتاوى والبحوث العلمية الشرعية',
  },
  'Arsip Fatwa Resmi Terverifikasi & Tanya Jawab Terpublikasi': {
    en: 'Verified Official Fatwa Archive & Published Q&A',
    ar: 'أرشيف الفتاوى الرسمية المعتمدة والأسئلة العلمية المنشورة',
  },
  'Konteks Pertanyaan / Istifta’:': {
    en: 'Question Context / Istifta’:',
    ar: 'سياق السؤال / الاستفتاء:',
  },
  'Uraian Jawaban & Ketetapan:': {
    en: 'Scholarly Answer & Ruling:',
    ar: 'بيان الجواب والحكم الشرعي:',
  },
  'Rubrik Tanya Jawab Santri Terpublikasi': {
    en: 'Published Student Q&A Rubric',
    ar: 'قسم أسئلة الطلاب وأجوبة الأساتذة المنشورة',
  },

  // Student Admission Form
  'Penerimaan Santri Baru (Admission Management)': {
    en: 'New Student Admissions (Admission Management)',
    ar: 'قبول وتسجيل الطلاب الجدد',
  },
  'Formulir Pendaftaran Program Akademi': {
    en: 'Academy Program Application Form',
    ar: 'استمارة الالتحاق ببرامج الأكاديمية',
  },
  'Data pendaftaran yang Anda kirimkan langsung tercatat di sistem manajemen akademik terpusat untuk diverifikasi oleh Admin Akademik dan ditempatkan ke kelas halaqah.':
    {
      en: 'Your submitted application is recorded directly in the central academic system for verification and study circle placement.',
      ar: 'تُسجل بيانات طلبك مباشرة في نظام الإدارة الأكاديمية المركزي لمراجعتها من قبل الإدارة وتوزيعك على الحلقة المناسبة.',
    },
  'Pendaftaran Berhasil Direkam ke Database!': {
    en: 'Application Successfully Recorded in Database!',
    ar: 'تم تسجيل طلب الالتحاق في قاعدة البيانات بنجاح!',
  },
  'Nama Lengkap Sesuai Identitas *': {
    en: 'Full Name (As on Official ID) *',
    ar: 'الاسم الكامل كما في الهوية *',
  },
  'Alamat Email Aktif *': {
    en: 'Active Email Address *',
    ar: 'البريد الإلكتروني النشط *',
  },
  'Nomor WhatsApp *': {
    en: 'WhatsApp Number *',
    ar: 'رقم الواتساب *',
  },
  'Jenis Kelamin *': {
    en: 'Gender *',
    ar: 'الجنس *',
  },
  'Laki-laki (Banin)': {
    en: 'Male (Banin)',
    ar: 'ذكر (بنين)',
  },
  'Perempuan (Banat)': {
    en: 'Female (Banat)',
    ar: 'أنثى (بنات)',
  },
  'Kota / Domisili *': {
    en: 'City / Domicile *',
    ar: 'المدينة / محل الإقامة *',
  },
  'Pilih Program Studi yang Dituju *': {
    en: 'Select Target Study Program *',
    ar: 'اختر البرنامج الدراسي المطلوب *',
  },
  'Riwayat Belajar Kitab / Kemampuan Bahasa Arab Sebelumnya': {
    en: 'Previous Classical Text Study / Arabic Proficiency Background',
    ar: 'الخلفية العلمية في دراسة المتون أو مستوى اللغة العربية',
  },
  'Kirim Formulir Pendaftaran Santri': {
    en: 'Submit Student Admission Application',
    ar: 'إرسال استمارة تسجيل الطالب',
  },

  // Login & Reset Password Modal
  'Sistem Autentikasi & Role-Based Access Control': {
    en: 'Authentication System & Role-Based Access Control',
    ar: 'نظام المصادقة والتحكم في صلاحيات الوصول',
  },
  'Masuk ke Islamic Academy Portal': {
    en: 'Sign In to Islamic Academy Portal',
    ar: 'تسجيل الدخول إلى بوابة الأكاديمية الإسلامية',
  },
  'Reset Kata Sandi Akun': {
    en: 'Reset Account Password',
    ar: 'إعادة تعيين كلمة المرور',
  },
  'Username atau Email Terdaftar': {
    en: 'Registered Username (Login ID) or Email',
    ar: 'معرف الدخول (اسم المستخدم) أو البريد الإلكتروني المسجل',
  },
  'Kata Sandi': {
    en: 'Password',
    ar: 'كلمة المرور',
  },
  'Lupa / Reset Password?': {
    en: 'Forgot / Reset Password?',
    ar: 'هل نسيت كلمة المرور؟',
  },
  'Masuk Sekarang': {
    en: 'Sign In Now',
    ar: 'تسجيل الدخول الآن',
  },
  'Memverifikasi...': {
    en: 'Verifying...',
    ar: 'جارٍ التحقق...',
  },
  'Email Akun Terdaftar *': {
    en: 'Registered Account Email *',
    ar: 'البريد الإلكتروني المسجل للحساب *',
  },
  'Nomor WhatsApp Terdaftar (Verifikasi Keamanan) *': {
    en: 'Registered WhatsApp Number (Security Verification) *',
    ar: 'رقم الواتساب المسجل (للتحقق الأمني) *',
  },
  'Password Baru (Min. 6 Karakter) *': {
    en: 'New Password (Min. 6 Characters) *',
    ar: 'كلمة المرور الجديدة (٦ أحرف على الأقل) *',
  },
  'Simpan Password Baru': {
    en: 'Save New Password',
    ar: 'حفظ كلمة المرور الجديدة',
  },

  // Workspace Sidebar Menu & Groups
  'PUSAT KENDALI': {
    en: 'CONTROL CENTER',
    ar: 'مركز التحكم الرئيسي',
  },
  'Dashboard Utama': {
    en: 'Main Dashboard',
    ar: 'لوحة التحكم الرئيسية',
  },
  'MANAJEMEN PENGGUNA': {
    en: 'USER MANAGEMENT',
    ar: 'إدارة المستخدمين',
  },
  'Santri & Pengajar': {
    en: 'Students & Faculty',
    ar: 'الطلاب والأساتذة',
  },
  'Manajemen Akun & Password': {
    en: 'Account & Password Management',
    ar: 'إدارة الحسابات وكلمات المرور',
  },
  'Role & Permission': {
    en: 'Roles & Permissions',
    ar: 'الأدوار والصلاحيات',
  },
  AKADEMIK: {
    en: 'ACADEMICS',
    ar: 'الشؤون الأكاديمية',
  },
  'Program & Kelas': {
    en: 'Programs & Classes',
    ar: 'البرامج والحلقات',
  },
  'Pendaftaran & Jadwal': {
    en: 'Admissions & Schedule',
    ar: 'القبول والجدول الدراسي',
  },
  'LMS INTERAKTIF': {
    en: 'INTERACTIVE LMS',
    ar: 'نظام التعلم التفاعلي',
  },
  'Materi & Zoom': {
    en: 'Materials & Zoom',
    ar: 'المواد العلمية واللقاءات المباشرة',
  },
  'Absensi, Tugas & Ujian': {
    en: 'Attendance, Assignments & Exams',
    ar: 'الحضور والواجبات والاختبارات',
  },
  'PERPUSTAKAAN DIGITAL': {
    en: 'DIGITAL LIBRARY',
    ar: 'المكتبة الرقمية',
  },
  'Katalog & Smart Search': {
    en: 'Catalog & Smart Search',
    ar: 'الفهرس والبحث الذكي',
  },
  '9 Silsilah & Pathway': {
    en: '9 Silsilah & Study Pathway',
    ar: 'السلاسل العلمية التسع ومسار الطلب',
  },
  'KNOWLEDGE CENTER': {
    en: 'KNOWLEDGE CENTER',
    ar: 'مركز المعرفة والفتوى',
  },
  'Fatwa & Moderasi Forum': {
    en: 'Fatwa & Forum Moderation',
    ar: 'الفتاوى وإشراف المنتدى العلمي',
  },
  'LAPORAN & SISTEM': {
    en: 'REPORTS & SYSTEM',
    ar: 'التقارير وإعدادات النظام',
  },
  'Laporan & Analitik': {
    en: 'Reports & Analytics',
    ar: 'التقارير والإحصاءات التحليلية',
  },
  'Pengaturan Sistem': {
    en: 'System Settings',
    ar: 'إعدادات النظام وقاعدة البيانات',
  },
  'Profil Saya': {
    en: 'My Profile',
    ar: 'ملفي الشخصي',
  },
  'Profil Pengajar': {
    en: 'Teacher Profile',
    ar: 'ملف الأستاذ',
  },
  'PORTAL SANTRI': {
    en: 'STUDENT PORTAL',
    ar: 'بوابة الطالب',
  },
  'PORTAL PENGAJAR': {
    en: 'FACULTY PORTAL',
    ar: 'بوابة الأستاذ',
  },
  'PUSTAKA & FATWA': {
    en: 'LIBRARY & FATWA',
    ar: 'المكتبة والفتاوى',
  },
  'Dashboard Santri': {
    en: 'Student Dashboard',
    ar: 'لوحة تحكم الطالب',
  },
  'Dashboard Pengajar': {
    en: 'Faculty Dashboard',
    ar: 'لوحة تحكم الأستاذ',
  },
  'Kelas & Materi Ajar': {
    en: 'Classes & Learning Materials',
    ar: 'الحلقات والمواد التعليمية',
  },
  'Zoom Meeting Kelas': {
    en: 'Class Zoom Meetings',
    ar: 'لقاءات الزوم المباشرة',
  },
  'Absensi & Kehadiran': {
    en: 'Attendance Records',
    ar: 'سجل الحضور والغياب',
  },
  'Absensi Santri': {
    en: 'Student Attendance',
    ar: 'حضور الطلاب',
  },
  'Tugas Akademik': {
    en: 'Academic Assignments',
    ar: 'الواجبات الأكاديمية',
  },
  'Tugas & Pemeriksaan': {
    en: 'Assignments & Grading',
    ar: 'الواجبات والتصحيح',
  },
  'Ujian & Evaluasi': {
    en: 'Exams & Evaluations',
    ar: 'الاختبارات والتقييم',
  },
  'Ujian & Penilaian': {
    en: 'Exams & Assessment',
    ar: 'الاختبارات ورصد الدرجات',
  },
  'Nilai & Rapor Akademik': {
    en: 'Grades & Academic Transcript',
    ar: 'الدرجات وكشف المستوى الأكاديمي',
  },
  'Progres Santri': {
    en: 'Student Progress',
    ar: 'تقدم الطلاب العلمي',
  },
  '9 Silsilah Keilmuan': {
    en: '9 Scientific Silsilah',
    ar: 'السلاسل العلمية التسع',
  },
  'Forum Tanya Jawab': {
    en: 'Scholarly Q&A Forum',
    ar: 'منتدى الأسئلة والأجوبة العلمية',
  },
  'Ke Beranda Publik': {
    en: 'Public Home Page',
    ar: 'العودة إلى الصفحة العامة',
  },
  'Keluar (Logout)': {
    en: 'Sign Out (Logout)',
    ar: 'تسجيل الخروج',
  },

  // Workspace Dashboard
  'Admin Dashboard & Monitoring Terintegrasi': {
    en: 'Integrated Admin Dashboard & Academic Monitoring',
    ar: 'لوحة التحكم الإدارية والمتابعة الأكاديمية المتكاملة',
  },
  'Seluruh metrik dihitung langsung dari database aktif dan tersinkronisasi secara real-time untuk HP & PC.':
    {
      en: 'All metrics are computed directly from the active database and synchronized in real time across Mobile & Desktop.',
      ar: 'تُحسب جميع المؤشرات مباشرة من قاعدة البيانات النشطة وتتم مزامنتها فورياً عبر الهاتف والحاسوب.',
    },
  'Pengaturan Sistem & Database': {
    en: 'System & Database Settings',
    ar: 'إعدادات النظام وقاعدة البيانات',
  },
  'Total Santri': {
    en: 'Total Students',
    ar: 'إجمالي الطلاب',
  },
  'Total Pengajar': {
    en: 'Total Faculty',
    ar: 'إجمالي الأساتذة',
  },
  Asatidzah: {
    en: 'Scholars / Faculty',
    ar: 'الأساتذة المحاضرون',
  },
  'Total Administrator': {
    en: 'Total Administrators',
    ar: 'إجمالي الإداريين',
  },
  'Program & Kelas Aktif': {
    en: 'Active Programs & Classes',
    ar: 'البرامج والحلقات النشطة',
  },
  'Program / Kelas': {
    en: 'Programs / Classes',
    ar: 'برنامج / حلقة',
  },
  'Total Pendaftaran': {
    en: 'Total Admissions',
    ar: 'إجمالي طلبات القبول',
  },
  'Total Materi LMS': {
    en: 'Total LMS Materials',
    ar: 'إجمالي المواد التعليمية',
  },
  'Modul & Dokumen': {
    en: 'Modules & Documents',
    ar: 'وحدات ومستندات علمية',
  },
  'Koleksi Kitab Turats': {
    en: 'Classical Turats Collection',
    ar: 'مجموعة كتب التراث',
  },
  'Publikasi Fatwa': {
    en: 'Published Fatwas',
    ar: 'الفتاوى المنشورة',
  },
  Terverifikasi: {
    en: 'Verified',
    ar: 'معتمدة وموثقة',
  },
  'Forum Pertanyaan': {
    en: 'Q&A Forum Questions',
    ar: 'أسئلة المنتدى العلمي',
  },
  'Papan Pengumuman': {
    en: 'Announcements Board',
    ar: 'لوحة الإعلانات',
  },
  'Visualisasi Monitoring Program & Kuota Kelas': {
    en: 'Program & Class Quota Monitoring Visualization',
    ar: 'متابعة البرامج ونسبة إشغال الحلقات الدراسية',
  },
  'Keterisian kuota santri pada masing-masing halaqah aktif.': {
    en: 'Student enrollment capacity across each active study circle.',
    ar: 'نسبة التحاق الطلاب بالطاقة الاستيعابية لكل حلقة دراسية نشطة.',
  },
  'Distribusi Koleksi Kitab pada 9 Silsilah Keilmuan:': {
    en: 'Book Collection Distribution Across 9 Scientific Silsilah:',
    ar: 'توزيع الكتب والمصنفات على السلاسل العلمية التسع:',
  },
  'Aktivitas Akademik Terbaru': {
    en: 'Recent Academic Activity Log',
    ar: 'سجل النشاط الأكاديمي الأخير',
  },

  // Owner Security Gate (Passcode 2026)
  'Otorisasi Khusus Pemilik (Owner Security Gate)': {
    en: 'Owner Security Gate (Special Authorization)',
    ar: 'بوابة الأمان الخاصة بالمالك (تفويض خاص)',
  },
  'Pengaturan Sistem Terkunci': {
    en: 'System Settings Locked',
    ar: 'إعدادات النظام مقفلة',
  },
  'Manajemen Akun & Password Terkunci': {
    en: 'Account & Password Management Locked',
    ar: 'إدارة الحسابات وكلمات المرور مقفلة',
  },
  'Kode Password Pemilik *': {
    en: 'Owner Passcode *',
    ar: 'رمز مرور المالك السري *',
  },
  'Buka Pengaturan Sistem': {
    en: 'Unlock System Settings',
    ar: 'فتح إعدادات النظام',
  },
  'Buka Manajemen Akun & Password': {
    en: 'Unlock Account & Password Management',
    ar: 'فتح إدارة الحسابات وكلمات المرور',
  },
  'Kunci Kembali': {
    en: 'Lock Again',
    ar: 'إغلاق القفل مجدداً',
  },

  // User Management & Account Management
  'Role & Permission Matrix (RBAC)': {
    en: 'Role & Permission Matrix (RBAC)',
    ar: 'مصفوفة الأدوار والصلاحيات (RBAC)',
  },
  'Export CSV': {
    en: 'Export CSV',
    ar: 'تصدير ملف CSV',
  },
  'Tambah Santri': {
    en: 'Add Student',
    ar: 'إضافة طالب جديد',
  },
  'Tambah Pengajar': {
    en: 'Add Teacher',
    ar: 'إضافة أستاذ جديد',
  },
  'Tambah Akun Admin / Anggota': {
    en: 'Add Admin / Member Account',
    ar: 'إضافة حساب إداري أو عضو جديد',
  },
  'Semua Program Studi': {
    en: 'All Study Programs',
    ar: 'جميع البرامج الدراسية',
  },
  NIS: {
    en: 'Student ID (NIS)',
    ar: 'الرقم الأكاديمي للطالب',
  },
  'Nama Lengkap': {
    en: 'Full Name',
    ar: 'الاسم الكامل',
  },
  'Kontak & Kota': {
    en: 'Contact & City',
    ar: 'بيانات التواصل والمدينة',
  },
  'Status Akun': {
    en: 'Account Status',
    ar: 'حالة الحساب',
  },
  Aksi: {
    en: 'Actions',
    ar: 'الإجراءات',
  },
  'ID & Password': {
    en: 'ID & Password',
    ar: 'المعرف وكلمة المرور',
  },
  'Edit ID & Password': {
    en: 'Edit ID & Password',
    ar: 'تعديل المعرف وكلمة المرور',
  },
  'Edit Profil': {
    en: 'Edit Profile',
    ar: 'تعديل الملف',
  },
  Arsipkan: {
    en: 'Archive',
    ar: 'أرشفة',
  },
  Aktifkan: {
    en: 'Activate',
    ar: 'تفعيل',
  },
  'Manajemen Akun, ID Login (Username) & Password Seluruh Pengguna': {
    en: 'User Accounts, Login ID (Username) & Password Management',
    ar: 'إدارة حسابات المستخدمين ومعرفات الدخول وكلمات المرور',
  },
  'Kelola akun Administrator, Asatidzah Pengajar, dan Santri. Anda dapat mengedit ID Login (Username), Email, Password, Role, maupun Status Akun secara langsung.':
    {
      en: 'Manage Administrator, Faculty, and Student accounts. Directly edit Login IDs (Usernames), Emails, Passwords, Roles, and Account Statuses.',
      ar: 'إدارة حسابات الإداريين والأساتذة والطلاب، مع إمكانية تعديل معرف الدخول والبريد الإلكتروني وكلمة المرور والدور وحالة الحساب مباشرة.',
    },
  'Nama Lengkap & Kota': {
    en: 'Full Name & City',
    ar: 'الاسم الكامل والمدينة',
  },
  'ID Login (Username)': {
    en: 'Login ID (Username)',
    ar: 'معرف الدخول (اسم المستخدم)',
  },
  'Email & WhatsApp': {
    en: 'Email & WhatsApp',
    ar: 'البريد الإلكتروني والواتساب',
  },
  'Password Login': {
    en: 'Login Password',
    ar: 'كلمة مرور الدخول',
  },
  'Role RBAC': {
    en: 'RBAC Role',
    ar: 'الدور الوظيفي (RBAC)',
  },
  Batal: {
    en: 'Cancel',
    ar: 'إلغاء',
  },
  'Simpan Perubahan Akun': {
    en: 'Save Account Changes',
    ar: 'حفظ تعديلات الحساب',
  },
  'Buat Akun Baru': {
    en: 'Create New Account',
    ar: 'إنشاء الحساب الجديد',
  },
  'Simpan Perubahan ID & Profil': {
    en: 'Save ID & Profile Changes',
    ar: 'حفظ تعديلات المعرف والملف الشخصي',
  },

  // Digital Library & 9 Silsilah Module
  'Pusat Dokumentasi Keilmuan Islam · 9 Silsilah Utama': {
    en: 'Islamic Scholarly Documentation Center · 9 Core Silsilah',
    ar: 'مركز التوثيق العلمي الإسلامي · السلاسل العلمية التسع الكبرى',
  },
  'Perpustakaan Digital & Silsilah Kitab Turats': {
    en: 'Digital Library & Classical Turats Silsilah',
    ar: 'المكتبة الرقمية وسلاسل كتب التراث الإسلامي',
  },
  'Katalog ilmiah terstruktur dengan metadata bibliografi terverifikasi, silsilah urutan belajar (Learning Pathway), serta pengelolaan tanggung jawab hak distribusi dokumen.':
    {
      en: 'Structured scholarly catalog featuring verified bibliographic metadata, staged learning pathways, and responsible document distribution rights governance.',
      ar: 'فهرس علمي منظم يضم بيانات ببليوغرافية موثقة، ومسارات التدرج في طلب العلم، وإدارة حقوق النشر والتوزيع العلمي.',
    },
  '+ Subkategori Silsilah': {
    en: '+ Add Silsilah Subcategory',
    ar: '+ إضافة فرع علمي جديد',
  },
  'Tambah Kitab & Metadata': {
    en: 'Add Classical Book & Metadata',
    ar: 'إضافة كتاب وبيانات الفهرسة',
  },
  'Peta Urutan Belajar (Learning Pathway)': {
    en: 'Staged Study Roadmap (Learning Pathway)',
    ar: 'خارطة التدرج العلمي (مسار طلب العلم)',
  },
  'Verifikasi & Hak Distribusi': {
    en: 'Verification & Distribution Rights',
    ar: 'التوثيق العلمي وحقوق النشر',
  },

  // LMS Interactive Module
  'Materi & Modul': {
    en: 'Materials & Modules',
    ar: 'المواد والوحدات العلمية',
  },
  'Zoom Meeting': {
    en: 'Zoom Live Sessions',
    ar: 'لقاءات الزوم المباشرة',
  },
  Absensi: {
    en: 'Attendance',
    ar: 'الحضور والغياب',
  },
  Tugas: {
    en: 'Assignments',
    ar: 'الواجبات الدراسية',
  },
  Ujian: {
    en: 'Examinations',
    ar: 'الاختبارات العلمية',
  },
  'Nilai & Progres': {
    en: 'Grades & Progress',
    ar: 'الدرجات ومستوى التقدم',
  },

  // Knowledge, Reports & System Settings
  'Laporan Akademik': {
    en: 'Academic Reports',
    ar: 'التقارير الأكاديمية',
  },
  'Laporan Pengajar': {
    en: 'Faculty Reports',
    ar: 'تقارير الأساتذة',
  },
  'Laporan Perpustakaan': {
    en: 'Library Reports',
    ar: 'تقارير المكتبة الرقمية',
  },
  'Log Operasional': {
    en: 'Operational Audit Log',
    ar: 'سجل العمليات والمراجعة',
  },
  'Profil & Pengaturan Akun Saya (Edit ID Login & Password)': {
    en: 'My Profile & Account Settings (Edit Login ID & Password)',
    ar: 'ملفي الشخصي وإعدادات الحساب (تعديل معرف الدخول وكلمة المرور)',
  },
};

// Ordered phrase replacements for dynamic or composite strings
const PHRASE_REPLACEMENTS: {
  id: string;
  en: string;
  ar: string;
}[] = [
  {
    id: 'Tahun Akademik',
    en: 'Academic Year',
    ar: 'العام الدراسي',
  },
  {
    id: 'Pusat Kendali Akademi',
    en: 'Academy Control Center',
    ar: 'مركز التحكم الأكاديمي',
  },
  {
    id: 'Buka Dashboard',
    en: 'Open Dashboard',
    ar: 'فتح لوحة التحكم',
  },
  {
    id: 'Data Santri',
    en: 'Student Records',
    ar: 'بيانات الطلاب',
  },
  {
    id: 'Data Pengajar',
    en: 'Faculty Records',
    ar: 'بيانات الأساتذة',
  },
  {
    id: 'Manajemen Akun & ID/Password',
    en: 'Account & ID/Password Management',
    ar: 'إدارة الحسابات وكلمات المرور',
  },
  {
    id: 'Kelas & Kuota',
    en: 'Classes & Quotas',
    ar: 'الحلقات والطاقة الاستيعابية',
  },
  {
    id: 'Papan Informasi',
    en: 'Information Board',
    ar: 'لوحة الإعلانات',
  },
  {
    id: 'Program',
    en: 'Programs',
    ar: 'البرامج',
  },
  {
    id: 'Jadwal',
    en: 'Schedules',
    ar: 'الجدول الدراسي',
  },
  {
    id: 'Pendaftaran',
    en: 'Admissions',
    ar: 'طلبات القبول',
  },
  {
    id: 'Kitab Terdokumentasi',
    en: 'Documented Classical Texts',
    ar: 'كتاباً موثقاً',
  },
  {
    id: 'Silsilah Keilmuan',
    en: 'Scientific Silsilah',
    ar: 'سلاسل علمية',
  },
  {
    id: 'Silsilah',
    en: 'Silsilah',
    ar: 'سلسلة علمية',
  },
  {
    id: 'Pengumuman',
    en: 'Announcements',
    ar: 'إعلانات',
  },
  {
    id: 'Tingkat Pemula',
    en: 'Beginner Level (Mubtadi’)',
    ar: 'المستوى المبتدئ',
  },
  {
    id: 'Tingkat Menengah',
    en: 'Intermediate Level (Mutawassith)',
    ar: 'المستوى المتوسط',
  },
  {
    id: 'Tingkat Lanjutan',
    en: 'Advanced Level (Mutaqaddim)',
    ar: 'المستوى المتقدم',
  },
  {
    id: 'Durasi:',
    en: 'Duration:',
    ar: 'المدة الدراسية:',
  },
  {
    id: 'Zona Waktu:',
    en: 'Timezone:',
    ar: 'المنطقة الزمنية:',
  },
  {
    id: 'Kontak:',
    en: 'Contact:',
    ar: 'التواصل:',
  },
  {
    id: 'Terisi',
    en: 'Enrolled',
    ar: 'المسجلون',
  },
  {
    id: 'Santri',
    en: 'Students',
    ar: 'طالب',
  },
  {
    id: 'Pengajar:',
    en: 'Instructor:',
    ar: 'الأستاذ المحاضر:',
  },
  {
    id: 'Program Induk:',
    en: 'Parent Program:',
    ar: 'البرنامج الرئيسي:',
  },
  {
    id: 'Daftar Kelas',
    en: 'Enroll in Class',
    ar: 'التسجيل في الحلقة',
  },
  {
    id: 'Semua',
    en: 'All',
    ar: 'الكل',
  },
  {
    id: 'Pengajar',
    en: 'Faculty',
    ar: 'الأساتذة',
  },
  {
    id: 'Aktif',
    en: 'Active',
    ar: 'نشط',
  },
  {
    id: 'Dijawab',
    en: 'Answered',
    ar: 'تمت الإجابة',
  },
  {
    id: 'Bergabung',
    en: 'Joined',
    ar: 'تاريخ الالتحاق',
  },
  {
    id: 'Sejak',
    en: 'Since',
    ar: 'منذ',
  },
  {
    id: 'Oleh:',
    en: 'By:',
    ar: 'بواسطة:',
  },
  {
    id: 'Bidang Keahlian:',
    en: 'Areas of Expertise:',
    ar: 'التخصص العلمي:',
  },
  {
    id: 'Pemberi Fatwa:',
    en: 'Mufti / Scholar:',
    ar: 'المفتي:',
  },
  {
    id: 'Sumber:',
    en: 'Source:',
    ar: 'المصدر:',
  },
  {
    id: 'Rujukan Kitab:',
    en: 'Classical Text References:',
    ar: 'المراجع العلمية:',
  },
  {
    id: 'Jawaban Asatidzah',
    en: 'Scholar’s Answer',
    ar: 'إجابة الأستاذ',
  },
  {
    id: 'Penanya:',
    en: 'Questioner:',
    ar: 'السائل:',
  },
  {
    id: 'Bidang:',
    en: 'Field:',
    ar: 'المجال العلمي:',
  },
  {
    id: 'Kategori:',
    en: 'Category:',
    ar: 'التصنيف:',
  },
  {
    id: 'Tanggal:',
    en: 'Date:',
    ar: 'التاريخ:',
  },
  {
    id: 'Masukkan kode password pemilik...',
    en: 'Enter owner passcode...',
    ar: 'أدخل رمز مرور المالك...',
  },
  {
    id: 'Masukkan ID Login (username) atau email...',
    en: 'Enter Login ID (username) or email...',
    ar: 'أدخل معرف الدخول أو البريد الإلكتروني...',
  },
  {
    id: 'Masukkan kata sandi...',
    en: 'Enter password...',
    ar: 'أدخل كلمة المرور...',
  },
  {
    id: 'Cari nama santri, NIS, email, atau kota...',
    en: 'Search student name, ID, email, or city...',
    ar: 'ابحث باسم الطالب أو الرقم الأكاديمي أو البريد أو المدينة...',
  },
  {
    id: 'Cari berdasarkan nama, ID Login (username), email, atau role...',
    en: 'Search by name, Login ID (username), email, or role...',
    ar: 'ابحث بالاسم أو معرف الدخول أو البريد الإلكتروني أو الدور...',
  },
  {
    id: 'Menyiapkan Beranda Akademik, LMS & Perpustakaan 9 Silsilah Keilmuan...',
    en: 'Preparing Academic Portal, LMS & 9-Silsilah Digital Library...',
    ar: 'جارٍ تجهيز البوابة الأكاديمية ونظام التعلم ومكتبة السلاسل العلمية التسع...',
  },
  {
    id: 'Halaman Manajemen Akun, ID Login & Password Seluruh Pengguna dilindungi dengan kode rahasia pemilik. Silakan masukkan kode password pemilik untuk melanjutkan.',
    en: 'The User Account, Login ID & Password Management page is protected by the owner security code. Please enter the owner passcode to continue.',
    ar: 'صفحة إدارة الحسابات ومعرفات الدخول وكلمات المرور محمية برمز المالك السري. يرجى إدخال رمز مرور المالك للمتابعة.',
  },
  {
    id: 'Halaman Pengaturan Sistem & Integrasi Database (Code.gs & Setup.gs) dilindungi dengan kode rahasia pemilik. Silakan masukkan kode password pemilik untuk melanjutkan.',
    en: 'The System Settings & Database Integration (Code.gs & Setup.gs) page is protected by the owner security code. Please enter the owner passcode to continue.',
    ar: 'صفحة إعدادات النظام وتكامل قاعدة البيانات محمية برمز المالك السري. يرجى إدخال رمز مرور المالك للمتابعة.',
  },
];

/**
 * Pure function that translates any Indonesian application text into
 * Bahasa Indonesia ('id' default), English ('en'), or Arabic Fusha ('ar').
 */
export function translateTextToLanguage(
  rawText: string,
  lang: AppLanguage
): string {
  if (!rawText || lang === 'id') {
    return rawText;
  }

  const trimmed = rawText.trim();
  if (!trimmed) {
    return rawText;
  }

  // Preserve leading and trailing whitespace
  const leadingSpaceMatch = rawText.match(/^\s*/);
  const trailingSpaceMatch = rawText.match(/\s*$/);
  const leadingSpace = leadingSpaceMatch ? leadingSpaceMatch[0] : '';
  const trailingSpace = trailingSpaceMatch ? trailingSpaceMatch[0] : '';

  // 1. Check exact match dictionary
  const exact = EXACT_TRANSLATIONS[trimmed];
  if (exact) {
    return `${leadingSpace}${exact[lang]}${trailingSpace}`;
  }

  // 2. Apply phrase replacements for composite or dynamic strings
  let result = trimmed;
  for (const item of PHRASE_REPLACEMENTS) {
    if (result.includes(item.id)) {
      result = result.split(item.id).join(lang === 'en' ? item.en : item.ar);
    }
  }

  return `${leadingSpace}${result}${trailingSpace}`;
}

const originalTextNodeMap = new WeakMap<Node, string>();

const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'CODE',
  'PRE',
  'TEXTAREA',
  'SVG',
  'PATH',
]);

/**
 * Synchronizes all text nodes and accessible attributes inside rootElement
 * to the active language losslessly, allowing instant switching between
 * Bahasa Indonesia ('id'), English ('en'), and Arabic Fusha ('ar').
 */
export function applyLanguageToDom(
  rootElement: HTMLElement | null,
  lang: AppLanguage
): void {
  if (!rootElement || typeof document === 'undefined') return;

  // Walk text nodes
  const walker = document.createTreeWalker(
    rootElement,
    NodeFilter.SHOW_TEXT,
    null
  );

  let currentNode: Node | null = walker.nextNode();
  while (currentNode) {
    const parent = currentNode.parentElement;
    if (
      parent &&
      !SKIP_TAGS.has(parent.tagName) &&
      !parent.closest('[data-no-translate="true"]')
    ) {
      const currentVal = currentNode.nodeValue || '';
      if (!originalTextNodeMap.has(currentNode)) {
        originalTextNodeMap.set(currentNode, currentVal);
      } else if (lang === 'id') {
        // When in default Indonesian mode, if React updated the text node to a new Indonesian string, keep it fresh
        const storedOrig = originalTextNodeMap.get(currentNode) || '';
        const prevEn = translateTextToLanguage(storedOrig, 'en');
        const prevAr = translateTextToLanguage(storedOrig, 'ar');
        if (
          currentVal !== storedOrig &&
          currentVal !== prevEn &&
          currentVal !== prevAr
        ) {
          originalTextNodeMap.set(currentNode, currentVal);
        }
      }

      const origText = originalTextNodeMap.get(currentNode) ?? currentVal;
      // Also check if React replaced nodeValue dynamically while in 'en' or 'ar'
      const expectedPrevEn = translateTextToLanguage(origText, 'en');
      const expectedPrevAr = translateTextToLanguage(origText, 'ar');
      let effectiveOrig = origText;
      if (
        currentVal !== origText &&
        currentVal !== expectedPrevEn &&
        currentVal !== expectedPrevAr
      ) {
        effectiveOrig = currentVal;
        originalTextNodeMap.set(currentNode, currentVal);
      }

      const translated =
        lang === 'id'
          ? effectiveOrig
          : translateTextToLanguage(effectiveOrig, lang);

      if (currentNode.nodeValue !== translated) {
        currentNode.nodeValue = translated;
      }
    }
    currentNode = walker.nextNode();
  }

  // Translate placeholder, title, and aria-label attributes
  const elements = rootElement.querySelectorAll<HTMLElement>(
    '[placeholder], [title], [aria-label]'
  );
  elements.forEach((el) => {
    if (el.closest('[data-no-translate="true"]')) return;

    (['placeholder', 'title', 'aria-label'] as const).forEach((attr) => {
      const val = el.getAttribute(attr);
      if (!val) return;
      const dataKey = `data-orig-${attr}`;
      let origAttr = el.getAttribute(dataKey);
      if (!origAttr) {
        origAttr = val;
        el.setAttribute(dataKey, origAttr);
      }
      const nextVal =
        lang === 'id' ? origAttr : translateTextToLanguage(origAttr, lang);
      if (el.getAttribute(attr) !== nextVal) {
        el.setAttribute(attr, nextVal);
      }
    });
  });
}
