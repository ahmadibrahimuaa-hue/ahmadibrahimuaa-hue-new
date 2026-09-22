import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3000;

app.use(express.json());

const DATA_DIR = path.join(process.cwd(), 'server_data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');
const PROFILES_FILE = path.join(DATA_DIR, 'profiles.json');

// Ensure storage directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return defaultValue;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Health check for platform container monitoring
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Endpoints for cross-device student data sync
app.get('/api/submissions', (req, res) => {
  const submissions = readJsonFile(SUBMISSIONS_FILE, []);
  res.json(submissions);
});

app.post('/api/submissions', (req, res) => {
  const newSubmission = req.body;
  if (!newSubmission || !newSubmission.studentName) {
    return res.status(400).json({ error: 'بيانات غير مكتملة' });
  }
  const current = readJsonFile<any[]>(SUBMISSIONS_FILE, []);
  const updated = [newSubmission, ...current];
  writeJsonFile(SUBMISSIONS_FILE, updated);
  res.json({ success: true, submission: newSubmission });
});

app.delete('/api/submissions', (req, res) => {
  writeJsonFile(SUBMISSIONS_FILE, []);
  res.json({ success: true });
});

app.get('/api/students', (req, res) => {
  const profiles = readJsonFile(PROFILES_FILE, []);
  res.json(profiles);
});

app.post('/api/students', (req, res) => {
  const profile = req.body;
  if (!profile || !profile.name) {
    return res.status(400).json({ error: 'اسم الطالب مطلوب' });
  }
  const current = readJsonFile<any[]>(PROFILES_FILE, []);
  const updated = [profile, ...current.filter((p: any) => p.name !== profile.name)];
  writeJsonFile(PROFILES_FILE, updated);
  res.json({ success: true, profile });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
