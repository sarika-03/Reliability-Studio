import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TabsBar, Tab, TabContent } from '@grafana/ui';
import { IncidentHeader } from '../components/IncidentHeader';
import { BlastRadiusView } from '../components/BlastRadiusView';
import { TimelineView } from '../components/TimelineView';
import { MetricsTab } from '../components/tabs/MetricsTab';
import { LogsTab } from '../components/tabs/LogsTab';
import { TracesTab } from '../components/tabs/TracesTab';
import { KubernetesTab } from '../components/tabs/KubernetesTab';
import { TaskList } from '../components/TaskList';
import { SLOStatus } from '../components/SLOStatus';
import { incidentsApi } from '../api/incidents';
import { Incident } from '../../models/Incident';

export const IncidentWorkspacePage = () => {
    const { id } = useParams<{ id: string }>();
    const [incident, setIncident] = useState<Incident | null>(null);
    const [activeTab, setActiveTab] = useState('timeline');

    useEffect(() => {
        loadIncident();
    }, [id]);

    const loadIncident = async () => {
        if (!id) return;
        const data = await incidentsApi.get(id);
        setIncident(data);
    };

    if (!incident) return <div>Loading...</div>;

    return (
        <div className="incident-workspace">
            <IncidentHeader incident={incident} onUpdate={loadIncident} />

            <div className="workspace-grid">
                <div className="main-content">
                    <BlastRadiusView services={incident.services ?? []} />

                    <TabsBar>
                        <Tab label="Timeline" active={activeTab === 'timeline'} onChangeTab={() => setActiveTab('timeline')} />
                        <Tab label="Metrics" active={activeTab === 'metrics'} onChangeTab={() => setActiveTab('metrics')} />
                        <Tab label="Logs" active={activeTab === 'logs'} onChangeTab={() => setActiveTab('logs')} />
                        <Tab label="Traces" active={activeTab === 'traces'} onChangeTab={() => setActiveTab('traces')} />
                        <Tab label="Kubernetes" active={activeTab === 'k8s'} onChangeTab={() => setActiveTab('k8s')} />
                    </TabsBar>

                    <TabContent>
                        {activeTab === 'timeline' && <TimelineView incidentId={id} />}
                        {activeTab === 'metrics' && <MetricsTab incident={incident} />}
                        {activeTab === 'logs' && <LogsTab incident={incident} />}
                        {activeTab === 'traces' && <TracesTab incident={incident} />}
                        {activeTab === 'k8s' && <KubernetesTab incident={incident} />}
                    </TabContent>
                </div>

                <div className="sidebar">
                    <SLOStatus services={incident.services ?? []} />
                    <TaskList incidentId={id} />
                </div>
            </div>
        </div>
    );
};