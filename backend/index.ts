// Main entry point - imports all functions to register them
import './Functions/auth/validateCode';
import './Functions/calendar/exportCalendar';
import './Functions/departments/getDepartments';
import './Functions/links/createLink';
import './Functions/links/getLink';
import './Functions/sessions/createSession';
import './Functions/sessions/deleteSession';
import './Functions/sessions/getSessions';
import './Functions/sessions/updateSession';
import './Functions/templates/getTemplates';
import './Functions/templates/saveTemplate';

// Export app to make it available for Azure Functions runtime
import { app } from '@azure/functions';

export default app;

