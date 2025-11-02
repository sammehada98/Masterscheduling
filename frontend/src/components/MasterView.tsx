import React, { useMemo } from 'react';
import { format, parseISO, startOfDay, addMinutes, isSameDay } from 'date-fns';
import type { Session, Department } from '../types';
import './MasterView.css';

interface MasterViewProps {
  allSessions: Session[];
  departmentColors: Map<Department, string>;
}

export const MasterView: React.FC<MasterViewProps> = ({ allSessions, departmentColors }) => {
  const { groupedByDate, timeSlots } = useMemo(() => {
    const grouped = new Map<string, Session[]>();
    
    allSessions.forEach((session) => {
      const dateKey = format(parseISO(session.startDateTime), 'yyyy-MM-dd');
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(session);
    });

    // Sort sessions within each day
    grouped.forEach((sessions) => {
      sessions.sort((a, b) => {
        return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
      });
    });

    // Generate time slots (every 30 minutes from 6 AM to 10 PM)
    const slots: string[] = [];
    const start = new Date();
    start.setHours(6, 0, 0, 0);
    const end = new Date();
    end.setHours(22, 0, 0, 0);
    
    for (let time = start.getTime(); time <= end.getTime(); time += 30 * 60000) {
      slots.push(format(new Date(time), 'HH:mm'));
    }

    return {
      groupedByDate: grouped,
      timeSlots: slots,
    };
  }, [allSessions]);

  const getSessionPosition = (session: Session): { top: number; height: number } => {
    const startDate = parseISO(session.startDateTime);
    const dayStart = startOfDay(startDate);
    const minutesFromStart = (startDate.getTime() - dayStart.getTime()) / 60000;
    const top = ((minutesFromStart - 360) / 30) * 40; // 6 AM = 360 minutes, each slot = 40px
    const height = (session.duration / 30) * 40;
    return { top: Math.max(0, top), height: Math.max(40, height) };
  };

  const dates = Array.from(groupedByDate.keys()).sort();

  if (dates.length === 0) {
    return (
      <div className="master-view-empty">
        <p>No sessions scheduled</p>
      </div>
    );
  }

  return (
    <div className="master-view">
      {dates.map((dateKey) => {
        const sessions = groupedByDate.get(dateKey)!;
        const date = parseISO(dateKey);

        return (
          <div key={dateKey} className="master-view-day">
            <div className="master-view-day-header">
              <h2>{format(date, 'EEEE, MMMM d, yyyy')}</h2>
              <span className="session-count">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="master-view-timeline">
              <div className="timeline-hours">
                {timeSlots.map((slot) => (
                  <div key={slot} className="timeline-hour">
                    {slot}
                  </div>
                ))}
              </div>

              <div className="timeline-content">
                {sessions.map((session) => {
                  const position = getSessionPosition(session);
                  const color = departmentColors.get(session.department) || '#6B7280';
                  const startDate = parseISO(session.startDateTime);

                  return (
                    <div
                      key={session.id}
                      className="timeline-session"
                      style={{
                        top: `${position.top}px`,
                        height: `${position.height}px`,
                        backgroundColor: color,
                        '--session-color': color,
                      } as React.CSSProperties}
                      title={`${session.sessionName} - ${session.department}`}
                    >
                      <div className="timeline-session-content">
                        <div className="timeline-session-name">{session.sessionName}</div>
                        <div className="timeline-session-time">
                          {format(startDate, 'h:mm a')} -{' '}
                          {format(addMinutes(startDate, session.duration), 'h:mm a')}
                        </div>
                        <div className="timeline-session-dept">{session.department}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
