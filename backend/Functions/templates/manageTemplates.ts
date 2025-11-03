import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { validateTemplate } from '../../shared/validation';
import { executeQuery, executeScalar } from '../../shared/database';
import { sanitizeInput } from '../../shared/security';
import { addCorsHeaders } from '../../shared/cors';

// Super-admin credentials - In production, these should be in environment variables
const SUPER_ADMIN_USERNAME = process.env.SUPER_ADMIN_USERNAME || 'admin';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'admin123';

interface SuperAdminAuth {
  username: string;
  password: string;
}

app.http('manageTemplates', {
  methods: ['GET', 'POST'],
  authLevel: 'function',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const origin = request.headers.get('origin');

      // GET - List all templates (no auth required for listing)
      if (request.method === 'GET') {
        const department = request.query.get('department');
        
        let query = `SELECT 
          id, department, sessionCode, sessionName, sessionNameFr, description, descriptionFr,
          academyCourse, academyCourseFr, defaultAttendeeType, defaultAttendeeTypeFr, defaultDuration, createdAt
          FROM Templates`;

        const params: { [key: string]: any } = {};

        if (department) {
          query += ` WHERE department = @department`;
          params.department = department;
        }

        query += ` ORDER BY department, sessionCode ASC`;

        const templates = await executeQuery(query, params);

        return addCorsHeaders({
          status: 200,
          jsonBody: {
            templates: templates.map((t) => ({
              ...t,
              createdAt: t.createdAt instanceof Date 
                ? t.createdAt.toISOString() 
                : t.createdAt,
            })),
          },
        }, origin);
      }

      // POST - Create, update, or delete template
      if (request.method === 'POST') {
        const body = await request.json() as SuperAdminAuth & any;

        // Check super-admin authentication
        if (!body.username || !body.password) {
          return {
            status: 401,
            jsonBody: { error: 'Super-admin credentials required' },
          };
        }

        if (body.username !== SUPER_ADMIN_USERNAME || body.password !== SUPER_ADMIN_PASSWORD) {
          return {
            status: 401,
            jsonBody: { error: 'Unauthorized: Invalid super-admin credentials' },
          };
        }

        // If templateId is present, it's a delete operation
        if (body.templateId) {
          if (!body.templateId) {
            return {
              status: 400,
              jsonBody: { error: 'Template ID is required' },
            };
          }

          await executeQuery(
            `DELETE FROM Templates WHERE id = @templateId`,
            { templateId: body.templateId }
          );

          return addCorsHeaders({
            status: 200,
            jsonBody: {
              success: true,
              message: 'Template deleted successfully',
            },
          }, origin);
        }

        // Otherwise, it's a create/update operation
        const templateData = {
          department: body.department,
          sessionCode: body.sessionCode,
          sessionName: body.sessionName,
          description: body.description || null,
          academyCourse: body.academyCourse || null,
          defaultAttendeeType: body.defaultAttendeeType || null,
          defaultDuration: body.defaultDuration,
        };

        // Validate
        validateTemplate(templateData);

        // Sanitize inputs
        const sanitizedData = {
          ...templateData,
          sessionCode: sanitizeInput(templateData.sessionCode),
          sessionName: sanitizeInput(templateData.sessionName),
          description: templateData.description ? sanitizeInput(templateData.description) : null,
          academyCourse: templateData.academyCourse ? sanitizeInput(templateData.academyCourse) : null,
          defaultAttendeeType: templateData.defaultAttendeeType 
            ? sanitizeInput(templateData.defaultAttendeeType) 
            : null,
        };

        // Check if template with same code and department exists
        const existing = await executeQuery<{ id: string }>(
          `SELECT id FROM Templates 
           WHERE department = @department AND sessionCode = @sessionCode`,
          {
            department: sanitizedData.department,
            sessionCode: sanitizedData.sessionCode,
          }
        );

        let templateId: string;

        if (existing.length > 0) {
          // Update existing template
          templateId = existing[0].id;
          await executeQuery(
            `UPDATE Templates SET
              sessionName = @sessionName,
              description = @description,
              academyCourse = @academyCourse,
              defaultAttendeeType = @defaultAttendeeType,
              defaultDuration = @defaultDuration
            WHERE id = @templateId`,
            {
              templateId,
              sessionName: sanitizedData.sessionName,
              description: sanitizedData.description,
              academyCourse: sanitizedData.academyCourse,
              defaultAttendeeType: sanitizedData.defaultAttendeeType,
              defaultDuration: sanitizedData.defaultDuration,
            }
          );
        } else {
          // Create new template
          templateId = await executeScalar<string>(
            `INSERT INTO Templates (
              department, sessionCode, sessionName, description, 
              academyCourse, defaultAttendeeType, defaultDuration
            )
            OUTPUT INSERTED.id
            VALUES (
              @department, @sessionCode, @sessionName, @description,
              @academyCourse, @defaultAttendeeType, @defaultDuration
            )`,
            sanitizedData
          ) || '';
        }

        if (!templateId) {
          return {
            status: 500,
            jsonBody: { error: 'Failed to save template' },
          };
        }

        return addCorsHeaders({
          status: 200,
          jsonBody: {
            success: true,
            template: {
              id: templateId,
              ...sanitizedData,
            },
          },
        }, origin);
      }

      return {
        status: 405,
        jsonBody: { error: 'Method not allowed' },
      };
    } catch (error: any) {
      context.error('Error managing templates:', error);
      
      if (error.name === 'ZodError') {
        return {
          status: 400,
          jsonBody: { error: 'Validation error', details: error.errors },
        };
      }

      return {
        status: 500,
        jsonBody: { error: 'Internal server error' },
      };
    }
  },
});
