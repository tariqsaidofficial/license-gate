// Settings Management Types

export enum SettingsCategory {
  SMTP = 'smtp',
  OAUTH = 'oauth',
  GENERAL = 'general',
  SECURITY = 'security'
}

export enum SettingAuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

export interface SmtpSettings {
  host: string
  port: number
  username: string
  password: string
  sender: string
  secure: boolean
}

export interface OAuthSettings {
  googleClientId?: string
  googleClientSecret?: string
  githubClientId?: string
  githubClientSecret?: string
}

export interface GeneralSettings {
  siteName?: string
  supportEmail?: string
  maintenanceMode?: boolean
  registrationEnabled?: boolean
}

export interface SecuritySettings {
  sessionTimeout?: number
  maxLoginAttempts?: number
  passwordMinLength?: number
  requireTwoFactor?: boolean
}

export type SettingsValue = SmtpSettings | OAuthSettings | GeneralSettings | SecuritySettings

export interface SettingRecord {
  id: number
  category: string
  key: string
  value: string | null
  isEncrypted: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: number
  updatedBy: number
}

export interface SettingAuditRecord {
  id: number
  settingId: number | null
  category: string
  key: string
  oldValue: string | null
  newValue: string | null
  action: SettingAuditAction
  userId: number
  timestamp: Date
  ipAddress: string | null
  userAgent: string | null
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface TestResult {
  success: boolean
  message: string
  details?: Record<string, any>
}

export interface EncryptedBackup {
  version: string
  timestamp: Date
  createdBy: number
  data: string // Encrypted settings data
  checksum: string
}

export interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: string[]
}

// Sensitive setting keys that should be encrypted
export const SENSITIVE_KEYS = [
  'password',
  'secret',
  'key',
  'token',
  'clientSecret',
  'privateKey'
] as const

// Default settings for each category
export const DEFAULT_SETTINGS: Record<SettingsCategory, Record<string, string>> = {
  [SettingsCategory.SMTP]: {
    host: '',
    port: '587',
    username: '',
    password: '',
    sender: '',
    secure: 'true'
  },
  [SettingsCategory.OAUTH]: {
    googleClientId: '',
    googleClientSecret: '',
    githubClientId: '',
    githubClientSecret: ''
  },
  [SettingsCategory.GENERAL]: {
    siteName: 'LicenseGate',
    supportEmail: '',
    maintenanceMode: 'false',
    registrationEnabled: 'true'
  },
  [SettingsCategory.SECURITY]: {
    sessionTimeout: '3600',
    maxLoginAttempts: '5',
    passwordMinLength: '8',
    requireTwoFactor: 'false'
  }
}