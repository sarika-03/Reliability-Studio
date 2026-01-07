import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SLOCard } from '../components/SLOCard';
import { IncidentHistoryChart } from '../components/IncidentHistoryChart';
import { MTTRTrendChart } from '../components/MTTRTrendChart';
import { Service } from '../../models/Service';
import { SLO } from '../../models/SLO';
import { Incident } from '../../models/Incident';
import { servicesApi } from '../api/services';

export const ServiceReliabilityPage = () => {
    const { id } = useParams<{ id: string }>();
    const [service, setService] = useState<Service | null>(null);
    const [slos, setSlos] = useState<SLO[]>([]);
    const [incidents, setIncidents] = useState<Incident[]>([]);

    useEffect(() => {
        loadServiceData();
    }, [id]);

    const loadServiceData = async () => {
        try {
            if (!id) return;
            const serviceData = await servicesApi.get(id);
            setService(serviceData);
            setSlos([]);
            setIncidents([]);
        } catch (error) {
            console.error('Failed to load service data:', error);
        }
    };

    if (!service) {
        return <div style={styles.loading}>Loading...</div>;
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>{service.name}</h1>
                <div style={styles.metadata}>
                    <span>Team: {service.owner_team || 'Unassigned'}</span>
                    <span>Status: {service.status}</span>
                </div>
            </div>

            <div style={styles.sloGrid}>
                {slos.length === 0 ? (
                    <p style={styles.empty}>No SLOs configured for this service</p>
                ) : (
                    slos.map(slo => (
                        <SLOCard key={slo.id} slo={slo} />
                    ))
                )}
            </div>

            <div style={styles.metrics}>
                <div style={styles.metricsHalf}>
                    <IncidentHistoryChart incidents={incidents} />
                </div>
                <div style={styles.metricsHalf}>
                    <MTTRTrendChart incidents={incidents} />
                </div>
            </div>

            <div style={styles.recentIncidents}>
                <h2 style={styles.heading}>Recent Incidents</h2>
                {incidents.length === 0 ? (
                    <p style={styles.empty}>No recent incidents</p>
                ) : (
                    <ul style={styles.incidentList}>
                        {incidents.slice(0, 5).map(incident => (
                            <li key={incident.id} style={styles.incidentItem}>
                                {incident.title} - {incident.status}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

const styles = {
  container: {
    padding: '20px',
  } as React.CSSProperties,
  header: {
    marginBottom: '24px',
  } as React.CSSProperties,
  title: {
    margin: '0 0 8px 0',
    fontSize: '28px',
    fontWeight: 600,
  } as React.CSSProperties,
  metadata: {
    display: 'flex',
    gap: '24px',
    fontSize: '14px',
    color: '#666',
  } as React.CSSProperties,
  sloGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  } as React.CSSProperties,
  metrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  } as React.CSSProperties,
  metricsHalf: {},
  recentIncidents: {
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
  } as React.CSSProperties,
  heading: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: 600,
  } as React.CSSProperties,
  incidentList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  } as React.CSSProperties,
  incidentItem: {
    padding: '8px 0',
    borderBottom: '1px solid #eee',
    fontSize: '13px',
  } as React.CSSProperties,
  empty: {
    color: '#999',
    fontStyle: 'italic',
  } as React.CSSProperties,
  loading: {
    padding: '20px',
    textAlign: 'center',
    color: '#999',
  } as React.CSSProperties,
};