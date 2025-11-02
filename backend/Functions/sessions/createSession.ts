import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { authenticateRequest, authorizeRequest } from '../../shared/auth';
import { validateSession } from '../../shared/validation';
import { executeQuery, executeScalar } from '../../shared/database';
import { sanitizeInput } from '../../shared/security';

app.http('createSession', {
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

      // Only trainers can create sessions
      if (!authorizeRequest(auth.user, 'trainer')) {
        return {
          status: 403,
          jsonBody: { error: 'Forbidden: Trainer access required' },
        };
      }

      const body = await request.json();
      const sessionData = validateSession(body);

      // Check department access (shouldn't be needed for trainer, but extra security)
      if (!authorizeRequest(auth.user, 'trainer', sessionData.department)) {
        return {
          status: 403,
          jsonBody: { error: 'Access denied to this department' },
        };
      }

      // Sanitize inputs
      const sanitizedData = {
        ...sessionData,
        sessionCode: sanitizeInput(sessionData.sessionCode),
        sessionName: sanitizeInput(sessionData.sessionName),
        description: sessionData.description ? sanitizeInput(sessionData.description) : null,
        academyCourse: sessionData.academyCourse ? sanitizeInput(sessionData.academyCourse) : null,
        attendeeType: sessionData.attendeeType ? sanitizeInput(sessionData.attendeeType) : null,
      };

      const sessionId = await executeScalar<string>(
        `INSERT INTO Sessions (
          linkId, department, sessionCode, sessionName, description, 
          academyCourse, attendeeType, startDateTime, duration, sessionCount, createdBy
        )
        OUTPUT INSERTED.id
        VALUES (
          @linkId, @department, @sessionCode, @sessionName, @description,
          @academyCourse, @attendeeType, @startDateTime, @duration, @sessionCount, @createdBy
        )`,
        {
          linkId: auth.user.linkId,
          department: sanitizedData.department,
          sessionCode: sanitizedData.sessionCode,
          sessionName: sanitizedData.sessionName,
          description: sanitizedData.description,
          academyCourse: sanitizedData.academyCourse,
          attendeeType: sanitizedData.attendeeType,
          startDateTime: sanitizedData.startDateTime,
          duration: sanitizedData.duration,
          sessionCount: sanitizedData.sessionCount,
          createdBy: auth.user.codeType,
        }
      );

      if (!sessionId) {
        return {
          status: 500,
          jsonBody: { error: 'Failed to create session' },
        };
      }

      return {
        status: 201,
        jsonBody: {
          success: true,
          session: {
            id: sessionId,
            ...sanitizedData,
          },
        },
      };
    } catch (error: any) {
      context.error('Error creating session:', error);
      
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
