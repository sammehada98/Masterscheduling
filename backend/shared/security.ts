import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const SALT_ROUNDS = 12;

export interface TokenPayload {
  linkId: string;
  codeType: 'trainer' | 'customer';
  uniqueIdentifier: string;
  departments?: string[];
  language?: string;
  dealershipName?: string;
}

/**
 * Hash a code using bcrypt
 */
export async function hashCode(code: string): Promise<string> {
  return bcrypt.hash(code, SALT_ROUNDS);
}

/**
 * Compare a code with its hash
 */
export async function compareCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

/**
 * Generate a unique identifier for links
 */
export function generateUniqueIdentifier(): string {
  return uuidv4().replace(/-/g, '').substring(0, 32);
}

/**
 * Generate a secure random code
 */
export function generateSecureCode(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate JWT token for authenticated users
 */
export function generateToken(payload: TokenPayload): string {
  if (!JWT_SECRET || JWT_SECRET === 'your-secret-key-change-in-production') {
    throw new Error('JWT_SECRET must be set in environment variables');
  }
  // Cast payload to object and options to SignOptions to satisfy TypeScript
  return jwt.sign(payload as object, JWT_SECRET, {
    expiresIn: JWT_EXPIRY as string,
    issuer: 'master-scheduling-app',
  } as jwt.SignOptions);
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  return null;
}

/**
 * Sanitize input to prevent SQL injection and XSS
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, ''); // Remove quotes that could break SQL
}

/**
 * Validate department name
 */
export function isValidDepartment(department: string): boolean {
  const validDepartments = ['Parts', 'Service', 'Sales', 'Accounting'];
  return validDepartments.includes(department);
}

/**
 * Validate code format (alphanumeric, 6-20 chars)
 */
export function isValidCodeFormat(code: string): boolean {
  return /^[A-Za-z0-9]{6,20}$/.test(code);
}
