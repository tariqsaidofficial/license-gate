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
exports.resetPassword = exports.requestPasswordReset = exports.verifyMailToken = exports.signUpWithPassword = exports.loginWithPassword = exports.loginWithGitHub = exports.loginWithGoogle = exports.authExpressMiddleware = void 0;
const oauth_app_1 = require("@octokit/oauth-app");
const google_auth_library_1 = require("google-auth-library");
const prisma_1 = require("../prisma");
const ShowError_1 = require("../utils/ShowError");
const authenticator_1 = require("../utils/authenticator");
const mailer_1 = require("../utils/mailer");
const nanoid_1 = require("../utils/nanoid");
const googleOAuth = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_AUTH_CLIENT_ID);
const githubOAuth = new oauth_app_1.OAuthApp({
    clientType: "oauth-app",
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
});
const authenticator = new authenticator_1.Authenticator(process.env.JWT_SECRET);
function refreshSessionExtractor(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = yield prisma_1.prisma.user.findUnique({
            where: {
                id: userId,
            },
        });
        if (!user)
            return null;
        return user.refreshSession;
    });
}
function authExpressMiddleware(req, res, next) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.accessToken;
        if (!token)
            return next();
        const verifyResult = authenticator.verifyAccessToken(token);
        if (verifyResult.success) {
            req.userId = verifyResult.data.userId;
            return next();
        }
        // Try to refresh token
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken)
            return next();
        const refreshResults = yield authenticator.refreshAccessToken(refreshToken, ({ userId }) => refreshSessionExtractor(userId));
        if (refreshResults.success) {
            const { accessToken, data } = refreshResults.data;
            res.cookie("accessToken", accessToken, {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
            });
            req.userId = data.userId;
        }
        next();
    });
}
exports.authExpressMiddleware = authExpressMiddleware;
function fetchEmailFromGoogleToken(token) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield googleOAuth
            .verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_AUTH_CLIENT_ID,
        })
            .catch(() => {
            throw new ShowError_1.ShowError("Google authentication failed.", "google-auth-error");
        });
        const payload = res.getPayload();
        if (!payload)
            throw new ShowError_1.ShowError("Google authentication failed.", "google-auth-error");
        const email = (_a = payload.email) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        if (!email)
            throw new ShowError_1.ShowError("Google authentication failed.", "google-auth-error");
        return email;
    });
}
function fetchEmailFromGitHubToken(code) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Exchange code for access token
            const { authentication } = yield githubOAuth.createToken({ code });
            const token = authentication.token;
            // Get user info from GitHub API
            const response = yield fetch("https://api.github.com/user", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/vnd.github.v3+json",
                },
            });
            if (!response.ok) {
                throw new ShowError_1.ShowError("GitHub authentication failed.", "github-auth-error");
            }
            const userData = yield response.json();
            // GitHub user might not have a public email, so we need to fetch emails separately
            let email = userData.email;
            if (!email) {
                const emailResponse = yield fetch("https://api.github.com/user/emails", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/vnd.github.v3+json",
                    },
                });
                if (emailResponse.ok) {
                    const emails = yield emailResponse.json();
                    // Find primary email or first verified email
                    const primaryEmail = emails.find((e) => e.primary && e.verified);
                    email = (primaryEmail === null || primaryEmail === void 0 ? void 0 : primaryEmail.email) || ((_a = emails.find((e) => e.verified)) === null || _a === void 0 ? void 0 : _a.email);
                }
            }
            if (!email) {
                throw new ShowError_1.ShowError("GitHub authentication failed - no verified email found.", "github-auth-error");
            }
            return email.toLowerCase();
        }
        catch (error) {
            if (error instanceof ShowError_1.ShowError)
                throw error;
            throw new ShowError_1.ShowError("GitHub authentication failed.", "github-auth-error");
        }
    });
}
function updateUserRefreshSession(userId, refreshSession) {
    return __awaiter(this, void 0, void 0, function* () {
        yield prisma_1.prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                refreshSession,
            },
        });
    });
}
function loginWithGoogle(token, createAccountIfNotFound, marketingEmails, langCode) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const email = yield fetchEmailFromGoogleToken(token);
        let user = yield prisma_1.prisma.user.findUnique({
            where: {
                email,
            },
            select: {
                id: true,
                userID: true,
                email: true,
                isEmailVerified: true,
                refreshSession: true
            }
        });
        if (!user) {
            if (!createAccountIfNotFound)
                throw new ShowError_1.ShowError("There is no account linked to this email address. Please sign up.", "no-account-for-google-email");
            user = yield createUser(email, null, true, marketingEmails !== null && marketingEmails !== void 0 ? marketingEmails : false);
        }
        const { accessToken, refreshSession, refreshToken } = authenticator.directLogin({ userId: user.id }, (_a = user.refreshSession) !== null && _a !== void 0 ? _a : undefined);
        if (!user.refreshSession) {
            yield updateUserRefreshSession(user.id, refreshSession);
        }
        return { accessToken, refreshToken, userId: user.userID, email };
    });
}
exports.loginWithGoogle = loginWithGoogle;
function loginWithGitHub(code, createAccountIfNotFound, marketingEmails) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const email = yield fetchEmailFromGitHubToken(code);
        let user = yield prisma_1.prisma.user.findUnique({
            where: {
                email,
            },
            select: {
                id: true,
                userID: true,
                email: true,
                isEmailVerified: true,
                refreshSession: true
            }
        });
        if (!user) {
            if (!createAccountIfNotFound)
                throw new ShowError_1.ShowError("There is no account linked to this email address. Please sign up.", "no-account-for-github-email");
            user = yield createUser(email, null, true, marketingEmails !== null && marketingEmails !== void 0 ? marketingEmails : false);
        }
        const { accessToken, refreshSession, refreshToken } = authenticator.directLogin({ userId: user.id }, (_a = user.refreshSession) !== null && _a !== void 0 ? _a : undefined);
        if (!user.refreshSession) {
            yield updateUserRefreshSession(user.id, refreshSession);
        }
        return { accessToken, refreshToken, userId: user.userID, email };
    });
}
exports.loginWithGitHub = loginWithGitHub;
function loginWithPassword(email, password) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        email = email.toLowerCase();
        const user = yield prisma_1.prisma.user.findUnique({
            where: {
                email,
            },
            select: {
                id: true,
                userID: true,
                email: true,
                isEmailVerified: true,
                passwordHash: true,
                refreshSession: true
            }
        });
        if (!user)
            throw new ShowError_1.ShowError("Invalid email or password.", "unauthorized");
        if (!user.isEmailVerified)
            throw new ShowError_1.ShowError("Your email address has not been verified.", "unauthorized");
        if (!user.passwordHash)
            throw new ShowError_1.ShowError("Please use the Google login for this account.", "unauthorized");
        const { success, data } = yield authenticator.loginWithPassword(user.passwordHash, password, { userId: user.id }, (_a = user.refreshSession) !== null && _a !== void 0 ? _a : undefined);
        if (!success)
            throw new ShowError_1.ShowError("Invalid email or password.", "unauthorized");
        if (!user.refreshSession) {
            yield updateUserRefreshSession(user.id, data.refreshSession);
        }
        return {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            userId: user.userID,
        };
    });
}
exports.loginWithPassword = loginWithPassword;
function signUpWithPassword(email, password, marketingEmails) {
    return __awaiter(this, void 0, void 0, function* () {
        email = email.toLowerCase();
        yield createUser(email, password, false, marketingEmails);
        const mailToken = authenticator.generateMailToken(email);
        const verifyUrl = `${process.env.SIGN_IN_URL}?token=${encodeURIComponent(mailToken)}&email=${encodeURIComponent(email)}`;
        yield (0, mailer_1.sendMail)(email, "Verify your email", "verify-email", {
            url: verifyUrl,
        });
    });
}
exports.signUpWithPassword = signUpWithPassword;
function verifyMailToken(token, email) {
    return __awaiter(this, void 0, void 0, function* () {
        email = email.toLowerCase();
        const isValid = authenticator.verifyMailToken(token, email);
        if (!isValid)
            throw new ShowError_1.ShowError("This link is expired or invalid.", "invalid-token");
        yield prisma_1.prisma.user.update({
            where: {
                email,
            },
            data: {
                isEmailVerified: true,
            },
        });
    });
}
exports.verifyMailToken = verifyMailToken;
function createUser(email, password, isEmailVerified, marketingEmails) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield prisma_1.prisma.user.create({
                data: {
                    email,
                    userID: (0, nanoid_1.generateUserID)(),
                    passwordHash: password != null ? yield authenticator.hashPassword(password) : null,
                    isEmailVerified,
                    marketingEmails,
                    rsaPrivateKey: "",
                    rsaPublicKey: "",
                },
            });
            return user;
        }
        catch (e) {
            if (e.code === "P2002") {
                throw new ShowError_1.ShowError("This email address is already in use.", "email-already-in-use");
            }
            throw e;
        }
    });
}
function requestPasswordReset(email) {
    return __awaiter(this, void 0, void 0, function* () {
        email = email.toLowerCase();
        const resetToken = authenticator.generateMailToken(email);
        const resetUrl = `${process.env.RESET_PASSWORD_URL}?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(email)}`;
        yield (0, mailer_1.sendMail)(email, "Reset your password", "reset-password", {
            url: resetUrl,
        });
    });
}
exports.requestPasswordReset = requestPasswordReset;
function resetPassword({ token, email, password, }) {
    return __awaiter(this, void 0, void 0, function* () {
        email = email.toLowerCase();
        const isValid = authenticator.verifyMailToken(token, email);
        if (!isValid)
            throw new ShowError_1.ShowError("This link is expired or invalid.", "invalid-token");
        const user = yield prisma_1.prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (!user)
            throw new ShowError_1.ShowError("This link is expired or invalid.", "invalid-token");
        yield prisma_1.prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                passwordHash: yield authenticator.hashPassword(password),
            },
        });
    });
}
exports.resetPassword = resetPassword;
