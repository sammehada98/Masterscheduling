import React, { useState } from 'react';
import { authService } from '../services/auth';
import './CodeEntry.css';

interface CodeEntryProps {
  uniqueIdentifier: string;
  onSuccess: () => void;
}

export const CodeEntry: React.FC<CodeEntryProps> = ({ uniqueIdentifier, onSuccess }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authService.validateCode(uniqueIdentifier, code);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="code-entry">
      <div className="code-entry-container">
        <h2>Enter Access Code</h2>
        <p className="code-entry-subtitle">
          Please enter your code to access the schedule
        </p>
        
        <form onSubmit={handleSubmit} className="code-entry-form">
          <div className="code-entry-input-group">
            <label htmlFor="code">Code</label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter your code"
              autoFocus
              required
              pattern="[A-Za-z0-9]{6,20}"
              title="Code must be 6-20 alphanumeric characters"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="code-entry-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="code-entry-button"
            disabled={loading || !code.trim()}
          >
            {loading ? 'Verifying...' : 'Access Schedule'}
          </button>
        </form>
      </div>
    </div>
  );
};
