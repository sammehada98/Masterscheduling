import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { authenticateRequest, authorizeRequest } from '../../shared/auth';
import { validateTemplate } from '../../shared/validation';
import { executeQuery, executeScalar } from '../../shared/database';
import { sanitizeInput } from '../../shared/security';

app.http('saveTemplate', {
  methods: ['POST'],
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

      // Only trainers can save templates
      if (!authorizeRequest(auth.user, 'trainer')) {
        return {
          status: 403,
          jsonBody: { error: 'Forbidden: Trainer access required' },
        };
      }

      const body = await request.json();
      const templateData = validateTemplate(body);

      // Check department access
      if (!authorizeRequest(auth.user, 'trainer', templateData.department)) {
        return {
          status: 403,
          jsonBody: { error: 'Access denied to this department' },
        };
      }

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

      return {
        status: 200,
        jsonBody: {
          success: true,
          template: {
            id: templateId,
            ...sanitizedData,
          },
        },
      };
    } catch (error: any) {
      context.error('Error saving template:', error);
      
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
