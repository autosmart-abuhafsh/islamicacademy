import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileText,
  Filter,
  GitBranch,
  Lock,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  AcademyDatabase,
  DistributionRight,
  LibraryBook,
  LibrarySubcategory,
  ModuleKey,
  PermissionAction,
  UserAccount,
  VerificationStatus,
} from '../types/database';
import {
  canAccessBookFile,
  hasPermission,
  searchAndFilterBooks,
} from '../utils/academicLogic';
import { KitabCoverArtwork } from './IslamicOrnament';

interface LibraryModuleProps {
  db: AcademyDatabase;
  currentUser: UserAccount | null;
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
  initialSubView?: 'catalog' | 'silsilah' | 'pathway' | 'verification';
}

export function LibraryModule({
  db,
  currentUser,
  onMutate,
  onUploadFile,
  onNotify,
  initialSubView = 'catalog',
}: LibraryModuleProps) {
  const [subView, setSubView] = useState<'catalog' | 'silsilah' | 'pathway' | 'verification'>(
    initialSubView
  );

  useEffect(() => {
    setSubView(initialSubView);
  }, [initialSubView]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');
  const [selectedVerification, setSelectedVerification] = useState<
    VerificationStatus | 'ALL'
  >('ALL');
  const [selectedDistribution, setSelectedDistribution] = useState<
    DistributionRight | 'ALL'
  >('ALL');

  const [activeBookDetail, setActiveBookDetail] = useState<LibraryBook | null>(
    null
  );
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<LibraryBook | null>(null);
  const [isSubcatModalOpen, setIsSubcatModalOpen] = useState(false);
  const [newSubcatName, setNewSubcatName] = useState('');
  const [newSubcatArabic, setNewSubcatArabic] = useState('');
  const [newSubcatDesc, setNewSubcatDesc] = useState('');
  const [newSubcatCatId, setNewSubcatCatId] = useState(
    db.libraryCategories[0]?.id || 'cat-1-lughah'
  );
  const [isUploading, setIsUploading] = useState(false);

  const canManageLibrary = hasPermission(
    currentUser,
    db.roles,
    'library',
    'create'
  );

  // Form state for creating/editing a book
  const [bookForm, setBookForm] = useState({
    code: '',
    arabicTitle: '',
    transliterationTitle: '',
    translatedTitle: '',
    description: '',
    authorName: '',
    authorArabicName: '',
    authorDeathYearHijri: '',
    authorBiography: '',
    authorBioSource: '',
    categoryId: db.libraryCategories[0]?.id || 'cat-1-lughah',
    subcategoryId: db.librarySubcategories[0]?.id || 'sub-1-1',
    fieldOfStudy: '',
    difficultyLevel: 'Pemula' as 'Pemula' | 'Menengah' | 'Lanjutan',
    prerequisitesText: '',
    learningOrder: 1,
    previousBookId: '',
    nextBookId: '',
    language: 'Arab' as 'Arab' | 'Indonesia' | 'Arab & Indonesia',
    publisher: '',
    publicationYear: '',
    editionNumber: '',
    pageCount: 100,
    tocText: '',
    bibliographySource: '',
    externalReferenceUrl: '',
    verificationNotes: '',
    verificationStatus: 'Verified' as VerificationStatus,
    distributionRight: 'Public Domain' as DistributionRight,
    pdfUrl: '',
  });

  const openAddBookModal = () => {
    setEditingBook(null);
    const nextCode = `KIT-NEW-${String(db.books.length + 1).padStart(3, '0')}`;
    setBookForm({
      code: nextCode,
      arabicTitle: '',
      transliterationTitle: '',
      translatedTitle: '',
      description: '',
      authorName: '',
      authorArabicName: '',
      authorDeathYearHijri: '',
      authorBiography: '',
      authorBioSource: '',
      categoryId: db.libraryCategories[0]?.id || 'cat-1-lughah',
      subcategoryId: db.librarySubcategories[0]?.id || 'sub-1-1',
      fieldOfStudy: 'Ilmu Syar’i',
      difficultyLevel: 'Pemula',
      prerequisitesText: '',
      learningOrder: 1,
      previousBookId: '',
      nextBookId: '',
      language: 'Arab',
      publisher: 'Darul Minhaj',
      publicationYear: '1435 H',
      editionNumber: 'Cetakan Ke-1',
      pageCount: 120,
      tocText: 'Muqaddimah\nBab Pertama\nBab Kedua',
      bibliographySource: '',
      externalReferenceUrl: '',
      verificationNotes: 'Metadata telah diperiksa oleh pustakawan.',
      verificationStatus: 'Verified',
      distributionRight: 'Public Domain',
      pdfUrl: '',
    });
    setIsBookModalOpen(true);
  };

  const openEditBookModal = (book: LibraryBook) => {
    setEditingBook(book);
    setBookForm({
      code: book.code,
      arabicTitle: book.arabicTitle,
      transliterationTitle: book.transliterationTitle,
      translatedTitle: book.translatedTitle,
      description: book.description,
      authorName: book.authorName,
      authorArabicName: book.authorArabicName || '',
      authorDeathYearHijri: book.authorDeathYearHijri || '',
      authorBiography: book.authorBiography,
      authorBioSource: book.authorBioSource,
      categoryId: book.categoryId,
      subcategoryId: book.subcategoryId,
      fieldOfStudy: book.fieldOfStudy,
      difficultyLevel: book.difficultyLevel,
      prerequisitesText: book.prerequisites.join(', '),
      learningOrder: book.learningOrder,
      previousBookId: book.previousBookId || '',
      nextBookId: book.nextBookId || '',
      language: book.language,
      publisher: book.publisher,
      publicationYear: book.publicationYear || '',
      editionNumber: book.editionNumber || '',
      pageCount: book.pageCount || 100,
      tocText: book.tableOfContents.join('\n'),
      bibliographySource: book.bibliographySource,
      externalReferenceUrl: book.externalReferenceUrl || '',
      verificationNotes: book.verificationNotes,
      verificationStatus: book.verificationStatus,
      distributionRight: book.distributionRight,
      pdfUrl: book.pdfUrl || '',
    });
    setIsBookModalOpen(true);
  };

  const handleBookFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const uploaded = await onUploadFile(file);
      if (uploaded) {
        setBookForm((prev) => ({
          ...prev,
          pdfUrl: uploaded.fileUrl,
        }));
        onNotify(
          `Dokumen "${uploaded.fileName}" (${uploaded.fileSizeKb} KB) berhasil diunggah ke penyimpanan server.`,
          'success'
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !bookForm.arabicTitle.trim() ||
      !bookForm.transliterationTitle.trim() ||
      !bookForm.authorName.trim() ||
      !bookForm.bibliographySource.trim()
    ) {
      onNotify(
        'Judul Arab, Transliterasi, Nama Pengarang, dan Sumber Bibliografi wajib diisi.',
        'error'
      );
      return;
    }

    const accentPalette = ['#087451', '#14283F', '#C5A45B'];
    const newBook: LibraryBook = {
      id: editingBook ? editingBook.id : `bk-${Date.now()}`,
      code: bookForm.code.trim(),
      arabicTitle: bookForm.arabicTitle.trim(),
      transliterationTitle: bookForm.transliterationTitle.trim(),
      translatedTitle: bookForm.translatedTitle.trim(),
      description: bookForm.description.trim(),
      coverAccent:
        editingBook?.coverAccent ||
        accentPalette[db.books.length % accentPalette.length],
      authorName: bookForm.authorName.trim(),
      authorArabicName: bookForm.authorArabicName.trim(),
      authorDeathYearHijri: bookForm.authorDeathYearHijri.trim(),
      authorBiography: bookForm.authorBiography.trim(),
      authorBioSource: bookForm.authorBioSource.trim() || 'Dokumentasi Bibliografi Akademi',
      categoryId: bookForm.categoryId,
      subcategoryId: bookForm.subcategoryId,
      fieldOfStudy: bookForm.fieldOfStudy.trim(),
      difficultyLevel: bookForm.difficultyLevel,
      prerequisites: bookForm.prerequisitesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      learningOrder: Number(bookForm.learningOrder) || 1,
      previousBookId: bookForm.previousBookId || undefined,
      nextBookId: bookForm.nextBookId || undefined,
      language: bookForm.language,
      publisher: bookForm.publisher.trim(),
      publicationYear: bookForm.publicationYear.trim(),
      editionNumber: bookForm.editionNumber.trim(),
      pageCount: Number(bookForm.pageCount) || undefined,
      tableOfContents: bookForm.tocText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      bibliographySource: bookForm.bibliographySource.trim(),
      externalReferenceUrl: bookForm.externalReferenceUrl.trim() || undefined,
      verificationNotes: bookForm.verificationNotes.trim(),
      metadataCompleteness:
        bookForm.authorBioSource && bookForm.bibliographySource
          ? 'Complete'
          : 'Partial',
      verificationStatus: bookForm.verificationStatus,
      distributionRight: bookForm.distributionRight,
      verifiedAt: new Date().toISOString().slice(0, 10),
      verifiedBy: currentUser?.fullName || 'Admin Perpustakaan',
      pdfUrl:
        bookForm.distributionRight === 'Metadata Only'
          ? undefined
          : bookForm.pdfUrl.trim() || undefined,
      externalUrl: bookForm.externalReferenceUrl.trim() || undefined,
      mediaItems: editingBook?.mediaItems || [],
      isPublished: bookForm.verificationStatus !== 'Archived',
      accessCount: editingBook?.accessCount || 1,
    };

    await onMutate({
      moduleKey: 'library',
      action: editingBook ? 'edit' : 'create',
      actionLabel: editingBook ? 'MENGEDIT_KITAB' : 'MENAMBAH_KITAB',
      targetDescription: `${editingBook ? 'Memperbarui' : 'Menambahkan'} kitab ${newBook.transliterationTitle} (${newBook.code})`,
      updater: (prev) => ({
        ...prev,
        books: editingBook
          ? prev.books.map((b) => (b.id === editingBook.id ? newBook : b))
          : [newBook, ...prev.books],
      }),
    });

    setIsBookModalOpen(false);
    onNotify(
      `Kitab "${newBook.transliterationTitle}" berhasil disimpan ke database perpustakaan.`,
      'success'
    );
  };

  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubcatName.trim()) {
      onNotify('Nama subkategori wajib diisi.', 'error');
      return;
    }
    const existingForCat = db.librarySubcategories.filter(
      (s) => s.categoryId === newSubcatCatId
    );
    const subcat: LibrarySubcategory = {
      id: `sub-custom-${Date.now()}`,
      categoryId: newSubcatCatId,
      orderIndex: existingForCat.length + 1,
      name: newSubcatName.trim(),
      arabicName: newSubcatArabic.trim() || undefined,
      description: newSubcatDesc.trim() || 'Subkategori keilmuan perpustakaan digital.',
    };

    await onMutate({
      moduleKey: 'library',
      action: 'create',
      actionLabel: 'MENAMBAH_SUBKATEGORI_KITAB',
      targetDescription: `Menambahkan subkategori "${subcat.name}" pada silsilah keilmuan`,
      updater: (prev) => ({
        ...prev,
        librarySubcategories: [...prev.librarySubcategories, subcat],
      }),
    });

    setNewSubcatName('');
    setNewSubcatArabic('');
    setNewSubcatDesc('');
    setIsSubcatModalOpen(false);
    onNotify(`Subkategori "${subcat.name}" berhasil ditambahkan.`, 'success');
  };

  const filteredBooks = searchAndFilterBooks(db.books, {
    query: searchQuery,
    categoryId: selectedCategory,
    subcategoryId: selectedSubcategory,
    difficultyLevel: selectedDifficulty,
    language: selectedLanguage,
    verificationStatus: selectedVerification,
    distributionRight: selectedDistribution,
    onlyPublished: !canManageLibrary,
  });

  const availableSubcategories =
    selectedCategory === 'ALL'
      ? db.librarySubcategories
      : db.librarySubcategories.filter((s) => s.categoryId === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Library Banner Header */}
      <div className="bg-[#14283F] text-white rounded-xl p-6 border border-[#C5A45B]/40 islamic-pattern-subtle">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="text-xs font-medium text-[#C5A45B] tracking-wide">
              Pusat Dokumentasi Keilmuan Islam · 9 Silsilah Utama
            </div>
            <h2 className="text-2xl font-display font-bold text-white">
              Perpustakaan Digital & Silsilah Kitab Turats
            </h2>
            <p className="text-xs sm:text-sm text-[#F5F0E4]/80 leading-relaxed">
              Katalog ilmiah terstruktur dengan metadata bibliografi terverifikasi, silsilah urutan belajar (Learning Pathway), serta pengelolaan tanggung jawab hak distribusi dokumen.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {canManageLibrary && (
              <>
                <button
                  type="button"
                  onClick={() => setIsSubcatModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#F5F0E4] bg-white/10 hover:bg-white/15 border border-[#C5A45B]/40 rounded-lg transition-colors whitespace-nowrap"
                >
                  + Subkategori Silsilah
                </button>
                <button
                  type="button"
                  onClick={openAddBookModal}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#087451] hover:bg-[#065d40] rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Kitab & Metadata
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sub-Navigation Bar */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSubView('catalog')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                subView === 'catalog'
                  ? 'bg-[#087451] text-white'
                  : 'text-[#F5F0E4]/75 hover:text-white hover:bg-white/10'
              }`}
            >
              Smart Library Search & Katalog ({db.books.length})
            </button>
            <button
              type="button"
              onClick={() => setSubView('silsilah')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                subView === 'silsilah'
                  ? 'bg-[#087451] text-white'
                  : 'text-[#F5F0E4]/75 hover:text-white hover:bg-white/10'
              }`}
            >
              9 Silsilah & {db.librarySubcategories.length} Subkategori
            </button>
            <button
              type="button"
              onClick={() => setSubView('pathway')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                subView === 'pathway'
                  ? 'bg-[#087451] text-white'
                  : 'text-[#F5F0E4]/75 hover:text-white hover:bg-white/10'
              }`}
            >
              Peta Urutan Belajar (Learning Pathway)
            </button>
            {canManageLibrary && (
              <button
                type="button"
                onClick={() => setSubView('verification')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  subView === 'verification'
                    ? 'bg-[#087451] text-white'
                    : 'text-[#F5F0E4]/75 hover:text-white hover:bg-white/10'
                }`}
              >
                Verifikasi & Hak Distribusi
              </button>
            )}
          </div>

          <div className="text-xs text-[#F5F0E4]/75 font-mono-num">
            {db.books.filter((b) => b.verificationStatus === 'Verified').length}{' '}
            Kitab Terverifikasi · 9 Silsilah
          </div>
        </div>
      </div>

      {/* VIEW 1: 9 SILSILAH ARCHITECTURE */}
      {subView === 'silsilah' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {db.libraryCategories
              .slice()
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((cat) => {
                const subcats = db.librarySubcategories
                  .filter((s) => s.categoryId === cat.id)
                  .sort((a, b) => a.orderIndex - b.orderIndex);
                const catBooks = db.books.filter((b) => b.categoryId === cat.id);

                return (
                  <div
                    key={cat.id}
                    className="bg-white rounded-xl p-5 border border-[#14283F]/10 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs font-mono-num font-semibold text-[#087451]">
                          0{cat.orderIndex}. {cat.code}
                        </span>
                        <span
                          className="font-arabic text-base font-bold text-[#14283F]"
                          dir="rtl"
                        >
                          {cat.arabicName}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-[#14283F] mb-1">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-[#14283F]/70 mb-4 leading-relaxed">
                        {cat.description}
                      </p>

                      <div className="space-y-1.5 border-t border-[#14283F]/10 pt-3">
                        <div className="text-[11px] font-semibold text-[#14283F]/60">
                          Subkategori Keilmuan ({subcats.length}):
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#14283F]">
                          {subcats.map((sub, idx) => (
                            <React.Fragment key={sub.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCategory(cat.id);
                                  setSelectedSubcategory(sub.id);
                                  setSubView('catalog');
                                }}
                                className="hover:text-[#087451] hover:underline font-medium text-left"
                              >
                                {sub.name}
                              </button>
                              {idx < subcats.length - 1 && (
                                <span
                                  aria-hidden="true"
                                  className="text-[#14283F]/35"
                                >
                                  ·
                                </span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#14283F]/10 flex items-center justify-between text-xs">
                      <span className="text-[#14283F]/60 font-mono-num">
                        {catBooks.length} Koleksi Kitab
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setSelectedSubcategory('ALL');
                          setSubView('catalog');
                        }}
                        className="font-semibold text-[#087451] hover:underline flex items-center gap-1"
                      >
                        Buka Katalog Silsilah
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* VIEW 2: LEARNING PATHWAY (PETA URUTAN PEMBELAJARAN KITAB) */}
      {subView === 'pathway' && (
        <div className="bg-white rounded-xl p-6 border border-[#14283F]/10 space-y-6">
          <div className="max-w-3xl">
            <h3 className="text-lg font-bold text-[#14283F]">
              Peta Urutan Pembelajaran Kitab (Structured Learning Pathway)
            </h3>
            <p className="text-xs text-[#14283F]/75 mt-1 leading-relaxed">
              Visualisasi tahapan belajar kitab dari tingkat Pemula (Mubtadi’), Menengah (Mutawassith), hingga Lanjutan (Mutaqaddim) berdasarkan hubungan prasyarat kitab yang terdokumentasi secara ilmiah.
            </p>
          </div>

          <div className="space-y-6">
            {db.libraryCategories.map((cat) => {
              const pathwayBooks = db.books
                .filter((b) => b.categoryId === cat.id)
                .sort((a, b) => a.learningOrder - b.learningOrder);
              if (pathwayBooks.length === 0) return null;

              return (
                <div
                  key={cat.id}
                  className="p-4 rounded-xl bg-[#F5F0E4]/45 border border-[#C5A45B]/35 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-[#087451]" />
                      <h4 className="text-sm font-bold text-[#14283F]">
                        {cat.name}
                      </h4>
                      <span className="text-xs text-[#14283F]/50" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-arabic text-sm text-[#087451]" dir="rtl">
                        {cat.arabicName}
                      </span>
                    </div>
                    <span className="text-xs font-mono-num text-[#14283F]/60">
                      {pathwayBooks.length} Tahapan Kitab
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {pathwayBooks.map((book, index) => (
                      <div
                        key={book.id}
                        className="bg-white rounded-lg p-4 border border-[#14283F]/10 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs text-[#14283F]/60 mb-1.5 font-mono-num">
                            <span>Tahap 0{book.learningOrder}</span>
                            <span>·</span>
                            <span className="font-semibold text-[#087451]">
                              Tingkat {book.difficultyLevel}
                            </span>
                          </div>
                          <p
                            className="font-arabic text-base font-bold text-[#14283F] mb-1"
                            dir="rtl"
                          >
                            {book.arabicTitle}
                          </p>
                          <h5 className="text-sm font-bold text-[#14283F]">
                            {book.transliterationTitle}
                          </h5>
                          <p className="text-xs text-[#14283F]/70 mt-0.5">
                            {book.authorName} ({book.authorDeathYearHijri || 'Terverifikasi'})
                          </p>
                          {book.prerequisites.length > 0 && (
                            <p className="text-[11px] text-[#14283F]/65 mt-2 pt-2 border-t border-[#14283F]/10">
                              Prasyarat: {book.prerequisites.join(', ')}
                            </p>
                          )}
                        </div>

                        <div className="mt-3 pt-2 border-t border-[#14283F]/10 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setActiveBookDetail(book)}
                            className="text-xs font-semibold text-[#087451] hover:underline"
                          >
                            Lihat Detail Metadata
                          </button>
                          {index < pathwayBooks.length - 1 && (
                            <span className="text-[11px] text-[#C5A45B] font-medium">
                              Lanjut ke Tahap 0{book.learningOrder + 1} &rarr;
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: VERIFICATION & COPYRIGHT TABLE FOR LIBRARY ADMIN */}
      {subView === 'verification' && canManageLibrary && (
        <div className="bg-white rounded-xl p-6 border border-[#14283F]/10 space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#14283F]">
              Audit Kredibilitas Metadata & Hak Distribusi Dokumen (Section 9.4)
            </h3>
            <p className="text-xs text-[#14283F]/70">
              Setiap file PDF atau dokumen hanya boleh disediakan untuk diunduh apabila hak distribusinya jelas. Jika statusnya &ldquo;Metadata Only&rdquo; atau &ldquo;Unverified&rdquo;, sistem otomatis menonaktifkan tautan unduhan.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#14283F]/15 text-[#14283F]/70">
                  <th className="py-3 px-3 font-semibold">Kode</th>
                  <th className="py-3 px-3 font-semibold">Judul Kitab</th>
                  <th className="py-3 px-3 font-semibold">Sumber Bibliografi</th>
                  <th className="py-3 px-3 font-semibold">Status Verifikasi</th>
                  <th className="py-3 px-3 font-semibold">Hak Distribusi</th>
                  <th className="py-3 px-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#14283F]/10">
                {db.books.map((book) => (
                  <tr key={book.id} className="hover:bg-[#F5F0E4]/40">
                    <td className="py-3 px-3 font-mono-num font-medium">
                      {book.code}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#14283F]">
                        {book.transliterationTitle}
                      </div>
                      <div className="text-[#14283F]/60">{book.authorName}</div>
                    </td>
                    <td className="py-3 px-3 text-[#14283F]/75 max-w-xs">
                      {book.bibliographySource}
                    </td>
                    <td className="py-3 px-3">
                      <select
                        aria-label={`Ubah status verifikasi ${book.transliterationTitle}`}
                        value={book.verificationStatus}
                        onChange={(e) => {
                          const nextStatus = e.target.value as VerificationStatus;
                          onMutate({
                            moduleKey: 'library',
                            action: 'edit',
                            actionLabel: 'UBAH_VERIFIKASI_KITAB',
                            targetDescription: `Mengubah status verifikasi ${book.transliterationTitle} menjadi ${nextStatus}`,
                            updater: (prev) => ({
                              ...prev,
                              books: prev.books.map((b) =>
                                b.id === book.id
                                  ? {
                                      ...b,
                                      verificationStatus: nextStatus,
                                      verifiedAt: new Date()
                                        .toISOString()
                                        .slice(0, 10),
                                      verifiedBy:
                                        currentUser?.fullName ||
                                        'Admin Perpustakaan',
                                    }
                                  : b
                              ),
                            }),
                          });
                        }}
                        className="px-2.5 py-1 rounded border border-[#14283F]/20 bg-white text-xs font-medium"
                      >
                        <option value="Verified">Verified</option>
                        <option value="Partially Verified">Partially Verified</option>
                        <option value="Unverified">Unverified</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        aria-label={`Ubah hak distribusi ${book.transliterationTitle}`}
                        value={book.distributionRight}
                        onChange={(e) => {
                          const nextRight = e.target.value as DistributionRight;
                          onMutate({
                            moduleKey: 'library',
                            action: 'edit',
                            actionLabel: 'UBAH_DISTRIBUSI_KITAB',
                            targetDescription: `Mengubah hak distribusi ${book.transliterationTitle} menjadi ${nextRight}`,
                            updater: (prev) => ({
                              ...prev,
                              books: prev.books.map((b) =>
                                b.id === book.id
                                  ? { ...b, distributionRight: nextRight }
                                  : b
                              ),
                            }),
                          });
                        }}
                        className="px-2.5 py-1 rounded border border-[#14283F]/20 bg-white text-xs font-medium"
                      >
                        <option value="Public Domain">Public Domain</option>
                        <option value="Licensed">Licensed</option>
                        <option value="Permission Documented">
                          Permission Documented
                        </option>
                        <option value="External Authorized Link">
                          External Authorized Link
                        </option>
                        <option value="Restricted Access">Restricted Access</option>
                        <option value="Metadata Only">Metadata Only</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEditBookModal(book)}
                        className="text-xs font-semibold text-[#087451] hover:underline"
                      >
                        Edit Metadata
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: SMART LIBRARY SEARCH & BOOK CATALOG */}
      {subView === 'catalog' && (
        <div className="space-y-5">
          {/* Smart Search & Multi-Facet Filter Bar */}
          <div className="bg-white rounded-xl p-5 border border-[#14283F]/10 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-[#14283F]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                aria-label="Smart Library Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Smart Library Search: Cari judul Arab (الآجرومية / الورقات), transliterasi (Ajurrumiyyah, Waraqat, Baiquniyyah), pengarang (Ibnu Malik, Ibnu Hajar), atau bidang ilmu..."
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-[#14283F]/20 focus:outline-none focus:border-[#087451]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#14283F]/65 mb-1">
                  Silsilah Keilmuan
                </label>
                <select
                  aria-label="Filter Silsilah Keilmuan"
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubcategory('ALL');
                  }}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-[#14283F]/20 bg-white"
                >
                  <option value="ALL">Semua 9 Silsilah</option>
                  {db.libraryCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      0{c.orderIndex}. {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#14283F]/65 mb-1">
                  Subkategori
                </label>
                <select
                  aria-label="Filter Subkategori"
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-[#14283F]/20 bg-white"
                >
                  <option value="ALL">Semua Subkategori</option>
                  {availableSubcategories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#14283F]/65 mb-1">
                  Tingkat Pembelajaran
                </label>
                <select
                  aria-label="Filter Tingkat Pembelajaran"
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-[#14283F]/20 bg-white"
                >
                  <option value="ALL">Semua Tingkat</option>
                  <option value="Pemula">Pemula (Mubtadi’)</option>
                  <option value="Menengah">Menengah (Mutawassith)</option>
                  <option value="Lanjutan">Lanjutan (Mutaqaddim)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#14283F]/65 mb-1">
                  Bahasa Kitab
                </label>
                <select
                  aria-label="Filter Bahasa Kitab"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-[#14283F]/20 bg-white"
                >
                  <option value="ALL">Semua Bahasa</option>
                  <option value="Arab">Bahasa Arab</option>
                  <option value="Indonesia">Bahasa Indonesia</option>
                  <option value="Arab & Indonesia">Arab & Terjemah</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#14283F]/65 mb-1">
                  Status Verifikasi
                </label>
                <select
                  aria-label="Filter Status Verifikasi"
                  value={selectedVerification}
                  onChange={(e) =>
                    setSelectedVerification(
                      e.target.value as VerificationStatus | 'ALL'
                    )
                  }
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-[#14283F]/20 bg-white"
                >
                  <option value="ALL">Semua Status Verifikasi</option>
                  <option value="Verified">Verified</option>
                  <option value="Partially Verified">Partially Verified</option>
                  <option value="Unverified">Unverified</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#14283F]/65 mb-1">
                  Hak Distribusi & Akses
                </label>
                <select
                  aria-label="Filter Hak Distribusi"
                  value={selectedDistribution}
                  onChange={(e) =>
                    setSelectedDistribution(
                      e.target.value as DistributionRight | 'ALL'
                    )
                  }
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-[#14283F]/20 bg-white"
                >
                  <option value="ALL">Semua Hak Akses</option>
                  <option value="Public Domain">Public Domain</option>
                  <option value="Permission Documented">
                    Permission Documented
                  </option>
                  <option value="External Authorized Link">
                    External Authorized Link
                  </option>
                  <option value="Restricted Access">Restricted Access</option>
                  <option value="Metadata Only">Metadata Only</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#14283F]/10 text-xs text-[#14283F]/70">
              <span>
                Menampilkan <strong className="font-mono-num">{filteredBooks.length}</strong> dari{' '}
                <strong className="font-mono-num">{db.books.length}</strong> koleksi kitab
              </span>
              {(searchQuery ||
                selectedCategory !== 'ALL' ||
                selectedSubcategory !== 'ALL' ||
                selectedDifficulty !== 'ALL' ||
                selectedVerification !== 'ALL' ||
                selectedDistribution !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('ALL');
                    setSelectedSubcategory('ALL');
                    setSelectedDifficulty('ALL');
                    setSelectedLanguage('ALL');
                    setSelectedVerification('ALL');
                    setSelectedDistribution('ALL');
                  }}
                  className="text-xs font-semibold text-[#087451] hover:underline"
                >
                  Reset Filter Pencarian
                </button>
              )}
            </div>
          </div>

          {/* Book Cards Grid */}
          {filteredBooks.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center border border-[#14283F]/10 space-y-2">
              <BookOpen className="w-8 h-8 text-[#C5A45B] mx-auto" />
              <h3 className="text-base font-bold text-[#14283F]">
                Tidak Ada Kitab yang Sesuai Filter Pencarian
              </h3>
              <p className="text-xs text-[#14283F]/70 max-w-md mx-auto">
                Coba gunakan kata kunci transliterasi atau bahasa Arab lain, atau reset filter silsilah di atas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBooks.map((book) => {
                const cat = db.libraryCategories.find(
                  (c) => c.id === book.categoryId
                );
                const subcat = db.librarySubcategories.find(
                  (s) => s.id === book.subcategoryId
                );
                const fileAccess = canAccessBookFile(
                  book,
                  currentUser,
                  db.settings.requireBookVerificationBeforeDownload
                );

                return (
                  <div
                    key={book.id}
                    className="bg-white rounded-xl p-5 border border-[#14283F]/10 flex flex-col justify-between hover:border-[#C5A45B] transition-colors"
                  >
                    <div>
                      <div className="flex gap-4">
                        <div className="w-24 shrink-0">
                          <KitabCoverArtwork
                            arabicTitle={book.arabicTitle}
                            code={book.code}
                            accentColor={book.coverAccent}
                            difficultyLevel={book.difficultyLevel}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Unboxed metadata per zero-pill discipline */}
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#14283F]/65 mb-1">
                            <span className="font-semibold text-[#087451]">
                              {cat?.name || 'Silsilah'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{subcat?.name || book.fieldOfStudy}</span>
                            <span aria-hidden="true">·</span>
                            <span>{book.difficultyLevel}</span>
                          </div>

                          <p
                            className="font-arabic text-base font-bold text-[#14283F] leading-snug mb-1"
                            dir="rtl"
                          >
                            {book.arabicTitle}
                          </p>
                          <h3 className="text-sm font-bold text-[#14283F] leading-snug">
                            {book.transliterationTitle}
                          </h3>
                          <p className="text-xs text-[#14283F]/65 mt-0.5 line-clamp-1">
                            {book.translatedTitle}
                          </p>
                          <p className="text-xs font-medium text-[#14283F]/85 mt-2">
                            {book.authorName}
                          </p>
                          {book.authorDeathYearHijri && (
                            <p className="text-[11px] text-[#14283F]/60 font-mono-num">
                              Wafat: {book.authorDeathYearHijri}
                            </p>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-[#14283F]/75 mt-3 line-clamp-2 leading-relaxed">
                        {book.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#14283F]/10 space-y-2.5">
                      {/* Verification & Copyright Status Line (clean text with icon + separator) */}
                      <div className="flex items-center justify-between text-[11px] text-[#14283F]/75">
                        <span className="flex items-center gap-1 font-medium">
                          {book.verificationStatus === 'Verified' ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-[#087451]" />
                          ) : (
                            <ShieldAlert className="w-3.5 h-3.5 text-[#C5A45B]" />
                          )}
                          {book.verificationStatus}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium">
                          Hak: {book.distributionRight}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveBookDetail(book)}
                          className="px-3.5 py-2 text-xs font-semibold text-white bg-[#087451] hover:bg-[#065d40] rounded-lg transition-colors flex-1 text-center"
                        >
                          Detail Metadata & Akses Kitab
                        </button>
                        {canManageLibrary && (
                          <button
                            type="button"
                            onClick={() => openEditBookModal(book)}
                            className="px-3 py-2 text-xs font-semibold text-[#14283F] bg-[#F5F0E4] hover:bg-[#C5A45B]/25 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* BOOK METADATA DETAIL MODAL (PRD Section 9.3 A–F) */}
      {activeBookDetail && (
        <div
          className="fixed inset-0 z-50 bg-[#14283F]/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="book-detail-title"
        >
          <div className="bg-white border border-[#C5A45B]/40 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-20 bg-[#14283F] text-white px-6 py-4 flex items-center justify-between border-b border-[#C5A45B]/30">
              <div>
                <div className="text-xs text-[#C5A45B] font-mono-num">
                  Lembar Dokumentasi Ilmiah & Metadata Kitab · {activeBookDetail.code}
                </div>
                <h3 id="book-detail-title" className="text-base font-bold">
                  {activeBookDetail.transliterationTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveBookDetail(null)}
                aria-label="Tutup detail kitab"
                className="p-1.5 rounded-lg text-[#F5F0E4]/75 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Top Hero Metadata A: Identitas Kitab */}
              <div className="flex flex-col sm:flex-row gap-6 pb-6 border-b border-[#14283F]/10">
                <div className="w-36 shrink-0 mx-auto sm:mx-0">
                  <KitabCoverArtwork
                    arabicTitle={activeBookDetail.arabicTitle}
                    code={activeBookDetail.code}
                    accentColor={activeBookDetail.coverAccent}
                    difficultyLevel={activeBookDetail.difficultyLevel}
                  />
                </div>
                <div className="flex-1 space-y-2.5">
                  <div className="text-xs text-[#087451] font-semibold">
                    A. IDENTITAS KITAB
                  </div>
                  <p
                    className="font-arabic text-2xl font-bold text-[#14283F]"
                    dir="rtl"
                  >
                    {activeBookDetail.arabicTitle}
                  </p>
                  <h4 className="text-lg font-bold text-[#14283F]">
                    {activeBookDetail.transliterationTitle}
                  </h4>
                  <p className="text-sm text-[#14283F]/75">
                    Terjemahan Judul: {activeBookDetail.translatedTitle}
                  </p>
                  <p className="text-xs text-[#14283F]/80 leading-relaxed pt-1">
                    {activeBookDetail.description}
                  </p>
                </div>
              </div>

              {/* Grid B, C, D, E */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* B. Informasi Pengarang */}
                <div className="p-4 rounded-xl bg-[#F5F0E4]/50 border border-[#14283F]/10 space-y-2">
                  <div className="text-xs font-bold text-[#087451]">
                    B. INFORMASI PENGARANG (MUSHANNIF)
                  </div>
                  <div className="text-xs space-y-1.5">
                    <div>
                      <span className="text-[#14283F]/60">Nama Pengarang:</span>{' '}
                      <strong className="text-[#14283F]">
                        {activeBookDetail.authorName}
                      </strong>
                    </div>
                    {activeBookDetail.authorDeathYearHijri && (
                      <div>
                        <span className="text-[#14283F]/60">Tahun Wafat Terverifikasi:</span>{' '}
                        <span className="font-mono-num font-semibold">
                          {activeBookDetail.authorDeathYearHijri}
                        </span>
                      </div>
                    )}
                    <p className="text-[#14283F]/80 leading-relaxed pt-1">
                      {activeBookDetail.authorBiography}
                    </p>
                    <div className="pt-1 text-[11px] text-[#14283F]/65">
                      Sumber Biografi: <em>{activeBookDetail.authorBioSource}</em>
                    </div>
                  </div>
                </div>

                {/* C. Klasifikasi Keilmuan */}
                <div className="p-4 rounded-xl bg-[#F5F0E4]/50 border border-[#14283F]/10 space-y-2">
                  <div className="text-xs font-bold text-[#087451]">
                    C. KLASIFIKASI KEILMUAN & LEARNING PATHWAY
                  </div>
                  <div className="text-xs space-y-1.5">
                    <div>
                      <span className="text-[#14283F]/60">Silsilah Keilmuan:</span>{' '}
                      <strong>
                        {
                          db.libraryCategories.find(
                            (c) => c.id === activeBookDetail.categoryId
                          )?.name
                        }
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#14283F]/60">Subkategori & Bidang:</span>{' '}
                      <strong>
                        {
                          db.librarySubcategories.find(
                            (s) => s.id === activeBookDetail.subcategoryId
                          )?.name
                        }{' '}
                        · {activeBookDetail.fieldOfStudy}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#14283F]/60">Tingkat & Urutan Belajar:</span>{' '}
                      <strong>
                        {activeBookDetail.difficultyLevel} (Urutan Tahap Ke-
                        {activeBookDetail.learningOrder})
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#14283F]/60">Prasyarat Pembelajaran:</span>{' '}
                      <span>
                        {activeBookDetail.prerequisites.length > 0
                          ? activeBookDetail.prerequisites.join(', ')
                          : 'Tidak ada prasyarat khusus (Kitab Dasar)'}
                      </span>
                    </div>
                    {activeBookDetail.previousBookId && (
                      <div>
                        <span className="text-[#14283F]/60">Kitab Sebelumnya:</span>{' '}
                        <button
                          type="button"
                          onClick={() => {
                            const prevBook = db.books.find(
                              (b) => b.id === activeBookDetail.previousBookId
                            );
                            if (prevBook) setActiveBookDetail(prevBook);
                          }}
                          className="text-[#087451] font-semibold hover:underline"
                        >
                          {
                            db.books.find(
                              (b) => b.id === activeBookDetail.previousBookId
                            )?.transliterationTitle
                          }
                        </button>
                      </div>
                    )}
                    {activeBookDetail.nextBookId && (
                      <div>
                        <span className="text-[#14283F]/60">Kitab Lanjutan:</span>{' '}
                        <button
                          type="button"
                          onClick={() => {
                            const nextBook = db.books.find(
                              (b) => b.id === activeBookDetail.nextBookId
                            );
                            if (nextBook) setActiveBookDetail(nextBook);
                          }}
                          className="text-[#087451] font-semibold hover:underline"
                        >
                          {
                            db.books.find(
                              (b) => b.id === activeBookDetail.nextBookId
                            )?.transliterationTitle
                          }
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* D. Informasi Edisi & Daftar Isi */}
                <div className="p-4 rounded-xl bg-[#F5F0E4]/50 border border-[#14283F]/10 space-y-2">
                  <div className="text-xs font-bold text-[#087451]">
                    D. INFORMASI EDISI & DAFTAR ISI
                  </div>
                  <div className="text-xs space-y-1.5">
                    <div>
                      <span className="text-[#14283F]/60">Bahasa Kitab:</span>{' '}
                      <strong>{activeBookDetail.language}</strong>
                    </div>
                    <div>
                      <span className="text-[#14283F]/60">Penerbit & Tahun:</span>{' '}
                      <strong>
                        {activeBookDetail.publisher} ({activeBookDetail.publicationYear || '-'})
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#14283F]/60">Edisi & Jumlah Halaman:</span>{' '}
                      <span className="font-mono-num">
                        {activeBookDetail.editionNumber || 'Standar'} ·{' '}
                        {activeBookDetail.pageCount || '-'} Halaman
                      </span>
                    </div>
                    <div className="pt-1">
                      <div className="text-[#14283F]/60 mb-1">Daftar Bab / Isi Pokok:</div>
                      <ul className="list-disc list-inside space-y-0.5 text-[#14283F]/85">
                        {activeBookDetail.tableOfContents.map((ch, idx) => (
                          <li key={idx}>{ch}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* E. Referensi dan Kredibilitas */}
                <div className="p-4 rounded-xl bg-[#F5F0E4]/50 border border-[#14283F]/10 space-y-2">
                  <div className="text-xs font-bold text-[#087451]">
                    E. REFERENSI, KREDIBILITAS & VERIFIKASI
                  </div>
                  <div className="text-xs space-y-1.5">
                    <div>
                      <span className="text-[#14283F]/60">Status Verifikasi:</span>{' '}
                      <strong className="text-[#087451]">
                        {activeBookDetail.verificationStatus}
                      </strong>{' '}
                      ({activeBookDetail.metadataCompleteness})
                    </div>
                    <div>
                      <span className="text-[#14283F]/60">Hak Distribusi:</span>{' '}
                      <strong>{activeBookDetail.distributionRight}</strong>
                    </div>
                    <div>
                      <span className="text-[#14283F]/60">Sumber Bibliografi:</span>{' '}
                      <span>{activeBookDetail.bibliographySource}</span>
                    </div>
                    <div>
                      <span className="text-[#14283F]/60">Catatan Pemeriksaan:</span>{' '}
                      <span>{activeBookDetail.verificationNotes}</span>
                    </div>
                    <div className="text-[11px] text-[#14283F]/65 pt-1">
                      Diperiksa pada{' '}
                      <span className="font-mono-num">
                        {activeBookDetail.verifiedAt || '-'}
                      </span>{' '}
                      oleh <strong>{activeBookDetail.verifiedBy || 'Tim Perpustakaan'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* F. Media dan Akses (Enforcing Copyright & Distribution Rights) */}
              <div className="p-5 rounded-xl bg-[#14283F] text-white space-y-3">
                <div className="text-xs font-bold text-[#C5A45B]">
                  F. MEDIA, DOKUMEN & HAK AKSES DISTRIBUSI
                </div>
                {(() => {
                  const access = canAccessBookFile(
                    activeBookDetail,
                    currentUser,
                    db.settings.requireBookVerificationBeforeDownload
                  );
                  if (!access.allowed) {
                    return (
                      <div className="flex items-start gap-3 p-3.5 rounded-lg bg-white/10 border border-[#C5A45B]/40 text-xs">
                        <Lock className="w-4 h-4 text-[#C5A45B] shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-[#C5A45B]">
                            Akses Dokumen Dibatasi ({activeBookDetail.distributionRight})
                          </div>
                          <p className="text-[#F5F0E4]/85 mt-0.5">{access.reason}</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="text-xs text-[#F5F0E4]/85">
                        <CheckCircle2 className="w-4 h-4 text-[#087451] inline mr-1.5" />
                        {access.reason}. Dokumen naskah matan / referensi eksternal tersedia untuk diakses secara sah.
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {activeBookDetail.pdfUrl && (
                          <a
                            href={activeBookDetail.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 text-xs font-semibold text-white bg-[#087451] hover:bg-[#065d40] rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            Buka Naskah / PDF Resmi
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {activeBookDetail.externalReferenceUrl && (
                          <a
                            href={activeBookDetail.externalReferenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 text-xs font-semibold text-[#F5F0E4] bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            Tautan Referensi Bibliografi
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT BOOK MODAL */}
      {isBookModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#14283F]/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-book-modal-title"
        >
          <div className="bg-white border border-[#C5A45B]/40 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-20 bg-[#14283F] text-white px-6 py-4 flex items-center justify-between">
              <h3 id="add-book-modal-title" className="text-base font-bold">
                {editingBook
                  ? `Edit Metadata Kitab: ${editingBook.transliterationTitle}`
                  : 'Tambah Koleksi Kitab & Metadata Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsBookModalOpen(false)}
                aria-label="Tutup form kitab"
                className="p-1.5 rounded-lg text-[#F5F0E4]/75 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Kode Kitab</label>
                  <input
                    type="text"
                    required
                    value={bookForm.code}
                    onChange={(e) =>
                      setBookForm({ ...bookForm, code: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 font-mono-num"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">
                    Judul Kitab (Bahasa Arab - RTL) *
                  </label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    value={bookForm.arabicTitle}
                    onChange={(e) =>
                      setBookForm({ ...bookForm, arabicTitle: e.target.value })
                    }
                    placeholder="المقدمة الآجرومية..."
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 font-arabic text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">
                    Judul Transliterasi Latin *
                  </label>
                  <input
                    type="text"
                    required
                    value={bookForm.transliterationTitle}
                    onChange={(e) =>
                      setBookForm({
                        ...bookForm,
                        transliterationTitle: e.target.value,
                      })
                    }
                    placeholder="Al-Muqaddimah Al-Ajurrumiyyah"
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Terjemahan Judul (Indonesia)
                  </label>
                  <input
                    type="text"
                    value={bookForm.translatedTitle}
                    onChange={(e) =>
                      setBookForm({
                        ...bookForm,
                        translatedTitle: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-1">
                    Silsilah Keilmuan *
                  </label>
                  <select
                    value={bookForm.categoryId}
                    onChange={(e) => {
                      const nextCat = e.target.value;
                      const firstSub = db.librarySubcategories.find(
                        (s) => s.categoryId === nextCat
                      );
                      setBookForm({
                        ...bookForm,
                        categoryId: nextCat,
                        subcategoryId: firstSub?.id || '',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 bg-white"
                  >
                    {db.libraryCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        0{c.orderIndex}. {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Subkategori *
                  </label>
                  <select
                    value={bookForm.subcategoryId}
                    onChange={(e) =>
                      setBookForm({ ...bookForm, subcategoryId: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 bg-white"
                  >
                    {db.librarySubcategories
                      .filter((s) => s.categoryId === bookForm.categoryId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Tingkat Kesulitan
                  </label>
                  <select
                    value={bookForm.difficultyLevel}
                    onChange={(e) =>
                      setBookForm({
                        ...bookForm,
                        difficultyLevel: e.target.value as
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">
                    Nama Pengarang (Mushannif) *
                  </label>
                  <input
                    type="text"
                    required
                    value={bookForm.authorName}
                    onChange={(e) =>
                      setBookForm({ ...bookForm, authorName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Tahun Wafat Pengarang (Jika Terverifikasi)
                  </label>
                  <input
                    type="text"
                    value={bookForm.authorDeathYearHijri}
                    onChange={(e) =>
                      setBookForm({
                        ...bookForm,
                        authorDeathYearHijri: e.target.value,
                      })
                    }
                    placeholder="Contoh: 723 H / 1323 M"
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">
                    Sumber Biografi Pengarang *
                  </label>
                  <input
                    type="text"
                    required
                    value={bookForm.authorBioSource}
                    onChange={(e) =>
                      setBookForm({
                        ...bookForm,
                        authorBioSource: e.target.value,
                      })
                    }
                    placeholder="Contoh: Siyar A’lam An-Nubala Juz 18 hlm. 468"
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Sumber Bibliografi Kitab *
                  </label>
                  <input
                    type="text"
                    required
                    value={bookForm.bibliographySource}
                    onChange={(e) =>
                      setBookForm({
                        ...bookForm,
                        bibliographySource: e.target.value,
                      })
                    }
                    placeholder="Contoh: Katalog Darul Minhaj Cetakan Ke-4"
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Deskripsi Ilmiah & Biografi Singkat
                </label>
                <textarea
                  rows={2}
                  value={bookForm.description}
                  onChange={(e) =>
                    setBookForm({ ...bookForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-1">
                    Status Verifikasi Metadata
                  </label>
                  <select
                    value={bookForm.verificationStatus}
                    onChange={(e) =>
                      setBookForm({
                        ...bookForm,
                        verificationStatus: e.target.value as VerificationStatus,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 bg-white"
                  >
                    <option value="Verified">Verified</option>
                    <option value="Partially Verified">Partially Verified</option>
                    <option value="Unverified">Unverified</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Hak Distribusi (Copyright)
                  </label>
                  <select
                    value={bookForm.distributionRight}
                    onChange={(e) =>
                      setBookForm({
                        ...bookForm,
                        distributionRight: e.target.value as DistributionRight,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 bg-white"
                  >
                    <option value="Public Domain">Public Domain</option>
                    <option value="Licensed">Licensed</option>
                    <option value="Permission Documented">
                      Permission Documented
                    </option>
                    <option value="External Authorized Link">
                      External Authorized Link
                    </option>
                    <option value="Restricted Access">Restricted Access</option>
                    <option value="Metadata Only">Metadata Only</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Urutan Belajar (Learning Pathway)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={bookForm.learningOrder}
                    onChange={(e) =>
                      setBookForm({
                        ...bookForm,
                        learningOrder: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 font-mono-num"
                  />
                </div>
              </div>

              {/* File Upload or Authorized URL */}
              <div className="p-4 rounded-lg bg-[#F5F0E4]/60 border border-[#C5A45B]/40 space-y-3">
                <div className="font-semibold text-[#14283F]">
                  Unggah Dokumen PDF ke Cloud/Server Storage atau Masukkan URL Resmi
                </div>
                {bookForm.distributionRight === 'Metadata Only' ? (
                  <p className="text-[#14283F]/75">
                    Status distribusi diatur ke <strong>Metadata Only</strong>. Sesuai aturan kepatuhan hak cipta, tautan unduhan file dinonaktifkan.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium mb-1">
                        Upload File PDF / Dokumen (Max 15MB)
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.mp3"
                        onChange={handleBookFileUpload}
                        disabled={isUploading}
                        className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#087451] file:text-white file:font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1">
                        URL File / Tautan Eksternal Resmi (HTTP/HTTPS)
                      </label>
                      <input
                        type="url"
                        value={bookForm.pdfUrl}
                        onChange={(e) =>
                          setBookForm({ ...bookForm, pdfUrl: e.target.value })
                        }
                        placeholder="https://archive.org/details/..."
                        className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#14283F]/10">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#14283F]/20 text-[#14283F] font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#087451] hover:bg-[#065d40] text-white font-semibold"
                >
                  Simpan Kitab & Sinkronkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SUBCATEGORY MODAL */}
      {isSubcatModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#14283F]/65 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="subcat-modal-title"
        >
          <div className="bg-white border border-[#C5A45B]/40 rounded-xl max-w-md w-full overflow-hidden shadow-xl">
            <div className="bg-[#14283F] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 id="subcat-modal-title" className="text-sm font-bold">
                Tambah Subkategori pada Silsilah Keilmuan
              </h3>
              <button
                type="button"
                onClick={() => setIsSubcatModalOpen(false)}
                aria-label="Tutup modal subkategori"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddSubcategory} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  Pilih Silsilah Induk
                </label>
                <select
                  value={newSubcatCatId}
                  onChange={(e) => setNewSubcatCatId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 bg-white"
                >
                  {db.libraryCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      0{c.orderIndex}. {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Nama Subkategori (Latin) *
                </label>
                <input
                  type="text"
                  required
                  value={newSubcatName}
                  onChange={(e) => setNewSubcatName(e.target.value)}
                  placeholder="Contoh: Arudh wal Qawafi"
                  className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Nama Subkategori (Arab)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={newSubcatArabic}
                  onChange={(e) => setNewSubcatArabic(e.target.value)}
                  placeholder="العروض والقوافي"
                  className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20 font-arabic text-base"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  value={newSubcatDesc}
                  onChange={(e) => setNewSubcatDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#14283F]/20"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubcatModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-[#14283F]/20 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#087451] text-white font-semibold"
                >
                  Simpan Subkategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
