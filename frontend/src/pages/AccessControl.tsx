import React, { useState } from 'react';
import { CodeEntry } from '../components/CodeEntry';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './AccessControl.css';

export const AccessControl: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const uniqueIdentifier = searchParams.get('id') || '';

  const handleSuccess = () => {
    navigate('/schedule');
  };

  if (!uniqueIdentifier) {
    return (
      <div className="access-control-error">
        <h2>Invalid Link</h2>
        <p>This link is missing a unique identifier. Please check your link and try again.</p>
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => navigate('/login')}
            className="admin-login-link"
          >
            Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="access-control">
      <CodeEntry uniqueIdentifier={uniqueIdentifier} onSuccess={handleSuccess} />
    </div>
  );
};
