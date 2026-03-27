/**
 * One-time setup script to obtain Google OAuth2 refresh token.
 *
 * Usage: yarn auth:google
 *
 * Opens your browser for Google consent, catches the callback on a
 * temporary local server, saves tokens to .google-tokens.json, and exits.
 */

import 'dotenv/config';
import { google } from 'googleapis';
import { createServer } from 'node:http';
import { URL } from 'node:url';
import { writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const TOKEN_PATH = new URL('../.google-tokens.json', import.meta.url).pathname;
const REDIRECT_URI = 'http://localhost:3100/auth/callback';
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env');
  process.exit(1);
}

if (existsSync(TOKEN_PATH)) {
  console.log('Token file already exists at .google-tokens.json');
  console.log('Delete it first if you want to re-authenticate.');
  process.exit(0);
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: SCOPES,
});

console.log('Opening browser for Google authorization...\n');

// Open browser (macOS/Linux/Windows)
const openCmd =
  process.platform === 'darwin' ? 'open' :
  process.platform === 'win32' ? 'start' : 'xdg-open';

try {
  execSync(`${openCmd} "${authUrl}"`);
} catch {
  console.log('Could not open browser automatically. Open this URL manually:\n');
  console.log(authUrl + '\n');
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url!, `http://localhost:3100`);

  if (url.pathname !== '/auth/callback') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    res.writeHead(400);
    res.end(`Authorization denied: ${error}`);
    console.error(`Authorization denied: ${error}`);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(400);
    res.end('Missing authorization code');
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Authentication successful!</h1><p>You can close this tab.</p>');

    console.log('Tokens saved to .google-tokens.json');
    console.log('You can now use the calendar agent.');

    server.close();
    process.exit(0);
  } catch (err) {
    res.writeHead(500);
    res.end('Failed to exchange authorization code');
    console.error('Token exchange failed:', err);
    server.close();
    process.exit(1);
  }
});

server.listen(3100, () => {
  console.log('Waiting for Google callback on http://localhost:3100/auth/callback ...\n');
});
