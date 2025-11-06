"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthManager = exports.OAuthManager = void 0;
const google_auth_library_1 = require("google-auth-library");
const oauth_app_1 = require("@octokit/oauth-app");
class GoogleOAuthProvider {
    constructor(clientId, clientSecret) {
        this.name = 'google';
        this.clientId = clientId;
        this.client = new google_auth_library_1.OAuth2Client(clientId, clientSecret);
    }
    getAuthUrl(redirectUri, state) {
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
    exchangeCodeForEmail(code) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { tokens } = yield this.client.getToken(code);
                if (!tokens.id_token) {
                    throw new Error('No ID token received');
                }
                const ticket = yield this.client.verifyIdToken({
                    idToken: tokens.id_token,
                    audience: this.clientId
                });
                const payload = ticket.getPayload();
                const email = payload === null || payload === void 0 ? void 0 : payload.email;
                if (!email) {
                    throw new Error('No email found in Google response');
                }
                return email.toLowerCase();
            }
            catch (error) {
                throw new Error(`Google OAuth failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
}
class GitHubOAuthProvider {
    constructor(clientId, clientSecret) {
        this.name = 'github';
        this.clientId = clientId;
        this.client = new oauth_app_1.OAuthApp({
            clientType: "oauth-app",
            clientId,
            clientSecret
        });
    }
    getAuthUrl(redirectUri, state) {
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
    exchangeCodeForEmail(code) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { authentication } = yield this.client.createToken({ code });
                const token = authentication.token;
                // Get user info
                const userResponse = yield fetch("https://api.github.com/user", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/vnd.github.v3+json",
                    },
                });
                if (!userResponse.ok) {
                    throw new Error('Failed to fetch user info from GitHub');
                }
                const userData = yield userResponse.json();
                let email = userData.email;
                // If no public email, fetch private emails
                if (!email) {
                    const emailResponse = yield fetch("https://api.github.com/user/emails", {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/vnd.github.v3+json",
                        },
                    });
                    if (emailResponse.ok) {
                        const emails = yield emailResponse.json();
                        const primaryEmail = emails.find((e) => e.primary && e.verified);
                        email = (primaryEmail === null || primaryEmail === void 0 ? void 0 : primaryEmail.email) || ((_a = emails.find((e) => e.verified)) === null || _a === void 0 ? void 0 : _a.email);
                    }
                }
                if (!email) {
                    throw new Error('No verified email found in GitHub account');
                }
                return email.toLowerCase();
            }
            catch (error) {
                throw new Error(`GitHub OAuth failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
}
// Future providers can be added here easily
// class LinkedInOAuthProvider implements OAuthProvider { ... }
// class MicrosoftOAuthProvider implements OAuthProvider { ... }
// class AppleOAuthProvider implements OAuthProvider { ... }
class OAuthManager {
    constructor() {
        this.providers = new Map();
        // Initialize providers from environment variables
        if (process.env.GOOGLE_AUTH_CLIENT_ID && process.env.GOOGLE_AUTH_CLIENT_SECRET) {
            this.providers.set('google', new GoogleOAuthProvider(process.env.GOOGLE_AUTH_CLIENT_ID, process.env.GOOGLE_AUTH_CLIENT_SECRET));
        }
        if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
            this.providers.set('github', new GitHubOAuthProvider(process.env.GITHUB_CLIENT_ID, process.env.GITHUB_CLIENT_SECRET));
        }
    }
    getProvider(name) {
        return this.providers.get(name);
    }
    getAvailableProviders() {
        return Array.from(this.providers.keys());
    }
    generateAuthUrl(provider, redirectUri, state) {
        const oauthProvider = this.getProvider(provider);
        if (!oauthProvider) {
            throw new Error(`OAuth provider '${provider}' not configured`);
        }
        return oauthProvider.getAuthUrl(redirectUri, state);
    }
    exchangeCodeForEmail(provider, code) {
        return __awaiter(this, void 0, void 0, function* () {
            const oauthProvider = this.getProvider(provider);
            if (!oauthProvider) {
                throw new Error(`OAuth provider '${provider}' not configured`);
            }
            return yield oauthProvider.exchangeCodeForEmail(code);
        });
    }
}
exports.OAuthManager = OAuthManager;
// Export singleton instance
exports.oauthManager = new OAuthManager();
