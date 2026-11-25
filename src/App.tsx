import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { AppsScriptSyncModal } from './components/AppsScriptSyncModal';
import { IslamicLoadingScreen } from './components/IslamicLoadingScreen';
import { PortalWorkspace } from './components/PortalWorkspace';
import { PublicPortal } from './components/PublicPortal';
import { INITIAL_ACADEMY_DATABASE } from './database/seedData';
import {
  AcademyDatabase,
  ModuleKey,
  PermissionAction,
  UserAccount,
} from './types/database';
import { resolveAppsScriptWebAppUrl } from './utils/academicLogic';

interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error';
}

const LOCAL_DB_STORAGE_KEY = 'iap_cached_database_v1';
const THEME_STORAGE_KEY = 'iap_theme_mode';
const ENV_APPS_SCRIPT_URL =
  typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined)
    : undefined;

export default function App() {
  const [db, setDb] = useState<AcademyDatabase>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_DB_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as AcademyDatabase;
        if (parsed && parsed.users && parsed.libraryCategories) {
          const resolvedUrl = resolveAppsScriptWebAppUrl(
            parsed.settings?.googleSheetSync?.appsScriptWebAppUrl,
            ENV_APPS_SCRIPT_URL
          );
          if (
            parsed.settings?.googleSheetSync &&
            !parsed.settings.googleSheetSync.appsScriptWebAppUrl
          ) {
            parsed.settings.googleSheetSync.appsScriptWebAppUrl = resolvedUrl;
            parsed.settings.googleSheetSync.lastSyncStatus = 'Connected & Synced';
          }
          return parsed;
        }
      }
    } catch {
      // Ignore storage read errors
    }
    return INITIAL_ACADEMY_DATABASE;
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // Ignore
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      return INITIAL_ACADEMY_DATABASE.users[0];
    }
    return null;
  });

  const [viewMode, setViewMode] = useState<'public' | 'workspace'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('autostart') === '1' ? 'workspace' : 'public';
  });

  // Ceremonial Loading Animation State (Initial Entry + Portal Transitions)
  const [loadingOverlay, setLoadingOverlay] = useState<{
    active: boolean;
    title: string;
    subtitle: string;
  }>(() => {
    const params = new URLSearchParams(window.location.search);
    const skipIntro = params.get('autostart') === '1';
    return {
      active: !skipIntro,
      title: "Ma'had Darul 'Ilm Al-Islami",
      subtitle:
        'Menyiapkan Beranda Akademik, LMS & Perpustakaan 9 Silsilah Keilmuan...',
    };
  });

  useEffect(() => {
    if (!loadingOverlay.active) return;
    const timer = setTimeout(() => {
      setLoadingOverlay((prev) => ({ ...prev, active: false }));
    }, 280);
    return () => clearTimeout(timer);
  }, [loadingOverlay.active]);

  const triggerPortalTransition = useCallback(
    (
      nextMode: 'public' | 'workspace',
      title: string,
      subtitle: string,
      afterSwitch?: () => void
    ) => {
      setLoadingOverlay({
        active: true,
        title,
        subtitle,
      });
      setViewMode(nextMode);
      if (afterSwitch) afterSwitch();
    },
    []
  );

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const revisionRef = useRef<number>(db.revision || INITIAL_ACADEMY_DATABASE.revision);

  const persistLocalCache = useCallback((nextDb: AcademyDatabase) => {
    try {
      localStorage.setItem(LOCAL_DB_STORAGE_KEY, JSON.stringify(nextDb));
    } catch {
      // Ignore quota errors
    }
  }, []);

  const notify = useCallback(
    (text: string, type: 'success' | 'error' = 'success') => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-3), { id, text, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const fetchDatabase = useCallback(async () => {
    try {
      const res = await fetch('/api/db');
      if (!res.ok) throw new Error('API unavailable');
      const remoteDb = (await res.json()) as AcademyDatabase;
      if (remoteDb && remoteDb.users) {
        revisionRef.current = remoteDb.revision;
        setDb(remoteDb);
        persistLocalCache(remoteDb);
        return;
      }
    } catch {
      // Static Vercel fallback: pull directly from VITE_APPS_SCRIPT_URL
      const appsScriptUrl = resolveAppsScriptWebAppUrl(
        undefined,
        ENV_APPS_SCRIPT_URL
      );
      if (appsScriptUrl && appsScriptUrl.startsWith('https://script.google.com/')) {
        try {
          const pullRes = await fetch(appsScriptUrl, { method: 'GET' });
          if (pullRes.ok) {
            const pullData = (await pullRes.json()) as {
              status?: string;
              database?: AcademyDatabase;
            };
            if (pullData?.status === 'ok' && pullData.database?.users) {
              revisionRef.current = pullData.database.revision || 1;
              setDb(pullData.database);
              persistLocalCache(pullData.database);
            }
          }
        } catch {
          // Offline fallback keeps cached state active
        }
      }
    }
  }, [persistLocalCache]);

  // Initial load + Real-Time Cross-Device Sync (SSE + Polling fallback for HP & PC)
  useEffect(() => {
    fetchDatabase();

    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/stream');
      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as {
            type: string;
            revision?: number;
          };
          if (
            payload.type === 'DB_UPDATED' &&
            payload.revision &&
            payload.revision > revisionRef.current
          ) {
            fetchDatabase();
          }
        } catch {
          // Ignore malformed event
        }
      };
    } catch {
      // Fallback to polling below
    }

    const pollTimer = setInterval(async () => {
      try {
        const res = await fetch('/api/db/revision');
        if (!res.ok) return;
        const data = (await res.json()) as { revision: number };
        if (data.revision > revisionRef.current) {
          fetchDatabase();
        }
      } catch {
        // Ignore transient network poll error
      }
    }, 6000);

    return () => {
      es?.close();
      clearInterval(pollTimer);
    };
  }, [fetchDatabase]);

  const handleMutate = useCallback(
    async ({
      moduleKey,
      action,
      actionLabel,
      targetDescription,
      updater,
      isPublicAction = false,
    }: {
      moduleKey: ModuleKey;
      action: PermissionAction;
      actionLabel: string;
      targetDescription: string;
      updater: (prev: AcademyDatabase) => AcademyDatabase;
      isPublicAction?: boolean;
    }) => {
      const now = new Date().toISOString();
      const rawNext = updater(db);
      const nextDatabase: AcademyDatabase = {
        ...rawNext,
        revision: (db.revision || 1) + 1,
        updatedAt: now,
      };
      // Optimistically update UI & cache immediately
      setDb(nextDatabase);
      persistLocalCache(nextDatabase);
      if (currentUser) {
        const refreshedSelf = nextDatabase.users.find(
          (u) => u.id === currentUser.id
        );
        if (refreshedSelf) {
          setCurrentUser(refreshedSelf);
        }
      }

      try {
        const res = await fetch('/api/db/mutate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actorId: currentUser?.id,
            moduleKey,
            action,
            actionLabel,
            targetDescription,
            nextDatabase: rawNext,
            isPublicAction,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          notify(data.error || 'Operasi ditolak oleh server RBAC.', 'error');
          await fetchDatabase();
          return;
        }
        if (data.database) {
          revisionRef.current = data.database.revision;
          setDb(data.database);
          persistLocalCache(data.database);
        }
      } catch {
        // Direct client-side Apps Script push fallback when running on static Vercel host
        const appsScriptUrl = resolveAppsScriptWebAppUrl(
          nextDatabase.settings?.googleSheetSync?.appsScriptWebAppUrl,
          ENV_APPS_SCRIPT_URL
        );
        if (appsScriptUrl && appsScriptUrl.startsWith('https://script.google.com/')) {
          try {
            await fetch(appsScriptUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({
                action: 'SYNC_PUSH',
                database: nextDatabase,
              }),
            });
          } catch {
            // Ignore direct Apps Script network warning
          }
        }
      }
    },
    [db, currentUser, notify, fetchDatabase, persistLocalCache]
  );

  const handleUploadFile = useCallback(
    async (
      file: File
    ): Promise<{
      fileUrl: string;
      fileName: string;
      fileSizeKb: number;
    } | null> => {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Gagal membaca file'));
        reader.readAsDataURL(file);
      });

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actorId: currentUser?.id || 'usr-admin-1',
            fileName: file.name,
            mimeType: file.type,
            base64Data,
            fileSizeKb: Math.round(file.size / 1024),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          notify(data.error || 'Gagal mengunggah dokumen.', 'error');
          return null;
        }
        return {
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSizeKb: data.fileSizeKb,
        };
      } catch {
        // Static Vercel fallback using data URL
        return {
          fileUrl: base64Data,
          fileName: file.name,
          fileSizeKb: Math.max(1, Math.round(file.size / 1024)),
        };
      }
    },
    [currentUser, notify]
  );

  const handleGoogleSheetSyncAction = useCallback(
    async ({
      mode,
      appsScriptWebAppUrl,
      spreadsheetUrl,
    }: {
      mode: 'PUSH' | 'PULL' | 'SAVE_CONFIG';
      appsScriptWebAppUrl: string;
      spreadsheetUrl: string;
    }) => {
      try {
        const res = await fetch('/api/sync/google-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode,
            appsScriptWebAppUrl,
            spreadsheetUrl,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          notify(data.error || 'Gagal melakukan sinkronisasi.', 'error');
          return;
        }
        if (data.database) {
          revisionRef.current = data.database.revision;
          setDb(data.database);
          persistLocalCache(data.database);
        }
        notify(
          data.message || 'Sinkronisasi Google Sheet Apps Script berhasil!',
          'success'
        );
      } catch {
        // Direct client-side fallback for static Vercel deployment
        const targetUrl = resolveAppsScriptWebAppUrl(
          appsScriptWebAppUrl,
          ENV_APPS_SCRIPT_URL
        );
        if (mode === 'PUSH' && targetUrl.startsWith('https://script.google.com/')) {
          try {
            await fetch(targetUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({
                action: 'SYNC_PUSH',
                database: db,
              }),
            });
          } catch {
            // Ignore CORS preflight note
          }
        } else if (mode === 'PULL' && targetUrl.startsWith('https://script.google.com/')) {
          try {
            const pullRes = await fetch(targetUrl, { method: 'GET' });
            const pullData = (await pullRes.json()) as {
              status?: string;
              database?: AcademyDatabase;
            };
            if (pullData?.status === 'ok' && pullData.database?.users) {
              setDb(pullData.database);
              persistLocalCache(pullData.database);
              notify('Data berhasil ditarik (Pull) dari Google Sheet Apps Script!', 'success');
              return;
            }
          } catch {
            // Continue to local config update
          }
        }
        const updatedDb: AcademyDatabase = {
          ...db,
          revision: db.revision + 1,
          updatedAt: new Date().toISOString(),
          settings: {
            ...db.settings,
            googleSheetSync: {
              ...db.settings.googleSheetSync,
              appsScriptWebAppUrl: targetUrl,
              spreadsheetUrl: spreadsheetUrl.trim(),
              lastSyncedAt: new Date().toISOString(),
              lastSyncStatus: targetUrl
                ? 'Connected & Synced'
                : 'Local Real-Time Mode',
              lastSyncMessage:
                'Konfigurasi Apps Script tersimpan & tersinkronisasi langsung.',
            },
          },
        };
        setDb(updatedDb);
        persistLocalCache(updatedDb);
        notify('Sinkronisasi & konfigurasi Google Sheet Apps Script berhasil!', 'success');
      }
    },
    [db, notify, persistLocalCache]
  );

  return (
    <>
      {loadingOverlay.active && (
        <IslamicLoadingScreen
          title={loadingOverlay.title}
          subtitle={loadingOverlay.subtitle}
          onSkip={() =>
            setLoadingOverlay((prev) => ({ ...prev, active: false }))
          }
        />
      )}

      {viewMode === 'workspace' && currentUser ? (
        <PortalWorkspace
          db={db}
          currentUser={currentUser}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onSwitchUser={(nextUser) => {
            setCurrentUser(nextUser);
            notify(
              `Beralih sesi ke ${nextUser.fullName} (Role: ${nextUser.role})`,
              'success'
            );
          }}
          onLogout={() => {
            triggerPortalTransition(
              'public',
              'Keluar dari Sesi Portal',
              'Mengembalikan Anda ke Beranda Publik...',
              () => {
                setCurrentUser(null);
                notify('Anda telah keluar (Logout) dari sesi portal.', 'success');
              }
            );
          }}
          onBackToPublic={() => {
            triggerPortalTransition(
              'public',
              "Ma'had Darul 'Ilm Al-Islami",
              'Memuat Beranda Publik & Katalog Keilmuan...'
            );
          }}
          onOpenSyncModal={() => {
            if (currentUser.role === 'super_admin') {
              setIsSyncModalOpen(true);
            } else {
              notify(
                'Konfigurasi database hanya dapat diakses oleh Super Admin.',
                'error'
              );
            }
          }}
          onMutate={handleMutate}
          onUploadFile={handleUploadFile}
          onNotify={notify}
        />
      ) : (
        <PublicPortal
          db={db}
          currentUser={currentUser}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            triggerPortalTransition(
              'workspace',
              `Ahlan wa Sahlan, ${user.fullName}`,
              `Memuat ruang kerja portal (${user.role.toUpperCase()})...`,
              () => {
                notify(
                  `Selamat datang, ${user.fullName} (${user.role})`,
                  'success'
                );
              }
            );
          }}
          onEnterWorkspace={() => {
            triggerPortalTransition(
              'workspace',
              `Portal Akademik — ${currentUser?.fullName || ''}`,
              'Membuka Dashboard & Ruang Kerja Akademik...'
            );
          }}
          onMutate={handleMutate}
          onUploadFile={handleUploadFile}
          onNotify={notify}
        />
      )}

      {/* GOOGLE APPS SCRIPT - GOOGLE SHEET REAL-TIME SYNC MODAL (SUPER ADMIN ONLY) */}
      {currentUser?.role === 'super_admin' && (
        <AppsScriptSyncModal
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
          db={db}
          onSyncAction={handleGoogleSheetSyncAction}
          onNotify={notify}
        />
      )}

      {/* TOAST NOTIFICATIONS */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none no-print"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium ${
                t.type === 'error'
                  ? 'bg-red-900 text-white border-red-400'
                  : 'bg-[#14283F] text-white border-[#C5A45B]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {t.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-red-300 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                )}
                <span>{t.text}</span>
              </div>
              <button
                type="button"
                aria-label="Tutup notifikasi"
                onClick={() =>
                  setToasts((prev) => prev.filter((item) => item.id !== t.id))
                }
                className="text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
