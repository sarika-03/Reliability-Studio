import React, { useState } from 'react';
import { Incident } from '../../models/Incident';
import { incidentsApi } from '../api/incidents';

interface IncidentHeaderProps {
  incident: Incident;
  onUpdate: () => void;
}

export const IncidentHeader: React.FC<IncidentHeaderProps> = ({ incident, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(incident.title);
  const [description, setDescription] = useState(incident.description);
  const [severity, setSeverity] = useState(incident.severity);

  const handleSave = async () => {
    try {
      await incidentsApi.update(incident.id, {
        title,
        description,
        severity,
      });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update incident:', error);
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical':
        return '#d32f2f';
      case 'high':
        return '#f57c00';
      case 'medium':
        return '#fbc02d';
      case 'low':
        return '#388e3c';
      default:
        return '#757575';
    }
  };

  return (
    <div style={styles.header}>
      <div style={styles.titleSection}>
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
          />
        ) : (
          <h1 style={styles.title}>{incident.title}</h1>
        )}
        <span
          style={{
            ...styles.severity,
            backgroundColor: getSeverityColor(incident.severity),
          }}
        >
          {incident.severity.toUpperCase()}
        </span>
      </div>

      {isEditing ? (
        <div style={styles.editSection}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={styles.textarea}
          />
          <button onClick={handleSave} style={styles.button}>
            Save
          </button>
          <button onClick={() => setIsEditing(false)} style={styles.buttonSecondary}>
            Cancel
          </button>
        </div>
      ) : (
        <div style={styles.descriptionSection}>
          <p style={styles.description}>{incident.description}</p>
          <button onClick={() => setIsEditing(true)} style={styles.buttonSecondary}>
            Edit
          </button>
        </div>
      )}

      <div style={styles.metadata}>
        <div>Status: <strong>{incident.status}</strong></div>
        <div>Started: <strong>{new Date(incident.started_at).toLocaleString()}</strong></div>
        {incident.resolved_at && (
          <div>
            Resolved: <strong>{new Date(incident.resolved_at).toLocaleString()}</strong>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  header: {
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #ddd',
  } as React.CSSProperties,
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '12px',
  } as React.CSSProperties,
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 600,
  } as React.CSSProperties,
  severity: {
    padding: '4px 12px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 600,
  } as React.CSSProperties,
  descriptionSection: {
    marginBottom: '16px',
  } as React.CSSProperties,
  description: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    color: '#666',
  } as React.CSSProperties,
  editSection: {
    marginBottom: '16px',
  } as React.CSSProperties,
  input: {
    padding: '8px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    width: '100%',
    marginBottom: '8px',
  } as React.CSSProperties,
  textarea: {
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    width: '100%',
    minHeight: '80px',
    fontFamily: 'inherit',
    marginBottom: '8px',
  } as React.CSSProperties,
  button: {
    padding: '8px 16px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '8px',
    fontSize: '14px',
  } as React.CSSProperties,
  buttonSecondary: {
    padding: '8px 16px',
    backgroundColor: '#e0e0e0',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  } as React.CSSProperties,
  metadata: {
    display: 'flex',
    gap: '24px',
    fontSize: '13px',
    color: '#666',
  } as React.CSSProperties,
};
