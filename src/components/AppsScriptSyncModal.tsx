import React, { useState } from 'react';
import {
  Check,
  CloudUpload,
  Copy,
  Database,
  DownloadCloud,
  ExternalLink,
  RefreshCw,
  Smartphone,
  Monitor,
  X,
} from 'lucide-react';
import { AcademyDatabase } from '../types/database';
import { generateGoogleAppsScriptCode } from '../utils/academicLogic';

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
  const [webAppUrl, setWebAppUrl] = useState(syncCfg.appsScriptWebAppUrl || '');
  const [sheetUrl, setSheetUrl] = useState(syncCfg.spreadsheetUrl || '');
  const [activeTab, setActiveTab] = useState<'config' | 'script'>('config');
  const [copied, setCopied] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  if (!isOpen) return null;

  const scriptCode = generateGoogleAppsScriptCode(db.settings.academyName);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    onNotify('Kode Google Apps Script (Code.gs) berhasil disalin!', 'success');
    setTimeout(() => setCopied(false), 2500);
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

        {/* Navigation Tabs */}
        <div className="px-6 pt-4 border-b border-[#14283F]/10 flex items-center gap-2 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'config'
                ? 'border-[#087451] text-[#087451]'
                : 'border-transparent text-[#14283F]/60 hover:text-[#14283F]'
            }`}
          >
            1. Koneksi Web App & Sinkronisasi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('script')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'script'
                ? 'border-[#087451] text-[#087451]'
                : 'border-transparent text-[#14283F]/60 hover:text-[#14283F]'
            }`}
          >
            2. Kode Google Apps Script (Code.gs)
          </button>
        </div>

        {activeTab === 'config' ? (
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-lg bg-[#F5F0E4]/60 border border-[#C5A45B]/30 text-xs text-[#14283F] space-y-1.5">
              <p className="font-semibold text-[#14283F]">
                Arsitektur Sinkronisasi Otomatis Dual-Engine (Server SSE + Google Sheets Apps Script)
              </p>
              <p className="text-[#14283F]/80 leading-relaxed">
                Setiap perubahan data (Santri, Pengajar, Program, Kelas, LMS, 9 Silsilah Kitab, Fatwa, dan Pendaftaran) otomatis tersimpan di server terpusat dan disiarkan secara real-time ke seluruh perangkat HP maupun PC. Jika Anda menghubungkan URL Web App Google Apps Script di bawah ini, seluruh tabel juga otomatis disinkronkan ke 21 tab Google Sheets Anda.
              </p>
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
                  Dapatkan URL ini setelah melakukan Deploy &rarr; New Deployment &rarr; Web App (Access: Anyone) di editor Google Apps Script.
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
        ) : (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-[#14283F]">
                  Kode Lengkap Google Apps Script (Code.gs)
                </h3>
                <p className="text-xs text-[#14283F]/70">
                  Otomatis membuat 21 Tab Sheet terstruktur (Users, Students, Teachers, Programs, Classes, Books, Fatwas, dll.) dan menangani sinkronisasi JSON dua arah.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#087451] hover:bg-[#065d40] rounded-lg flex items-center gap-1.5 shrink-0 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Tersalin
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
              {scriptCode}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
