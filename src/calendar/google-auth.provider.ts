import { google, type Auth } from 'googleapis';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { type Config } from '../lib/config.ts';

const TOKEN_PATH = resolve(process.cwd(), '.google-tokens.json');
const REDIRECT_URI = 'http://localhost:3100/auth/callback';

export class GoogleAuthProvider {
  private readonly config: Config;
  private oauth2Client: Auth.OAuth2Client;

  constructor(config: Config) {
    this.config = config;
    const { clientId, clientSecret } = this.config.googleCalendar;

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      REDIRECT_URI,
    );

    this.loadTokens();
    this.setupAutoRefresh();
  }

  getAuthClient(): Auth.OAuth2Client {
    return this.oauth2Client;
  }

  private loadTokens() {
    if (!existsSync(TOKEN_PATH)) {
      console.warn(
        '[GoogleAuthProvider] No .google-tokens.json found. Run "yarn auth:google" to authenticate.',
      );
      return;
    }

    const tokens = JSON.parse(readFileSync(TOKEN_PATH, 'utf-8'));
    this.oauth2Client.setCredentials(tokens);
    console.log('[GoogleAuthProvider] Google OAuth tokens loaded.');
  }

  private setupAutoRefresh() {
    this.oauth2Client.on('tokens', (tokens) => {
      if (!existsSync(TOKEN_PATH)) return;

      const stored = JSON.parse(readFileSync(TOKEN_PATH, 'utf-8'));
      const updated = { ...stored, ...tokens };
      writeFileSync(TOKEN_PATH, JSON.stringify(updated, null, 2));
      console.log('[GoogleAuthProvider] Google OAuth tokens refreshed and saved.');
    });
  }
}
