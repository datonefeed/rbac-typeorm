import crypto from 'crypto';
import { AppDataSource } from '../config/typeorm';
import { AccessToken } from '../models/access_token';

interface TokenMetadata {
  ipAddress?: string;
  userAgent?: string;
}

interface TokenResult {
  token: string;
  expiresAt: Date;
}

interface UserData {
  userId: number;
  userName: string;
  fullName: string;
  email: string;
  isActive: boolean;
  abilities: string[]; // Format: ['DIRECTOR', 'company:1', 'permission:PRJ_VIEW']
}

/**
 * Generate a secure random opaque token
 * @returns {string} 64-character hexadecimal token
 */
export function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create and store an access token for a user
 * @param {number} userId - User ID
 * @param {TokenMetadata} metadata - Additional metadata (ipAddress, userAgent)
 * @returns {Promise<TokenResult>}
 */
export async function createAccessToken(userId: number, metadata: TokenMetadata = {}): Promise<TokenResult> {
  const token = generateOpaqueToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

  await AppDataSource.query(
    `INSERT INTO access_tokens (user_id, token, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, token, expiresAt, metadata.ipAddress || null, metadata.userAgent || null]
  );

  return { token, expiresAt };
}

/**
 * Verify and retrieve user data from an access token
 * @param {string} token - The opaque token
 * @returns {Promise<UserData|null>} User data with abilities, or null if invalid
 * 
 * NOTE: Uses raw SQL for performance reasons:
 * - Single query to verify token + load user + aggregate abilities
 * - JSON aggregation for abilities array
 * - Critical path for every authenticated request (must be fast)
 * Alternative would be multiple TypeORM queries (slower)
 */
export async function verifyAccessToken(token: string): Promise<UserData | null> {
  // Query token with user data and abilities
  // Returns abilities in new format: ['DIRECTOR', 'company:1', 'permission:PRJ_VIEW']
  const result = await AppDataSource.query(
    `SELECT 
      at.id as token_id,
      at.user_id,
      at.expires_at,
      u.user_name,
      u.full_name,
      u.email,
      u.is_active,
      -- Aggregate roles
      COALESCE(
        json_agg(DISTINCT r.role_name) FILTER (WHERE r.id IS NOT NULL),
        '[]'
      ) as roles,
      -- Aggregate permissions
      COALESCE(
        json_agg(DISTINCT 'permission:' || p.permission_name) FILTER (WHERE p.id IS NOT NULL),
        '[]'
      ) as permissions,
      -- Aggregate companies
      COALESCE(
        json_agg(DISTINCT 'company:' || c.id) FILTER (WHERE c.id IS NOT NULL),
        '[]'
      ) as companies
    FROM access_tokens at
    INNER JOIN users u ON at.user_id = u.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
    LEFT JOIN roles r ON ur.role_id = r.id AND r.is_active = true
    LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.is_active = true
    LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_active = true
    LEFT JOIN user_companies uc ON u.id = uc.user_id AND uc.is_active = true
    LEFT JOIN companies c ON uc.company_id = c.id AND c.is_active = true
    WHERE at.token = $1
      AND at.expires_at > NOW()
      AND u.is_active = true
    GROUP BY at.id, at.user_id, at.expires_at, u.user_name, u.full_name, u.email, u.is_active`,
    [token]
  );

  if (result.length === 0) {
    return null;
  }

  const row = result[0];
  
  // Merge all abilities into single array (roles + permissions + companies)
  const abilities = [
    ...(row.roles || []),
    ...(row.permissions || []),
    ...(row.companies || [])
  ];
  
  // Remove duplicates and sort for consistency
  const uniqueAbilities = Array.from(new Set(abilities)).sort();
  
  return {
    userId: row.user_id,
    userName: row.user_name,
    fullName: row.full_name,
    email: row.email,
    isActive: row.is_active,
    abilities: uniqueAbilities
  };
}

/**
 * Revoke (delete) an access token
 * @param {string} token - The token to revoke
 */
export async function revokeToken(token: string): Promise<void> {
  const tokenRepository = AppDataSource.getRepository(AccessToken);
  await tokenRepository.delete({ token });
}

/**
 * Revoke all access tokens for a specific user
 * Used when: password change, role/company assignment, user deactivation
 * @param {number} userId - User ID
 */
export async function revokeAllUserTokens(userId: number): Promise<void> {
  const tokenRepository = AppDataSource.getRepository(AccessToken);
  await tokenRepository.delete({ userId });
}

/**
 * Clean up expired tokens (can be run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await AppDataSource.query(
    `DELETE FROM access_tokens WHERE expires_at < NOW()`
  );
  return result[1] || 0; // Return number of deleted rows
}
