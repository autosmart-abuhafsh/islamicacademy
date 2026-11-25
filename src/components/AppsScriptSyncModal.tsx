import React, { useState } from 'react';
import {
  Check,
  CloudUpload,
  Copy,
  Database,
  DownloadCloud,
  ExternalLink,
  FileCode2,
  RefreshCw,
  Smartphone,
  Monitor,
  Wrench,
  X,
} from 'lucide-react';
import { AcademyDatabase } from '../types/database';
import {
  DEFAULT_APPS_SCRIPT_WEB_APP_URL,
  generateGoogleAppsScriptCode,
  generateGoogleAppsScriptSetupCode,
  resolveAppsScriptWebAppUrl,
  VERCEL_ENV_APPS_SCRIPT_KEY,
} from '../utils/academicLogic';

interface AppsScriptSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  db: AcademyDatabase;
  onSyncAction: (params: {
    mode: 'PUSH' | 'PULL' | 'SAVE_CONFIG';
    appsScriptWebAppUrl: string;
    spreadsheetUrl: string;
  }) => Promise<void>;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export function AppsScriptSyncModal({
  isOpen,
  onClose,
  db,
  onSyncAction,
  onNotify,
}: AppsScriptSyncModalProps) {
  const syncCfg = db.settings.googleSheetSync;
  const resolvedDefaultUrl = resolveAppsScriptWebAppUrl(
    syncCfg.appsScriptWebAppUrl,
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined)
      : undefined
  );
  const [webAppUrl, setWebAppUrl] = useState(resolvedDefaultUrl);
  const [sheetUrl, setSheetUrl] = useState(syncCfg.spreadsheetUrl || '');
  const [activeTab, setActiveTab] = useState<'config' | 'code_gs' | 'setup_gs'>(
    'config'
  );
  const [copiedCodeGs, setCopiedCodeGs] = useState(false);
  const [copiedSetupGs, setCopiedSetupGs] = useState(false);
  const [copiedEnvKey, setCopiedEnvKey] = useState(false);
  const [copiedEnvVal, setCopiedEnvVal] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  if (!isOpen) return null;

  const codeGsContent = generateGoogleAppsScriptCode(db.settings.academyName);
  const setupGsContent = generateGoogleAppsScriptSetupCode(
    db.settings.academyName
  );

  const handleCopyCodeGs = () => {
    navigator.clipboard.writeText(codeGsContent);
    setCopiedCodeGs(true);
    onNotify('Kode File 1 (Code.gs) berhasil disalin!', 'success');
    setTimeout(() => setCopiedCodeGs(false), 2500);
  };

  const handleCopySetupGs = () => {
    navigator.clipboard.writeText(setupGsContent);
    setCopiedSetupGs(true);
    onNotify('Kode File 2 (Setup.gs) berhasil disalin!', 'success');
    setTimeout(() => setCopiedSetupGs(false), 2500);
  };

  const handleCopyEnvKey = () => {
    navigator.clipboard.writeText(VERCEL_ENV_APPS_SCRIPT_KEY);
    setCopiedEnvKey(true);
    onNotify('Nama Environment Variable (VITE_APPS_SCRIPT_URL) disalin!', 'success');
    setTimeout(() => setCopiedEnvKey(false), 2500);
  };

  const handleCopyEnvValue = () => {
    const val = webAppUrl.trim() || DEFAULT_APPS_SCRIPT_WEB_APP_URL;
    navigator.clipboard.writeText(val);
    setCopiedEnvVal(true);
    onNotify('Link Server Database Apps Script untuk Vercel berhasil disalin!', 'success');
    setTimeout(() => setCopiedEnvVal(false), 2500);
  };

  const handleRunSync = async (mode: 'PUSH' | 'PULL' | 'SAVE_CONFIG') => {
    setIsBusy(true);
    try {
      await onSyncAction({
        mode,
        appsScriptWebAppUrl: webAppUrl,
        spreadsheetUrl: sheetUrl,
      });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#14283F]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-modal-title"
    >
      <div className="bg-white border border-[#C5A45B]/40 rounded-xl max-w-3xl w-full overflow-hidden shadow-xl">
        {/* Modal Header */}
        <div className="bg-[#14283F] text-white px-6 py-4 flex items-center justify-between border-b border-[#C5A45B]/30">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-[#C5A45B]" />
            <div>
              <h2 id="sync-modal-title" className="text-base font-semibold">
                Sinkronisasi Real-Time Apps Script — Google Sheet (HP & PC)
              </h2>
              <p className="text-xs text-[#F5F0E4]/75">
                Revisi Database #{db.revision} · Terakhir diperbarui:{' '}
                <span className="font-mono-num">
                  {new Date(db.updatedAt).toLocaleString('id-ID')}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pengaturan sinkronisasi"
            className="p-1.5 rounded-lg text-[#F5F0E4]/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cross-Device Status Bar */}
        <div className="bg-[#F5F0E4] px-6 py-3 border-b border-[#14283F]/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-[#14283F]">
            <span className="flex items-center gap-1.5 font-medium">
              <Smartphone className="w-4 h-4 text-[#087451]" />
              Mobile (HP) Real-Time Sync
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1.5 font-medium">
              <Monitor className="w-4 h-4 text-[#087451]" />
              Desktop (PC) Real-Time Sync
            </span>
          </div>
          <div className="text-[#087451] font-medium">
            Status: {syncCfg.lastSyncStatus}
          </div>
        </div>

        {/* Navigation Tabs (3 Separated Tabs: Config, Code.gs, Setup.gs) */}
        <div className="px-6 pt-4 border-b border-[#14283F]/10 flex flex-wrap items-center gap-2 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'config'
                ? 'border-[#087451] text-[#087451]'
                : 'border-transparent text-[#14283F]/60 hover:text-[#14283F]'
            }`}
          >
            1. Koneksi Web App & Sinkronisasi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code_gs')}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'code_gs'
                ? 'border-[#087451] text-[#087451]'
                : 'border-transparent text-[#14283F]/60 hover:text-[#14283F]'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            2. File Utama (Code.gs)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('setup_gs')}
            className={`px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'setup_gs'
                ? 'border-[#087451] text-[#087451]'
                : 'border-transparent text-[#14283F]/60 hover:text-[#14283F]'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            3. File Inisialisasi (Setup.gs)
          </button>
        </div>

        {activeTab === 'config' && (
          <div className="p-6 space-y-5">
            {/* 1 Environment Variable for Vercel.app Card */}
            <div className="p-4 rounded-xl bg-[#087451]/10 border border-[#087451]/30 text-xs text-[#14283F] space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-[#087451]">
                  Deploy ke Vercel.app (Cukup 1 Environment Variable Saja)
                </p>
                <span className="px-2 py-0.5 rounded bg-[#087451] text-white text-[10px] font-semibold">
                  1 Env Var Setup
                </span>
              </div>
              <p className="text-[#14283F]/80 leading-relaxed">
                Saat melakukan deploy di <strong>vercel.app</strong> (menu <em>Project Settings &rarr; Environment Variables</em>), Anda cukup memasukkan <strong>1 Environment Variable</strong> berikut:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                <div className="sm:col-span-4 bg-white p-2.5 rounded-lg border border-[#14283F]/15 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="block text-[10px] text-[#14283F]/60 uppercase font-semibold">
                      Key / Name
                    </span>
                    <code className="text-xs font-bold text-[#14283F] font-mono-num truncate block">
                      {VERCEL_ENV_APPS_SCRIPT_KEY}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyEnvKey}
                    className="px-2.5 py-1.5 rounded bg-[#F5F0E4] hover:bg-[#C5A45B]/25 text-[#14283F] font-semibold text-[11px] flex items-center gap-1 shrink-0"
                  >
                    {copiedEnvKey ? <Check className="w-3.5 h-3.5 text-[#087451]" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedEnvKey ? 'Tersalin' : 'Salin Key'}
                  </button>
                </div>
                <div className="sm:col-span-8 bg-white p-2.5 rounded-lg border border-[#14283F]/15 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="block text-[10px] text-[#14283F]/60 uppercase font-semibold">
                      Value (Link Server Database Apps Script)
                    </span>
                    <code className="text-xs font-semibold text-[#087451] font-mono-num truncate block">
                      {webAppUrl.trim() || DEFAULT_APPS_SCRIPT_WEB_APP_URL}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyEnvValue}
                    className="px-2.5 py-1.5 rounded bg-[#087451] hover:bg-[#065d40] text-white font-semibold text-[11px] flex items-center gap-1 shrink-0"
                  >
                    {copiedEnvVal ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedEnvVal ? 'Tersalin' : 'Salin Value'}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="apps-script-url"
                  className="block text-xs font-semibold text-[#14283F] mb-1.5"
                >
                  Google Apps Script Web App URL (doGet & doPost Endpoint)
                </label>
                <input
                  id="apps-script-url"
                  type="url"
                  value={webAppUrl}
                  onChange={(e) => setWebAppUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#14283F]/20 focus:outline-none focus:border-[#087451] font-mono-num"
                />
                <p className="mt-1 text-[11px] text-[#14283F]/60">
                  Dapatkan URL ini setelah memasang Code.gs &amp; Setup.gs lalu melakukan Deploy &rarr; New Deployment &rarr; Web App (Access: Anyone).
                </p>
              </div>

              <div>
                <label
                  htmlFor="google-sheet-url"
                  className="block text-xs font-semibold text-[#14283F] mb-1.5"
                >
                  Tautan Google Spreadsheet (Opsional — untuk tombol buka cepat)
                </label>
                <div className="flex gap-2">
                  <input
                    id="google-sheet-url"
                    type="url"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="flex-1 px-3.5 py-2.5 text-sm rounded-lg border border-[#14283F]/20 focus:outline-none focus:border-[#087451]"
                  />
                  {sheetUrl && (
                    <a
                      href={sheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2.5 text-xs font-medium bg-[#F5F0E4] text-[#14283F] rounded-lg border border-[#14283F]/15 hover:bg-[#C5A45B]/20 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      Buka Sheet
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#F5F0E4]/40 border border-[#14283F]/10 text-xs flex items-center justify-between">
              <span className="text-[#14283F]/75">{syncCfg.lastSyncMessage}</span>
              <span className="font-mono-num text-[#14283F]/60">
                Rev #{db.revision}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#14283F]/10">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleRunSync('SAVE_CONFIG')}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#087451] hover:bg-[#065d40] rounded-lg transition-colors disabled:opacity-50"
              >
                Simpan Konfigurasi Sync
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleRunSync('PUSH')}
                  className="px-3.5 py-2 text-xs font-semibold text-[#14283F] bg-[#F5F0E4] hover:bg-[#C5A45B]/25 border border-[#C5A45B]/40 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isBusy ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CloudUpload className="w-3.5 h-3.5 text-[#087451]" />
                  )}
                  Push Data ke Google Sheet
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleRunSync('PULL')}
                  className="px-3.5 py-2 text-xs font-semibold text-[#14283F] bg-[#F5F0E4] hover:bg-[#C5A45B]/25 border border-[#C5A45B]/40 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <DownloadCloud className="w-3.5 h-3.5 text-[#14283F]" />
                  Pull Data dari Google Sheet
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'code_gs' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-[#14283F]">
                  File 1: Kode Utama Web App &amp; Real-Time Sync (Code.gs)
                </h3>
                <p className="text-xs text-[#14283F]/70">
                  Tempelkan kode ini pada file pertama bernama <code>Code.gs</code> di Google Apps Script untuk menangani API <code>doGet</code> dan <code>doPost</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyCodeGs}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#087451] hover:bg-[#065d40] rounded-lg flex items-center gap-1.5 shrink-0 transition-colors"
              >
                {copiedCodeGs ? (
                  <>
                    <Check className="w-4 h-4" />
                    Code.gs Tersalin
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Salin Kode Code.gs
                  </>
                )}
              </button>
            </div>

            <pre className="bg-[#14283F] text-[#F5F0E4] p-4 rounded-lg text-xs font-mono-num overflow-x-auto max-h-80 leading-relaxed">
              {codeGsContent}
            </pre>
          </div>
        )}

        {activeTab === 'setup_gs' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-[#14283F]">
                  File 2: Kode Inisialisasi &amp; Format 21 Tab Database (Setup.gs)
                </h3>
                <p className="text-xs text-[#14283F]/70">
                  Buat file script baru di Google Apps Script bernama <code>Setup.gs</code>, tempelkan kode ini, lalu jalankan fungsi <code>setupIslamicAcademyDatabase()</code>.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopySetupGs}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#087451] hover:bg-[#065d40] rounded-lg flex items-center gap-1.5 shrink-0 transition-colors"
              >
                {copiedSetupGs ? (
                  <>
                    <Check className="w-4 h-4" />
                    Setup.gs Tersalin
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Salin Kode Setup.gs
                  </>
                )}
              </button>
            </div>

            <pre className="bg-[#14283F] text-[#F5F0E4] p-4 rounded-lg text-xs font-mono-num overflow-x-auto max-h-80 leading-relaxed">
              {setupGsContent}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
