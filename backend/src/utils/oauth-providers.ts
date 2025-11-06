import { OAuthApp } from "@octokit/oauth-app";
import { OAuth2Client } from "google-auth-library";

export interface OAuthProvider {
  name: string;
  clientId: string;
  getAuthUrl(redirectUri: string, state?: string): string;
  exchangeCodeForEmail(code: string): Promise<string>;
}

class GoogleOAuthProvider implements OAuthProvider {
  name = 'google';
  clientId: string;
  private client: OAuth2Client;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.client = new OAuth2Client(clientId, clientSecret);
  }

  getAuthUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent'
    });

    if (state) {
      params.append('state', state);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async exchangeCodeForEmail(code: string): Promise<string> {
    try {
      const { tokens } = await this.client.getToken(code);
      
      if (!tokens.id_token) {
        throw new Error('No ID token received');
      }

      const ticket = await this.client.verifyIdToken({
        idToken: tokens.id_token,
        audience: this.clientId
      });

      const payload = ticket.getPayload();
      const email = payload?.email;

      if (!email) {
        throw new Error('No email found in Google response');
      }

      return email.toLowerCase();
    } catch (error) {
      throw new Error(`Google OAuth failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

class GitHubOAuthProvider implements OAuthProvider {
  name = 'github';
  clientId: string;
  private client: OAuthApp;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.client = new OAuthApp({
      clientType: "oauth-app",
      clientId,
      clientSecret
    });
  }

  getAuthUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: 'user:email',
      allow_signup: 'true'
    });

    if (state) {
      params.append('state', state);
    }

    return `https://github.com/login/oauth/authorize?${params}`;
  }

  async exchangeCodeForEmail(code: string): Promise<string> {
    try {
      const { authentication } = await this.client.createToken({ code });
      const token = authentication.token;

      // Get user info
      const userResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user info from GitHub');
      }

      const userData = await userResponse.json() as any;
      let email = userData.email;

      // If no public email, fetch private emails
      if (!email) {
        const emailResponse = await fetch("https://api.github.com/user/emails", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        });

        if (emailResponse.ok) {
          const emails = await emailResponse.json() as any[];
          const primaryEmail = emails.find((e: any) => e.primary && e.verified);
          email = primaryEmail?.email || emails.find((e: any) => e.verified)?.email;
        }
      }

      if (!email) {
        throw new Error('No verified email found in GitHub account');
      }

      return email.toLowerCase();
    } catch (error) {
      throw new Error(`GitHub OAuth failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Future providers can be added here easily
// class LinkedInOAuthProvider implements OAuthProvider { ... }
// class MicrosoftOAuthProvider implements OAuthProvider { ... }
// class AppleOAuthProvider implements OAuthProvider { ... }

export class OAuthManager {
  private providers: Map<string, OAuthProvider> = new Map();

  constructor() {
    // Initialize providers from environment variables
    if (process.env.GOOGLE_AUTH_CLIENT_ID && process.env.GOOGLE_AUTH_CLIENT_SECRET) {
      this.providers.set('google', new GoogleOAuthProvider(
        process.env.GOOGLE_AUTH_CLIENT_ID,
        process.env.GOOGLE_AUTH_CLIENT_SECRET
      ));
    }

    if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
      this.providers.set('github', new GitHubOAuthProvider(
        process.env.GITHUB_CLIENT_ID,
        process.env.GITHUB_CLIENT_SECRET
      ));
    }
  }

  getProvider(name: string): OAuthProvider | undefined {
    return this.providers.get(name);
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  generateAuthUrl(provider: string, redirectUri: string, state?: string): string {
    const oauthProvider = this.getProvider(provider);
    if (!oauthProvider) {
      throw new Error(`OAuth provider '${provider}' not configured`);
    }
    return oauthProvider.getAuthUrl(redirectUri, state);
  }

  async exchangeCodeForEmail(provider: string, code: string): Promise<string> {
    const oauthProvider = this.getProvider(provider);
    if (!oauthProvider) {
      throw new Error(`OAuth provider '${provider}' not configured`);
    }
    return await oauthProvider.exchangeCodeForEmail(code);
  }
}

// Export singleton instance
export const oauthManager = new OAuthManager();
