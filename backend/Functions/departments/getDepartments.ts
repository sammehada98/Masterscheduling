import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { authenticateRequest } from '../../shared/auth';

const DEPARTMENTS = ['Parts', 'Service', 'Sales', 'Accounting'];

app.http('getDepartments', {
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

      // Return all departments for trainer (admin), or filtered for customer
      let departments: string[] = [];
      
      if (auth.user.codeType === 'trainer') {
        departments = DEPARTMENTS;
      } else if (auth.user.codeType === 'customer' && auth.user.departments) {
        departments = auth.user.departments;
      }

      return {
        status: 200,
        jsonBody: {
          departments: departments.map((dept) => ({
            name: dept,
            color: getDepartmentColor(dept),
          })),
        },
      };
    } catch (error: any) {
      context.error('Error getting departments:', error);
      return {
        status: 500,
        jsonBody: { error: 'Internal server error' },
      };
    }
  },
});

function getDepartmentColor(department: string): string {
  const colors: { [key: string]: string } = {
    Parts: '#3B82F6',      // Blue
    Service: '#10B981',     // Green
    Sales: '#F59E0B',       // Orange
    Accounting: '#8B5CF6', // Purple
  };
  return colors[department] || '#6B7280';
}
