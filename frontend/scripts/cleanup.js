#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = path.resolve(process.cwd());

const targets = [
  // Legacy static HTML directory
  'old-html',
  // Legacy hybrid/vanilla modules (kept only if not referenced)
  'src/pages/dashboard.js',
  'src/pages/prescriptions.js',
  'src/pages/vitals.js',
  'src/pages/reports.js',
  'src/pages/emergency.js',
  'src/pages/profile.js',
  // Confirmed unused in React SPA (legacy or duplicated functionality)
  'components',
  'src/router.js',
  'src/navigation.js',
  'src/navigation-updater.js',
  'src/offline.js',
  'src/permissions.js',
  'src/voice-commands.js',
  'src/pwa-installer.js',
  'src/push-notifications.js',
  'src/ai-insights.js',
  'src/file-upload.js',
  'src/localization.js',
  'src/ui.js',
  'src/profile.js',
  'src/profile-clean.js',
  'src/auth.js',
  'src/api.js',
  'src/error-handler.js',
];

const rmrf = (p) => {
  const full = path.join(root, p);
  if (!fs.existsSync(full)) return;
  const stat = fs.lstatSync(full);
  if (stat.isDirectory()) {
    fs.rmSync(full, { recursive: true, force: true });
    console.log(`Removed directory: ${p}`);
  } else {
    fs.rmSync(full, { force: true });
    console.log(`Removed file: ${p}`);
  }
};

for (const t of targets) {
  rmrf(t);
}

console.log('Cleanup complete.');
