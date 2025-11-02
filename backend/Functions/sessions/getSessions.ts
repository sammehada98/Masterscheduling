import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { authenticateRequest, authorizeRequest } from '../../shared/auth';
import { executeQuery } from '../../shared/database';

app.http('getSessions', {
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
      const { linkId } = auth.user;

      // Build query
      let query = `SELECT 
        id, linkId, department, sessionCode, sessionName, description, 
        academyCourse, attendeeType, startDateTime, duration, sessionCount, 
        createdBy, updatedAt
        FROM Sessions 
        WHERE linkId = @linkId`;

      const params: { [key: string]: any } = { linkId };

      // If customer code, filter by accessible departments
      if (auth.user.codeType === 'customer' && auth.user.departments) {
        const departmentList = auth.user.departments.map((d) => `'${d}'`).join(',');
        query += ` AND department IN (${departmentList})`;
      }

      // Filter by specific department if provided
      if (department) {
        if (!authorizeRequest(auth.user, 'customer', department)) {
          return {
            status: 403,
            jsonBody: { error: 'Access denied to this department' },
          };
        }
        query += ` AND department = @department`;
        params.department = department;
      }

      query += ` ORDER BY startDateTime ASC`;

      const sessions = await executeQuery(query, params);

      return {
        status: 200,
        jsonBody: {
          sessions: sessions.map((s) => ({
            ...s,
            startDateTime: s.startDateTime instanceof Date 
              ? s.startDateTime.toISOString() 
              : s.startDateTime,
          })),
        },
      };
    } catch (error: any) {
      context.error('Error getting sessions:', error);
      return {
        status: 500,
        jsonBody: { error: 'Internal server error' },
      };
    }
  },
});
