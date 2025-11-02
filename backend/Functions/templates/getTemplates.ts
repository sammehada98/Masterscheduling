import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { authenticateRequest, authorizeRequest } from '../../shared/auth';
import { executeQuery } from '../../shared/database';

app.http('getTemplates', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const auth = await authenticateRequest(request);
      
      if (!auth.authenticated || !auth.user) {
        return auth.response || {
          status: 401,
          jsonBody: { error: 'Unauthorized' },
        };
      }

      const department = request.query.get('department');

      let query = `SELECT 
        id, department, sessionCode, sessionName, sessionNameFr, description, descriptionFr,
        academyCourse, academyCourseFr, defaultAttendeeType, defaultAttendeeTypeFr, defaultDuration, createdAt
        FROM Templates`;

      const params: { [key: string]: any } = {};

      // Filter by department if provided
      if (department) {
        // Check access for customer codes
        if (auth.user.codeType === 'customer') {
          if (!authorizeRequest(auth.user, 'customer', department)) {
            return {
              status: 403,
              jsonBody: { error: 'Access denied to this department' },
            };
          }
        }
        query += ` WHERE department = @department`;
        params.department = department;
      } else if (auth.user.codeType === 'customer' && auth.user.departments) {
        // Filter by accessible departments for customer codes
        const departmentList = auth.user.departments.map((d) => `'${d}'`).join(',');
        query += ` WHERE department IN (${departmentList})`;
      }

      query += ` ORDER BY department, sessionCode ASC`;

      const templates = await executeQuery(query, params);

      return {
        status: 200,
        jsonBody: {
          templates: templates.map((t) => ({
            ...t,
            createdAt: t.createdAt instanceof Date 
              ? t.createdAt.toISOString() 
              : t.createdAt,
          })),
        },
      };
    } catch (error: any) {
      context.error('Error getting templates:', error);
      return {
        status: 500,
        jsonBody: { error: 'Internal server error' },
      };
    }
  },
});
