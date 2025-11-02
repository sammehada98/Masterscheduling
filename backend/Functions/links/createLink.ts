import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { hashCode, generateUniqueIdentifier, generateSecureCode } from '../../shared/security';
import { validateLink } from '../../shared/validation';
import { executeQuery, executeScalar } from '../../shared/database';
import { addCorsHeaders } from '../../shared/cors';

interface CreateLinkRequest {
  dealershipName: string;
  language: 'en' | 'fr';
  trainerCode?: string;
  customerCode?: string;
  customerDepartments: string[];
}

app.http('createLink', {
  methods: ['POST'],
  authLevel: 'function',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      // Note: In production, this should require admin authentication
      // For now, we'll allow it with function-level auth or implement a super-admin check

      const body = (await request.json()) as CreateLinkRequest;

      // Generate codes if not provided
      const trainerCode = body.trainerCode || generateSecureCode(10);
      const customerCode = body.customerCode || generateSecureCode(10);
      const customerDepartments = body.customerDepartments || [];

      // Validate
      validateLink({
        dealershipName: body.dealershipName,
        language: body.language,
        trainerCode,
        customerCode,
        customerDepartments,
      });

      // Hash codes
      const trainerCodeHash = await hashCode(trainerCode);
      const customerCodeHash = await hashCode(customerCode);

      // Generate unique identifier
      const uniqueIdentifier = generateUniqueIdentifier();

      // Create link
      const linkId = await executeScalar<string>(
        `INSERT INTO Links (uniqueIdentifier, dealershipName, language, trainerCodeHash, customerCodeHash)
         OUTPUT INSERTED.id
         VALUES (@uniqueIdentifier, @dealershipName, @language, @trainerCodeHash, @customerCodeHash)`,
        {
          uniqueIdentifier,
          dealershipName: body.dealershipName,
          language: body.language,
          trainerCodeHash,
          customerCodeHash,
        }
      );

      if (!linkId) {
        return {
          status: 500,
          jsonBody: { error: 'Failed to create link' },
        };
      }

      // Create department mappings
      for (const department of customerDepartments) {
        await executeQuery(
          `INSERT INTO LinkDepartments (linkId, department, customerCodeHash)
           VALUES (@linkId, @department, @customerCodeHash)`,
          {
            linkId,
            department,
            customerCodeHash,
          }
        );
      }

      const origin = request.headers.get('origin');
      const response = {
        status: 201,
        jsonBody: {
          success: true,
          link: {
            id: linkId,
            uniqueIdentifier,
            dealershipName: body.dealershipName,
            language: body.language,
            trainerCode,
            customerCode,
            customerDepartments,
            accessUrl: `${process.env.BASE_URL || 'https://your-app.azurestaticapps.net'}/?id=${uniqueIdentifier}`,
          },
          // In production, these codes should be sent separately via secure channel
        },
      };

      return addCorsHeaders(response, origin);
    } catch (error: any) {
      context.error('Error creating link:', error);
      
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
