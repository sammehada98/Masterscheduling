import React from 'react';
import { format, parseISO } from 'date-fns';
import type { Session, Department } from '../types';
import './SessionList.css';

interface SessionListProps {
  sessions: Session[];
  department: Department;
  departmentColor: string;
  isAdmin: boolean;
  onEdit?: (session: Session) => void;
  onDelete?: (sessionId: string) => void;
}

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  department,
  departmentColor,
  isAdmin,
  onEdit,
  onDelete,
}) => {
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
  };

  const sortedSessions = [...sessions].sort((a, b) => {
    return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
  });

  if (sortedSessions.length === 0) {
    return (
      <div className="session-list-empty">
        <p>No sessions scheduled for {department}</p>
      </div>
    );
  }

  return (
    <div className="session-list">
      {sortedSessions.map((session) => {
        const startDate = parseISO(session.startDateTime);
        const endDate = new Date(startDate.getTime() + session.duration * 60000);

        return (
          <div
            key={session.id}
            className="session-card"
            style={{ borderLeftColor: departmentColor }}
          >
            <div className="session-card-header">
              <div className="session-card-title">
                <h3>{session.sessionName}</h3>
                <span className="session-code">{session.sessionCode}</span>
              </div>
              {isAdmin && (
                <div className="session-card-actions">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(session)}
                      className="session-action-button edit"
                      aria-label="Edit session"
                    >
                      ✏️
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(session.id)}
                      className="session-action-button delete"
                      aria-label="Delete session"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="session-card-content">
              {session.description && (
                <p className="session-description">{session.description}</p>
              )}

              <div className="session-details">
                <div className="session-detail-item">
                  <span className="detail-label">Time:</span>
                  <span className="detail-value">
                    {format(startDate, 'MMM d, yyyy h:mm a')} -{' '}
                    {format(endDate, 'h:mm a')}
                  </span>
                </div>

                <div className="session-detail-item">
                  <span className="detail-label">Duration:</span>
                  <span className="detail-value">{formatDuration(session.duration)}</span>
                </div>

                {session.academyCourse && (
                  <div className="session-detail-item">
                    <span className="detail-label">Course:</span>
                    <span className="detail-value">{session.academyCourse}</span>
                  </div>
                )}

                {session.attendeeType && (
                  <div className="session-detail-item">
                    <span className="detail-label">Attendees:</span>
                    <span className="detail-value">{session.attendeeType}</span>
                  </div>
                )}

                {session.sessionCount > 1 && (
                  <div className="session-detail-item">
                    <span className="detail-label">Session Count:</span>
                    <span className="detail-value">{session.sessionCount}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
