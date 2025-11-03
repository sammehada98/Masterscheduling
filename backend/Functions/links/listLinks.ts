import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { executeQuery } from '../../shared/database';
import { addCorsHeaders } from '../../shared/cors';

// Super-admin credentials - In production, these should be in environment variables
const SUPER_ADMIN_USERNAME = process.env.SUPER_ADMIN_USERNAME || 'admin';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'admin123';

interface SuperAdminAuth {
  username: string;
  password: string;
}

app.http('listLinks', {
  methods: ['GET', 'POST'],
  authLevel: 'function',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      // Check super-admin authentication
      let auth: SuperAdminAuth | null = null;
      
      if (request.method === 'POST') {
        const body = await request.json() as SuperAdminAuth;
        auth = body;
      } else {
        const username = request.query.get('username');
        const password = request.query.get('password');
        if (username && password) {
          auth = { username, password };
        }
      }

      // Verify super-admin credentials
      if (!auth || auth.username !== SUPER_ADMIN_USERNAME || auth.password !== SUPER_ADMIN_PASSWORD) {
        return {
          status: 401,
          jsonBody: { error: 'Unauthorized: Super-admin credentials required' },
        };
      }

      // Get all links with department info
      const links = await executeQuery<{
        id: string;
        uniqueIdentifier: string;
        dealershipName: string;
        language: string;
        createdAt: Date | string;
        departments: string;
      }>(
        `SELECT 
          l.id,
          l.uniqueIdentifier,
          l.dealershipName,
          l.language,
          l.createdAt,
          STRING_AGG(ld.department, ', ') WITHIN GROUP (ORDER BY ld.department) as departments
        FROM Links l
        LEFT JOIN LinkDepartments ld ON l.id = ld.linkId
        GROUP BY l.id, l.uniqueIdentifier, l.dealershipName, l.language, l.createdAt
        ORDER BY l.createdAt DESC`
      );

      const origin = request.headers.get('origin');
      return addCorsHeaders({
        status: 200,
        jsonBody: {
          success: true,
          links: links.map(link => ({
            id: link.id,
            uniqueIdentifier: link.uniqueIdentifier,
            dealershipName: link.dealershipName,
            language: link.language,
            departments: link.departments ? link.departments.split(', ') : [],
            createdAt: link.createdAt instanceof Date 
              ? link.createdAt.toISOString() 
              : link.createdAt,
            accessUrl: `${process.env.BASE_URL || 'https://your-app.azurestaticapps.net'}/?id=${link.uniqueIdentifier}`,
          })),
        },
      }, origin);
    } catch (error: any) {
      context.error('Error listing links:', error);
      return {
        status: 500,
        jsonBody: { error: 'Internal server error' },
      };
    }
  },
});

