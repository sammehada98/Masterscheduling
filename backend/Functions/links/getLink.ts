import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { authenticateRequest } from '../../shared/auth';
import { executeQuery } from '../../shared/database';

app.http('getLink', {
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

      const { linkId } = auth.user;

      // Get link info (without sensitive data)
      const links = await executeQuery<{
        id: string;
        uniqueIdentifier: string;
        dealershipName: string;
        language: string;
        createdAt: string;
      }>(
        `SELECT id, uniqueIdentifier, dealershipName, language, createdAt 
         FROM Links 
         WHERE id = @linkId`,
        { linkId }
      );

      if (links.length === 0) {
        return {
          status: 404,
          jsonBody: { error: 'Link not found' },
        };
      }

      const link = links[0];

      // Get accessible departments for customer codes
      let departments: string[] = [];
      if (auth.user.codeType === 'customer' && auth.user.departments) {
        departments = auth.user.departments;
      } else if (auth.user.codeType === 'trainer') {
        // Trainer can see all departments
        const allDepartments = await executeQuery<{ department: string }>(
          `SELECT DISTINCT department FROM LinkDepartments WHERE linkId = @linkId`,
          { linkId }
        );
        departments = allDepartments.map((d) => d.department);
        // Add default departments if none configured
        if (departments.length === 0) {
          departments = ['Parts', 'Service', 'Sales', 'Accounting'];
        }
      }

      return {
        status: 200,
        jsonBody: {
          link: {
            id: link.id,
            uniqueIdentifier: link.uniqueIdentifier,
            dealershipName: link.dealershipName,
            language: link.language,
            createdAt: link.createdAt,
          },
          access: {
            codeType: auth.user.codeType,
            departments,
            language: link.language,
            dealershipName: link.dealershipName,
          },
        },
      };
    } catch (error: any) {
      context.error('Error getting link:', error);
      return {
        status: 500,
        jsonBody: { error: 'Internal server error' },
      };
    }
  },
});
