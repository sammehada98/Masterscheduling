import { executeQuery } from './database';

/**
 * Log access attempt to AccessLogs table
 */
export async function logAccess(
  linkId: string,
  codeType: 'admin' | 'customer',
  ipAddress: string,
  userAgent: string
): Promise<void> {
  try {
    await executeQuery(
      `INSERT INTO AccessLogs (linkId, codeType, ipAddress, userAgent)
       VALUES (@linkId, @codeType, @ipAddress, @userAgent)`,
      {
        linkId,
        codeType,
        ipAddress: ipAddress.substring(0, 45),
        userAgent: userAgent.substring(0, 500),
      }
    );
  } catch (error) {
    // Don't throw - audit logging should not break the application
    console.error('Failed to log access:', error);
  }
}
