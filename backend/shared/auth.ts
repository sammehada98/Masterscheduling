import { HttpRequest, HttpResponseInit } from '@azure/functions';
import { verifyToken, extractToken, TokenPayload } from './security';

export interface AuthenticatedRequest extends HttpRequest {
  user?: TokenPayload;
}

/**
 * Authentication middleware for Azure Functions
 */
export async function authenticateRequest(
  request: HttpRequest
): Promise<{ authenticated: boolean; response?: HttpResponseInit; user?: TokenPayload }> {
  const authHeader = request.headers.get('authorization');
  const token = extractToken(authHeader);

  if (!token) {
    return {
      authenticated: false,
      response: {
        status: 401,
        jsonBody: { error: 'Unauthorized: No token provided' },
      },
    };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return {
      authenticated: false,
      response: {
        status: 401,
        jsonBody: { error: 'Unauthorized: Invalid token' },
      },
    };
  }

  return {
    authenticated: true,
    user: payload,
  };
}

/**
 * Authorize request based on code type and department access
 */
export function authorizeRequest(
  user: TokenPayload,
  requiredType: 'trainer' | 'customer',
  department?: string
): boolean {
  // Trainer has full access (can edit)
  if (user.codeType === 'trainer') {
    return true;
  }

  // Customer can only view
  if (requiredType === 'trainer') {
    return false; // Customer cannot perform trainer actions
  }

  // If department is specified, check if customer has access
  if (department && user.departments) {
    return user.departments.includes(department);
  }

  // If no department specified, customer can access their departments
  return user.codeType === 'customer';
}
