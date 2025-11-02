import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { authenticateRequest, authorizeRequest } from '../../shared/auth';
import { validateSession } from '../../shared/validation';
import { executeQuery } from '../../shared/database';
import { sanitizeInput } from '../../shared/security';

app.http('updateSession', {
  methods: ['PUT'],
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

      // Only trainers can update sessions
      if (!authorizeRequest(auth.user, 'trainer')) {
        return {
          status: 403,
          jsonBody: { error: 'Forbidden: Trainer access required' },
        };
      }

      const sessionId = request.query.get('id') || request.query.get('sessionId');
      if (!sessionId) {
        return {
          status: 400,
          jsonBody: { error: 'Session ID is required' },
        };
      }

      // Verify session exists and belongs to this link
      const existingSessions = await executeQuery<{ id: string; department: string }>(
        `SELECT id, department FROM Sessions WHERE id = @sessionId AND linkId = @linkId`,
        { sessionId, linkId: auth.user.linkId }
      );

      if (existingSessions.length === 0) {
        return {
          status: 404,
          jsonBody: { error: 'Session not found' },
        };
      }

      const body = await request.json();
      const sessionData = validateSession(body);

      // Check department access
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

      await executeQuery(
        `UPDATE Sessions SET
          department = @department,
          sessionCode = @sessionCode,
          sessionName = @sessionName,
          description = @description,
          academyCourse = @academyCourse,
          attendeeType = @attendeeType,
          startDateTime = @startDateTime,
          duration = @duration,
          sessionCount = @sessionCount,
          updatedAt = GETUTCDATE()
        WHERE id = @sessionId AND linkId = @linkId`,
        {
          sessionId,
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
        }
      );

      return {
        status: 200,
        jsonBody: {
          success: true,
          session: {
            id: sessionId,
            ...sanitizedData,
          },
        },
      };
    } catch (error: any) {
      context.error('Error updating session:', error);
      
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
