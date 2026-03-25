import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '../../../shared/module/config/index.js';

@Injectable()
export class GoogleAuthProvider {
  private oauth2Client: OAuth2Client;

  constructor(private readonly config: ConfigService) {
    const { clientId, clientSecret, refreshToken } = this.config.googleCalendar;

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret);

    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });
  }

  getAuthClient(): OAuth2Client {
    return this.oauth2Client;
  }

  async refreshToken(): Promise<void> {
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    this.oauth2Client.setCredentials(credentials);
  }
}
