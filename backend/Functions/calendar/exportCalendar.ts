import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { authenticateRequest } from '../../shared/auth';
import { executeQuery } from '../../shared/database';

interface CalendarEvent {
  start: Date;
  end: Date;
  summary: string;
  description: string;
  location?: string;
}

function formatICalDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function generateICal(events: CalendarEvent[], dealershipName: string): string {
  const now = new Date();
  
  let ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Master Scheduling//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${dealershipName} - Training Schedule`,
    `X-WR-CALDESC:Training schedule for ${dealershipName}`,
    `X-WR-TIMEZONE:UTC`,
  ];

  events.forEach((event) => {
    const startStr = formatICalDate(event.start);
    const endStr = formatICalDate(event.end);
    
    ical.push('BEGIN:VEVENT');
    ical.push(`UID:${event.start.getTime()}-${Math.random().toString(36).substr(2, 9)}@masterscheduling.com`);
    ical.push(`DTSTAMP:${formatICalDate(now)}`);
    ical.push(`DTSTART:${startStr}`);
    ical.push(`DTEND:${endStr}`);
    ical.push(`SUMMARY:${escapeICalText(event.summary)}`);
    ical.push(`DESCRIPTION:${escapeICalText(event.description)}`);
    if (event.location) {
      ical.push(`LOCATION:${escapeICalText(event.location)}`);
    }
    ical.push('END:VEVENT');
  });

  ical.push('END:VCALENDAR');
  return ical.join('\r\n');
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

app.http('exportCalendar', {
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
      const department = request.query.get('department');

      // Get link info for dealership name
      const links = await executeQuery<{
        dealershipName: string;
        language: string;
      }>(
        `SELECT dealershipName, language FROM Links WHERE id = @linkId`,
        { linkId }
      );

      if (links.length === 0) {
        return {
          status: 404,
          jsonBody: { error: 'Link not found' },
        };
      }

      const link = links[0];
      const userLang = auth.user.language || link.language || 'en';

      // Get sessions
      let query = `SELECT 
        department, sessionName, description, academyCourse,
        startDateTime, duration
        FROM Sessions 
        WHERE linkId = @linkId`;

      const params: { [key: string]: any } = { linkId };

      if (department) {
        query += ` AND department = @department`;
        params.department = department;
      } else if (auth.user.codeType === 'customer' && auth.user.departments) {
        const departmentList = auth.user.departments.map((d) => `'${d}'`).join(',');
        query += ` AND department IN (${departmentList})`;
      }

      query += ` ORDER BY startDateTime ASC`;

      const sessions = await executeQuery<any>(query, params);

      // Convert sessions to calendar events
      const events: CalendarEvent[] = sessions.map((session: any) => {
        const start = new Date(session.startDateTime);
        const end = new Date(start.getTime() + session.duration * 60000);
        
        return {
          start,
          end,
          summary: session.sessionName || 'Training Session',
          description: [
            session.description || '',
            session.academyCourse ? `Course: ${session.academyCourse}` : '',
            `Department: ${session.department}`,
          ].filter(Boolean).join('\\n'),
          location: session.academyCourse || undefined,
        };
      });

      const icalContent = generateICal(events, link.dealershipName);

      return {
        status: 200,
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': `attachment; filename="${link.dealershipName.replace(/[^a-z0-9]/gi, '_')}_schedule.ics"`,
        },
        body: icalContent,
      };
    } catch (error: any) {
      context.error('Error exporting calendar:', error);
      return {
        status: 500,
        jsonBody: { error: 'Internal server error' },
      };
    }
  },
});
