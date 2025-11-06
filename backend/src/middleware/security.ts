import compression from 'compression'
import { NextFunction, Request, Response } from 'express'
import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'
import helmet from 'helmet'

// General rate limiting
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Strict rate limiting for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// API rate limiting
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per minute
  message: {
    error: 'API rate limit exceeded, please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Slow down repeated requests
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 2, // allow 2 requests per 15 minutes at full speed
  delayMs: () => 500, // Fixed delay function for v2
  maxDelayMs: 20000, // maximum delay of 20 seconds
  validate: { delayMs: false } // Disable warning
})

// Helmet configuration for security headers
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "https://accounts.google.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["https://accounts.google.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
})

// Compression middleware
export const compressionConfig = compression({
  level: 6,
  threshold: 1024,
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false
    }
    return compression.filter(req, res)
  }
})

// Environment variables validation
export const validateEnvVars = () => {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET'
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing)
    process.exit(1)
  }
  
  // Validate JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters long')
    process.exit(1)
  }
  
  console.log('✅ Environment variables validated')
}

// HTTPS enforcement middleware
export const enforceHTTPS = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(`https://${req.header('host')}${req.url}`)
  }
  next()
}

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
    
    if (res.statusCode >= 400) {
      console.error('🔴 Request error:', logData)
    } else if (duration > 1000) {
      console.warn('⚠️ Slow request:', logData)
    } else {
      console.log('📝 Request:', logData)
    }
  })
  
  next()
}
