import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const PORT = Number(process.env.PORT) || 3000;
const MAX_VIDEO_BYTES = 150 * 1024 * 1024; // 150 MB
const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads', 'videos');
const DIST_ROOT = path.resolve(process.cwd(), 'dist');

function readFirebaseApiKey(): string {
  try {
    const raw = fs.readFileSync(
      path.resolve(process.cwd(), 'firebase-applet-config.json'),
      'utf8'
    );
    const parsed = JSON.parse(raw) as { apiKey?: string };
    return typeof parsed.apiKey === 'string' ? parsed.apiKey : '';
  } catch {
    return '';
  }
}

async function verifyFirebaseIdToken(
  idToken: string
): Promise<{ uid: string; email: string } | null> {
  const apiKey = readFirebaseApiKey();
  if (!apiKey || !idToken) return null;
  try {
    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!resp.ok) return null;
    const data = (await resp.json()) as {
      users?: Array<{
        localId?: string;
        email?: string;
        emailVerified?: boolean;
      }>;
    };
    const user = data.users?.[0];
    if (!user || !user.localId || !user.email || !user.emailVerified) {
      return null;
    }
    return { uid: user.localId, email: user.email };
  } catch {
    return null;
  }
}

function sanitizeMp4Filename(rawName: string): string {
  const base = path.basename(rawName || 'materi.mp4');
  const withoutExt = base.replace(/\.mp4$/i, '');
  const safeSlug =
    withoutExt
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'materi';
  return `${safeSlug}-${Date.now()}.mp4`;
}

function isLikelyMp4Header(chunk: Buffer): boolean {
  if (chunk.length < 12) return false;
  // ISO Base Media File Format (MP4) typically has 'ftyp' box marker at bytes 4..8
  const boxType = chunk.subarray(4, 8).toString('ascii');
  if (boxType === 'ftyp' || boxType === 'moov' || boxType === 'mdat' || boxType === 'wide' || boxType === 'free') {
    return true;
  }
  return false;
}

async function startServer() {
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true });

  const app = express();

  // Serve uploaded MP4 files with HTTP Range support for seeking/scrubbing
  app.use(
    '/uploads/videos',
    express.static(UPLOADS_ROOT, {
      acceptRanges: true,
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        if (filePath.toLowerCase().endsWith('.mp4')) {
          res.setHeader('Content-Type', 'video/mp4');
        }
      },
    })
  );

  app.post('/api/upload-video', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization ?? '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : '';
    const verifiedUser = await verifyFirebaseIdToken(token);
    if (!verifiedUser) {
      res.status(401).json({
        error: 'Autentikasi Firebase terverifikasi diperlukan untuk mengunggah video.',
      });
      return;
    }

    const rawFilename = String(req.headers['x-filename'] ?? 'materi.mp4');
    const contentType = String(req.headers['content-type'] ?? '').toLowerCase();
    const isMp4Extension = rawFilename.toLowerCase().endsWith('.mp4');
    const isAllowedMime =
      contentType.includes('video/mp4') ||
      contentType.includes('application/octet-stream') ||
      contentType === '';

    if (!isMp4Extension || !isAllowedMime) {
      res.status(400).json({
        error: 'Format video harus berupa file .mp4 (video/mp4).',
      });
      return;
    }

    const contentLengthHeader = Number(req.headers['content-length'] ?? 0);
    if (contentLengthHeader > MAX_VIDEO_BYTES) {
      res.status(413).json({
        error: 'Ukuran file MP4 melebihi batas maksimal 150 MB.',
      });
      return;
    }

    const savedFilename = sanitizeMp4Filename(rawFilename);
    const destPath = path.join(UPLOADS_ROOT, savedFilename);

    let totalBytes = 0;
    let headerChecked = false;
    let aborted = false;
    const writeStream = fs.createWriteStream(destPath);

    const cleanupFile = () => {
      writeStream.destroy();
      if (fs.existsSync(destPath)) {
        fs.unlink(destPath, () => undefined);
      }
    };

    req.on('data', (chunk: Buffer) => {
      if (aborted) return;
      if (!headerChecked) {
        headerChecked = true;
        if (chunk.length >= 12 && !isLikelyMp4Header(chunk)) {
          aborted = true;
          cleanupFile();
          res.status(400).json({
            error: 'Header file tidak dikenali sebagai kontainer video MP4 yang valid.',
          });
          req.destroy();
          return;
        }
      }

      totalBytes += chunk.length;
      if (totalBytes > MAX_VIDEO_BYTES) {
        aborted = true;
        cleanupFile();
        res.status(413).json({
          error: 'Ukuran file MP4 melebihi batas maksimal 150 MB.',
        });
        req.destroy();
        return;
      }

      writeStream.write(chunk);
    });

    req.on('end', () => {
      if (aborted) return;
      if (totalBytes === 0) {
        cleanupFile();
        res.status(400).json({ error: 'File MP4 kosong.' });
        return;
      }
      writeStream.end(() => {
        res.status(200).json({
          url: `/uploads/videos/${savedFilename}`,
          fileName: savedFilename,
          sizeBytes: totalBytes,
        });
      });
    });

    req.on('error', () => {
      if (aborted) return;
      aborted = true;
      cleanupFile();
      if (!res.headersSent) {
        res.status(500).json({ error: 'Gagal menerima unggahan video MP4.' });
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(DIST_ROOT)) {
    app.use(express.static(DIST_ROOT));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(DIST_ROOT, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
