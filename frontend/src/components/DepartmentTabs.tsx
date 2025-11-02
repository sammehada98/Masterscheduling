import React from 'react';
import type { Department } from '../types';
import './DepartmentTabs.css';

interface DepartmentTabsProps {
  activeTab: Department | 'Master';
  onTabChange: (tab: Department | 'Master') => void;
  accessibleDepartments: Department[];
  isAdmin: boolean;
}

const DEPARTMENTS: Department[] = ['Parts', 'Service', 'Sales', 'Accounting'];

export const DepartmentTabs: React.FC<DepartmentTabsProps> = ({
  activeTab,
  onTabChange,
  accessibleDepartments,
  isAdmin,
}) => {
  const getDepartmentColor = (dept: Department | 'Master'): string => {
    const colors: { [key: string]: string } = {
      Parts: '#3B82F6',
      Service: '#10B981',
      Sales: '#F59E0B',
      Accounting: '#8B5CF6',
      Master: '#6366F1',
    };
    return colors[dept] || '#6B7280';
  };

  const canAccessDepartment = (dept: Department): boolean => {
    return isAdmin || accessibleDepartments.includes(dept);
  };

  return (
    <div className="department-tabs">
      <div className="department-tabs-container">
        {DEPARTMENTS.map((dept) => {
          const canAccess = canAccessDepartment(dept);
          return (
            <button
              key={dept}
              className={`department-tab ${activeTab === dept ? 'active' : ''} ${
                !canAccess ? 'disabled' : ''
              }`}
              onClick={() => canAccess && onTabChange(dept)}
              disabled={!canAccess}
              style={{
                '--tab-color': getDepartmentColor(dept),
              } as React.CSSProperties}
            >
              {dept}
              {!canAccess && <span className="tab-lock">🔒</span>}
            </button>
          );
        })}
        <button
          className={`department-tab ${activeTab === 'Master' ? 'active' : ''}`}
          onClick={() => onTabChange('Master')}
          style={{
            '--tab-color': getDepartmentColor('Master'),
          } as React.CSSProperties}
        >
          Master
        </button>
      </div>
    </div>
  );
};
