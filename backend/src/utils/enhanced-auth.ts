import * as argon2 from 'argon2';
import { SignJWT, jwtVerify } from 'jose';
import { redisManager } from './redis';

interface TokenPayload {
  userId: number;
  iat?: number;
  exp?: number;
}

export class EnhancedAuthenticator {
  private secret: Uint8Array;
  private accessTokenExpiry = '15m';
  private refreshTokenExpiry = 30 * 24 * 60 * 60; // 30 days in seconds

  constructor(secret: string) {
    this.secret = new TextEncoder().encode(secret);
  }

  // Generate secure access token using Web Crypto
  async generateAccessToken(payload: { userId: number }): Promise<string> {
    return await new SignJWT({ userId: payload.userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(this.accessTokenExpiry)
      .setIssuer('license-gate')
      .setAudience('license-gate-client')
      .sign(this.secret);
  }

  // Generate secure refresh token
  async generateRefreshToken(payload: { userId: number }): Promise<string> {
    const refreshToken = await new SignJWT({ userId: payload.userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${this.refreshTokenExpiry}s`)
      .setIssuer('license-gate')
      .setAudience('license-gate-refresh')
      .sign(this.secret);

    // Store in Redis with automatic expiry
    await redisManager.setRefreshToken(payload.userId, refreshToken, 30);
    
    return refreshToken;
  }

  // Verify access token
  async verifyAccessToken(token: string): Promise<{ success: true; payload: TokenPayload } | { success: false; error: string }> {
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        issuer: 'license-gate',
        audience: 'license-gate-client'
      });

      return {
        success: true,
        payload: {
          userId: payload.userId as number,
          iat: payload.iat,
          exp: payload.exp
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid token'
      };
    }
  }

  // Verify and rotate refresh token
  async verifyAndRotateRefreshToken(token: string): Promise<{ 
    success: true; 
    accessToken: string; 
    refreshToken: string; 
    userId: number 
  } | { 
    success: false; 
    error: string 
  }> {
    try {
      // Verify the refresh token
      const { payload } = await jwtVerify(token, this.secret, {
        issuer: 'license-gate',
        audience: 'license-gate-refresh'
      });

      const userId = payload.userId as number;

      // Check if token exists in Redis
      const storedToken = await redisManager.getRefreshToken(userId);
      if (!storedToken || storedToken !== token) {
        // Token doesn't exist or doesn't match - possible replay attack
        await redisManager.deleteRefreshToken(userId);
        return {
          success: false,
          error: 'Invalid refresh token - possible replay attack detected'
        };
      }

      // Generate new tokens
      const newAccessToken = await this.generateAccessToken({ userId });
      const newRefreshToken = await this.generateRefreshToken({ userId });

      // Delete old refresh token
      await redisManager.deleteRefreshToken(userId);

      return {
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        userId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid refresh token'
      };
    }
  }

  // Background token rotation (call this for active users)
  async rotateTokenIfNeeded(
    accessToken: string, 
    refreshToken: string,
    rotateAfterMinutes: number = 10
  ): Promise<{
    rotated: boolean;
    accessToken: string;
    refreshToken?: string;
  }> {
    try {
      const verificationResult = await this.verifyAccessToken(accessToken);
      
      if (!verificationResult.success) {
        return { rotated: false, accessToken };
      }

      const { payload } = verificationResult;
      const now = Math.floor(Date.now() / 1000);
      const tokenAge = now - (payload.iat || 0);
      
      // If token is older than specified minutes, rotate
      if (tokenAge > rotateAfterMinutes * 60) {
        const rotateResult = await this.verifyAndRotateRefreshToken(refreshToken);
        
        if (rotateResult.success) {
          return {
            rotated: true,
            accessToken: rotateResult.accessToken,
            refreshToken: rotateResult.refreshToken
          };
        }
      }

      return { rotated: false, accessToken };
    } catch (error) {
      return { rotated: false, accessToken };
    }
  }

  // Direct login with password
  async authenticateUser(email: string, password: string): Promise<{
    success: true;
    accessToken: string;
    refreshToken: string;
    userId: number;
  } | {
    success: false;
    error: string;
  }> {
    try {
      const { prisma } = await import('../prisma');
      
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          passwordHash: true,
          isEmailVerified: true
        }
      });

      if (!user || !user.passwordHash) {
        return { success: false, error: 'Invalid credentials' };
      }

      if (!user.isEmailVerified) {
        return { success: false, error: 'Email not verified' };
      }

      // Verify password
      const isValidPassword = await argon2.verify(user.passwordHash, password);
      if (!isValidPassword) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Generate tokens
      const accessToken = await this.generateAccessToken({ userId: user.id });
      const refreshToken = await this.generateRefreshToken({ userId: user.id });

      return {
        success: true,
        accessToken,
        refreshToken,
        userId: user.id
      };
    } catch (error) {
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  // OAuth login (for Google/GitHub)
  async oauthLogin(userId: number): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const accessToken = await this.generateAccessToken({ userId });
    const refreshToken = await this.generateRefreshToken({ userId });

    return { accessToken, refreshToken };
  }

  // Logout - invalidate refresh token
  async logout(userId: number): Promise<void> {
    await redisManager.deleteRefreshToken(userId);
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4
    });
  }
}

// Export singleton instance
export const enhancedAuth = new EnhancedAuthenticator(process.env.JWT_SECRET!);
