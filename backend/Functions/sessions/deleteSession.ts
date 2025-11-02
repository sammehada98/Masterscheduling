import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { authenticateRequest, authorizeRequest } from '../../shared/auth';
import { executeQuery } from '../../shared/database';

app.http('deleteSession', {
  methods: ['DELETE'],
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

      // Only trainers can delete sessions
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
      const existingSessions = await executeQuery<{ id: string }>(
        `SELECT id FROM Sessions WHERE id = @sessionId AND linkId = @linkId`,
        { sessionId, linkId: auth.user.linkId }
      );

      if (existingSessions.length === 0) {
        return {
          status: 404,
          jsonBody: { error: 'Session not found' },
        };
      }

      // Delete session
      await executeQuery(
        `DELETE FROM Sessions WHERE id = @sessionId AND linkId = @linkId`,
        { sessionId, linkId: auth.user.linkId }
      );

      return {
        status: 200,
        jsonBody: {
          success: true,
          message: 'Session deleted successfully',
        },
      };
    } catch (error: any) {
      context.error('Error deleting session:', error);
      return {
        status: 500,
        jsonBody: { error: 'Internal server error' },
      };
    }
  },
});
