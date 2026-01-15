import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { IncidentCard } from '../components/IncidentCard';
import { Incident } from '../../models/Incident';
import { incidentsApi } from '../api/incidents';

export const IncidentsListPage = () => {
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [filter, setFilter] = useState('open');
    const [loading, setLoading] = useState(true);
    const styles = useStyles2(getStyles);

    useEffect(() => {
        loadIncidents();
    }, [filter]);

    const loadIncidents = async () => {
        setLoading(true);
        try {
            const data = await incidentsApi.list();
            // Filter based on selected filter
            const filtered = filter === 'open' 
                ? (Array.isArray(data) ? data.filter((i: Incident) => i.status === 'open') : [])
                : (Array.isArray(data) ? data : []);
            setIncidents(filtered);
        } catch (error) {
            console.error('Failed to load incidents:', error);
            setIncidents([]);
        } finally {
            setLoading(false);
        }
    };

    const createNewIncident = () => {
        // Navigate to create new incident form or show modal
        console.log('Create new incident');
    };

    const navigateToIncident = (incidentId: string) => {
        navigate(`/a/grafana-reliability-control-plane/incident/${incidentId}`);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Incidents</h1>
                <button onClick={() => createNewIncident()}>
                    + New Incident
                </button>
            </div>

            <div className={styles.filters}>
                <button
                    className={filter === 'open' ? styles.activeFilter : ''}
                    onClick={() => setFilter('open')}
                >
                    Open ({incidents.filter((i: Incident) => i.status === 'open').length})
                </button>
                <button
                    className={filter === 'all' ? styles.activeFilter : ''}
                    onClick={() => setFilter('all')}
                >
                    All
                </button>
            </div>

            {loading ? (
                <div className={styles.emptyState}>Loading incidents...</div>
            ) : incidents.length === 0 ? (
                <div className={styles.emptyState}>
                    <h3>No Incidents Found</h3>
                    <p>
                        {filter === 'open'
                            ? 'All services are running smoothly. No open incidents detected.'
                            : 'No incidents in your system yet. Start testing with the test endpoints to generate sample data.'}
                    </p>
                </div>
            ) : (
                <div className={styles.list}>
                    {incidents.map((incident: Incident) => (
                        <IncidentCard
                            key={incident.id}
                            incident={incident}
                            onClick={() => navigateToIncident(incident.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const getStyles = (theme: GrafanaTheme2) => ({
    container: css`
      padding: ${theme.spacing(3)};
    `,
    header: css`
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: ${theme.spacing(3)};
    `,
    filters: css`
      display: flex;
      gap: ${theme.spacing(1)};
      margin-bottom: ${theme.spacing(2)};
    `,
    activeFilter: css`
      background-color: ${theme.colors.primary.main};
      color: white;
    `,
    list: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(1)};
    `,
    emptyState: css`
      text-align: center;
      padding: ${theme.spacing(6)};
      background-color: ${theme.colors.background.secondary};
      border-radius: 4px;
      border: 1px solid ${theme.colors.border.weak};
      
      h3 {
        color: ${theme.colors.text.primary};
        margin-bottom: ${theme.spacing(1)};
      }
      
      p {
        color: ${theme.colors.text.secondary};
        margin: 0;
      }
    `,
});