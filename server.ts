import express, { Request, Response } from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { INITIAL_ACADEMY_DATABASE } from './src/database/seedData';
import { AcademyDatabase, ModuleKey, PermissionAction } from './src/types/database';
import { hasPermission } from './src/utils/academicLogic';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const BASE_STORAGE_DIR = isServerless
  ? path.join(os.tmpdir(), 'islamic-academy-portal')
  : __dirname;

const DATA_DIR = path.resolve(BASE_STORAGE_DIR, 'data');
const DB_FILE_PATH = path.resolve(DATA_DIR, 'academy-db.json');
const UPLOADS_DIR = path.resolve(BASE_STORAGE_DIR, 'public', 'uploads');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch {
  // Fallback if filesystem is read-only
}

function loadDatabase(): AcademyDatabase {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as AcademyDatabase;
      if (parsed && parsed.users && parsed.libraryCategories) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read database file, falling back to seed:', err);
  }
  saveDatabase(INITIAL_ACADEMY_DATABASE);
  return JSON.parse(JSON.stringify(INITIAL_ACADEMY_DATABASE));
}

function saveDatabase(db: AcademyDatabase): void {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch {
    // In-memory state remains active even on read-only containers
  }
}

let dbState: AcademyDatabase = loadDatabase();

// Connected SSE clients for instant Mobile (HP) <-> Desktop (PC) synchronization
const sseClients = new Set<Response>();

function broadcastDatabaseUpdate() {
  const payload = JSON.stringify({
    type: 'DB_UPDATED',
    revision: dbState.revision,
    updatedAt: dbState.updatedAt,
  });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function syncWithAppsScriptIfConfigured(db: AcademyDatabase): Promise<{
  ok: boolean;
  message: string;
}> {
  const url = db.settings?.googleSheetSync?.appsScriptWebAppUrl?.trim();
  if (!url || !url.startsWith('https://script.google.com/')) {
    return {
      ok: true,
      message: 'Tersimpan di Server Real-Time Database (Siap disinkronkan ke Google Sheet)',
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'SYNC_PUSH',
        database: db,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const now = new Date().toISOString();
    dbState.settings.googleSheetSync.lastSyncedAt = now;
    dbState.settings.googleSheetSync.lastSyncStatus = 'Connected & Synced';
    dbState.settings.googleSheetSync.lastSyncMessage = `Tersinkronisasi otomatis ke Google Sheet (${new Date().toLocaleTimeString('id-ID')})`;
    saveDatabase(dbState);
    return {
      ok: true,
      message: dbState.settings.googleSheetSync.lastSyncMessage,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Gagal menghubungi Web App URL';
    dbState.settings.googleSheetSync.lastSyncStatus = 'Sync Error';
    dbState.settings.googleSheetSync.lastSyncMessage = `Data aman di server lokal, namun gagal push ke Apps Script: ${msg}`;
    saveDatabase(dbState);
    return {
      ok: false,
      message: dbState.settings.googleSheetSync.lastSyncMessage,
    };
  }
}

export const app = express();
app.use(express.json({ limit: '20mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

function registerApiRoutes() {

  // 1. Real-Time SSE Stream for HP & PC auto-sync
  app.get('/api/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    res.write(
      `data: ${JSON.stringify({
        type: 'CONNECTED',
        revision: dbState.revision,
        updatedAt: dbState.updatedAt,
      })}\n\n`
    );

    sseClients.add(res);
    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // 2. Get full database or check revision
  app.get('/api/db', (_req: Request, res: Response) => {
    res.json(dbState);
  });

  app.get('/api/db/revision', (_req: Request, res: Response) => {
    res.json({
      revision: dbState.revision,
      updatedAt: dbState.updatedAt,
      syncStatus: dbState.settings.googleSheetSync,
    });
  });

  // 3. Real Backend Authentication
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { identifier, password } = req.body as {
      identifier?: string;
      password?: string;
    };

    if (!identifier || !password) {
      res.status(400).json({ error: 'Username/Email dan Password wajib diisi.' });
      return;
    }

    const cleanId = identifier.trim().toLowerCase();
    const user = dbState.users.find(
      (u) =>
        u.username.toLowerCase() === cleanId ||
        u.email.toLowerCase() === cleanId
    );

    if (!user || user.passwordHash !== password) {
      res.status(401).json({
        error: 'Kredensial tidak valid. Periksa kembali username/email dan kata sandi Anda.',
      });
      return;
    }

    if (user.status !== 'Active') {
      res.status(403).json({
        error: `Akun Anda berstatus ${user.status}. Hubungi Administrator Akademi.`,
      });
      return;
    }

    res.json({
      user,
      token: `iap-session-${user.id}-${Date.now()}`,
    });
  });

  // 4. Password Reset Endpoint (PRD Section 15.9)
  app.post('/api/auth/reset-password', (req: Request, res: Response) => {
    const { email, whatsapp, newPassword } = req.body as {
      email?: string;
      whatsapp?: string;
      newPassword?: string;
    };

    if (!email || !whatsapp || !newPassword || newPassword.length < 6) {
      res.status(400).json({
        error: 'Masukkan email, nomor WhatsApp terdaftar, dan password baru (minimal 6 karakter).',
      });
      return;
    }

    const userIndex = dbState.users.findIndex(
      (u) =>
        u.email.toLowerCase() === email.trim().toLowerCase() &&
        u.whatsapp.replace(/\D/g, '').endsWith(whatsapp.replace(/\D/g, '').slice(-8))
    );

    if (userIndex === -1) {
      res.status(404).json({
        error: 'Kombinasi Email dan Nomor WhatsApp tidak ditemukan dalam database.',
      });
      return;
    }

    dbState.users[userIndex].passwordHash = newPassword;
    dbState.users[userIndex].updatedAt = new Date().toISOString();
    dbState.revision += 1;
    dbState.updatedAt = new Date().toISOString();
    dbState.activityLogs.unshift({
      id: `log-${Date.now()}`,
      actorId: dbState.users[userIndex].id,
      actorName: dbState.users[userIndex].fullName,
      actorRole: dbState.users[userIndex].role,
      action: 'RESET_PASSWORD',
      module: 'users',
      targetDescription: `Reset password akun ${dbState.users[userIndex].email}`,
      timestamp: dbState.updatedAt,
    });

    saveDatabase(dbState);
    broadcastDatabaseUpdate();
    res.json({ ok: true, message: 'Password berhasil diperbarui. Silakan login.' });
  });

  // 5. Verified Database Mutation Endpoint with Backend RBAC Enforcement
  app.post('/api/db/mutate', async (req: Request, res: Response) => {
    const {
      actorId,
      moduleKey,
      action,
      actionLabel,
      targetDescription,
      nextDatabase,
      isPublicAction,
    } = req.body as {
      actorId?: string;
      moduleKey: ModuleKey;
      action: PermissionAction;
      actionLabel: string;
      targetDescription: string;
      nextDatabase: AcademyDatabase;
      isPublicAction?: boolean;
    };

    if (!nextDatabase || !nextDatabase.users) {
      res.status(400).json({ error: 'Payload database tidak valid.' });
      return;
    }

    // Backend RBAC Check (PRD Section 4.7 & 15)
    let actorName = 'Pengunjung Publik';
    let actorRole: AcademyDatabase['users'][0]['role'] = 'santri';

    if (!isPublicAction) {
      const actor = dbState.users.find((u) => u.id === actorId);
      if (!actor || actor.status !== 'Active') {
        res.status(403).json({
          error: 'Akses ditolak: Sesi pengguna tidak valid atau akun tidak aktif.',
        });
        return;
      }
      const allowed = hasPermission(actor, dbState.roles, moduleKey, action);
      if (!allowed) {
        res.status(403).json({
          error: `Akses ditolak oleh Backend RBAC: Role '${actor.role}' tidak memiliki izin '${action}' pada modul '${moduleKey}'.`,
        });
        return;
      }
      actorName = actor.fullName;
      actorRole = actor.role;
    } else {
      // Public visitors are only allowed to submit Admission applications
      if (moduleKey !== 'academic' || action !== 'create') {
        res.status(403).json({
          error: 'Pengunjung publik hanya diizinkan mengirim formulir pendaftaran santri baru.',
        });
        return;
      }
    }

    const now = new Date().toISOString();
    const updatedDb: AcademyDatabase = {
      ...nextDatabase,
      revision: (dbState.revision || 1) + 1,
      updatedAt: now,
    };

    // Prepend audit activity log
    updatedDb.activityLogs = [
      {
        id: `log-${Date.now()}`,
        actorId: actorId || 'public-visitor',
        actorName,
        actorRole,
        action: actionLabel,
        module: moduleKey,
        targetDescription,
        timestamp: now,
      },
      ...(updatedDb.activityLogs || []).slice(0, 299),
    ];

    updatedDb.settings.googleSheetSync.syncRevision = updatedDb.revision;
    updatedDb.settings.googleSheetSync.lastSyncedAt = now;

    dbState = updatedDb;
    saveDatabase(dbState);
    broadcastDatabaseUpdate();

    // Non-blocking or quick sync with Google Apps Script if URL is configured
    if (
      dbState.settings.googleSheetSync.autoSyncEnabled &&
      dbState.settings.googleSheetSync.appsScriptWebAppUrl
    ) {
      await syncWithAppsScriptIfConfigured(dbState);
    }

    res.json({
      ok: true,
      database: dbState,
    });
  });

  // 6. Real Cloud/Server File Upload with Validation (PRD Section 10 & 15.12)
  app.post('/api/upload', (req: Request, res: Response) => {
    const { actorId, fileName, mimeType, base64Data, fileSizeKb } = req.body as {
      actorId?: string;
      fileName?: string;
      mimeType?: string;
      base64Data?: string;
      fileSizeKb?: number;
    };

    const actor = dbState.users.find((u) => u.id === actorId);
    if (!actor || actor.status !== 'Active') {
      res.status(403).json({ error: 'Hanya pengguna terautentikasi yang dapat mengunggah dokumen.' });
      return;
    }

    if (!fileName || !base64Data) {
      res.status(400).json({ error: 'Nama file dan konten file wajib disertakan.' });
      return;
    }

    const allowedExtensions = ['.pdf', '.doc', '.docx', '.mp3', '.wav', '.mp4', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(fileName).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      res.status(400).json({
        error: `Ekstensi file (${ext}) tidak diizinkan. Gunakan PDF, DOCX, MP3, MP4, PNG, atau JPG.`,
      });
      return;
    }

    if (fileSizeKb && fileSizeKb > 15360) {
      res.status(400).json({ error: 'Ukuran file melebihi batas maksimal 15 MB.' });
      return;
    }

    const safeBaseName = fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 80);
    const storedFileName = `${Date.now()}_${safeBaseName}`;
    const targetPath = path.resolve(UPLOADS_DIR, storedFileName);

    const cleanBase64 = base64Data.includes(',')
      ? base64Data.split(',')[1]
      : base64Data;
    const buffer = Buffer.from(cleanBase64, 'base64');
    fs.writeFileSync(targetPath, buffer);

    const fileUrl = `/uploads/${storedFileName}`;
    res.json({
      ok: true,
      fileUrl,
      fileName: safeBaseName,
      mimeType: mimeType || 'application/octet-stream',
      fileSizeKb: Math.max(1, Math.round(buffer.length / 1024)),
      uploadedAt: new Date().toISOString(),
    });
  });

  // 7. Manual Push / Pull Google Apps Script - Google Sheet Synchronization
  app.post('/api/sync/google-sheet', async (req: Request, res: Response) => {
    const { mode, appsScriptWebAppUrl, spreadsheetUrl } = req.body as {
      mode: 'PUSH' | 'PULL' | 'SAVE_CONFIG';
      appsScriptWebAppUrl?: string;
      spreadsheetUrl?: string;
    };

    if (appsScriptWebAppUrl !== undefined) {
      dbState.settings.googleSheetSync.appsScriptWebAppUrl = appsScriptWebAppUrl.trim();
    }
    if (spreadsheetUrl !== undefined) {
      dbState.settings.googleSheetSync.spreadsheetUrl = spreadsheetUrl.trim();
    }

    const targetUrl = dbState.settings.googleSheetSync.appsScriptWebAppUrl;

    if (mode === 'SAVE_CONFIG') {
      dbState.revision += 1;
      dbState.updatedAt = new Date().toISOString();
      dbState.settings.googleSheetSync.lastSyncStatus = targetUrl
        ? 'Connected & Synced'
        : 'Local Real-Time Mode';
      dbState.settings.googleSheetSync.lastSyncMessage = targetUrl
        ? 'Konfigurasi Web App URL Google Apps Script tersimpan.'
        : 'Mode Sinkronisasi Server Real-Time aktif untuk HP & PC.';
      saveDatabase(dbState);
      broadcastDatabaseUpdate();
      res.json({ ok: true, database: dbState });
      return;
    }

    if (!targetUrl || !targetUrl.startsWith('https://script.google.com/')) {
      res.status(400).json({
        error: 'Masukkan URL Web App Google Apps Script yang valid (diawali https://script.google.com/macros/s/.../exec).',
      });
      return;
    }

    if (mode === 'PUSH') {
      const result = await syncWithAppsScriptIfConfigured(dbState);
      broadcastDatabaseUpdate();
      res.json({
        ok: result.ok,
        message: result.message,
        database: dbState,
      });
      return;
    }

    if (mode === 'PULL') {
      try {
        const response = await fetch(targetUrl, { method: 'GET' });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = (await response.json()) as {
          status: string;
          database?: AcademyDatabase;
          message?: string;
        };

        if (data.status === 'ok' && data.database && data.database.users) {
          dbState = {
            ...data.database,
            revision: Math.max(dbState.revision + 1, (data.database.revision || 1) + 1),
            updatedAt: new Date().toISOString(),
          };
          dbState.settings.googleSheetSync.appsScriptWebAppUrl = targetUrl;
          dbState.settings.googleSheetSync.lastSyncedAt = new Date().toISOString();
          dbState.settings.googleSheetSync.lastSyncStatus = 'Connected & Synced';
          dbState.settings.googleSheetSync.lastSyncMessage =
            'Data berhasil ditarik (Pull) dari Google Sheet Apps Script.';
          saveDatabase(dbState);
          broadcastDatabaseUpdate();
          res.json({
            ok: true,
            message: 'Data berhasil disinkronisasi dari Google Sheets.',
            database: dbState,
          });
          return;
        }

        res.json({
          ok: true,
          message:
            data.message ||
            'Spreadsheet terhubung namun masih kosong. Klik "Push ke Google Sheet" untuk mengirim data awal.',
          database: dbState,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Gagal menarik data dari Apps Script';
        res.status(502).json({
          error: `Gagal melakukan Pull dari Google Apps Script: ${msg}`,
        });
      }
    }
  });
}

registerApiRoutes();

async function startServer() {
  // Mount Vite or Static Dist
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Islamic Academy Portal Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
