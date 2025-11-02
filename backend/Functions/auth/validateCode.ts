import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { compareCode, generateToken } from '../../shared/security';
import { validateCode } from '../../shared/validation';
import { executeQuery } from '../../shared/database';
import { logAccess } from '../../shared/audit';

interface ValidateCodeRequest {
  uniqueIdentifier: string;
  code: string;
}

app.http('validateCode', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const body = (await request.json()) as ValidateCodeRequest;
      
      // Validate input
      const { code } = validateCode({ code: body.code });
      const uniqueIdentifier = body.uniqueIdentifier;

      if (!uniqueIdentifier) {
        return {
          status: 400,
          jsonBody: { error: 'Unique identifier is required' },
        };
      }

      // Get link from database
      const links = await executeQuery<{
        id: string;
        uniqueIdentifier: string;
        dealershipName: string;
        language: string;
        trainerCodeHash: string;
        customerCodeHash: string;
      }>(
        `SELECT id, uniqueIdentifier, dealershipName, language, trainerCodeHash, customerCodeHash 
         FROM Links 
         WHERE uniqueIdentifier = @uniqueIdentifier`,
        { uniqueIdentifier }
      );

      if (links.length === 0) {
        return {
          status: 404,
          jsonBody: { error: 'Link not found' },
        };
      }

      const link = links[0];
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-client-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      // Check if code matches trainer code
      const isTrainer = await compareCode(code, link.trainerCodeHash);
      if (isTrainer) {
        await logAccess(link.id, 'admin', ipAddress, userAgent);
        
        const token = generateToken({
          linkId: link.id,
          codeType: 'trainer',
          uniqueIdentifier: link.uniqueIdentifier,
          language: link.language,
          dealershipName: link.dealershipName,
        });

        return {
          status: 200,
          jsonBody: {
            success: true,
            token,
            codeType: 'trainer',
            accessLevel: 'full',
            dealershipName: link.dealershipName,
            language: link.language,
          },
        };
      }

      // Check if code matches customer code
      const isCustomer = await compareCode(code, link.customerCodeHash);
      if (isCustomer) {
        // Get accessible departments for this customer code
        const departments = await executeQuery<{ department: string }>(
          `SELECT department 
           FROM LinkDepartments 
           WHERE linkId = @linkId AND customerCodeHash = @customerCodeHash`,
          { linkId: link.id, customerCodeHash: link.customerCodeHash }
        );

        await logAccess(link.id, 'customer', ipAddress, userAgent);

        const token = generateToken({
          linkId: link.id,
          codeType: 'customer',
          uniqueIdentifier: link.uniqueIdentifier,
          departments: departments.map((d) => d.department),
          language: link.language,
          dealershipName: link.dealershipName,
        });

        return {
          status: 200,
          jsonBody: {
            success: true,
            token,
            codeType: 'customer',
            accessLevel: 'view',
            departments: departments.map((d) => d.department),
            dealershipName: link.dealershipName,
            language: link.language,
          },
        };
      }

      return {
        status: 401,
        jsonBody: { error: 'Invalid code' },
      };
    } catch (error: any) {
      context.error('Error validating code:', error);
      return {
        status: 500,
        jsonBody: { error: 'Internal server error' },
      };
    }
  },
});
