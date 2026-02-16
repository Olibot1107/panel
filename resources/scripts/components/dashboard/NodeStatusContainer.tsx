import React, { useEffect } from 'react';
import useSWR from 'swr';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faHdd, faMemory, faMicrochip, faServer } from '@fortawesome/free-solid-svg-icons';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';
import getNodeStatuses, { NodeStatus } from '@/api/getNodeStatuses';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { Redirect } from 'react-router-dom';

type Tone = 'green' | 'yellow' | 'red';

const fmtPercent = (value: number | null) => (value === null ? '--' : `${value.toFixed(1)}%`);
const fmtMb = (value: number) => `${value.toLocaleString()} MB`;
const fmtMbOrDash = (value: number | null) => (value === null ? '--' : fmtMb(value));

const clampPercent = (value: number | null) => {
    if (value === null) return 0;
    return Math.max(0, Math.min(100, value));
};

const statusTone = (online: boolean, maintenance: boolean): Tone => {
    if (!online) return 'red';
    if (maintenance) return 'yellow';
    return 'green';
};

const usageTone = (percent: number | null, online: boolean, maintenance: boolean): Tone => {
    if (!online) return 'red';
    if (maintenance) return 'yellow';
    if (percent !== null && percent >= 90) return 'red';
    if (percent !== null && percent >= 75) return 'yellow';
    return 'green';
};

const NodeGrid = styled.div`
    ${tw`grid gap-5`};
`;

const NodeCard = styled.article`
    ${tw`rounded-2xl p-6`};
    position: relative;
    overflow: hidden;
    background: linear-gradient(160deg, rgba(14, 22, 38, 0.95), rgba(8, 14, 25, 0.96));
    border: 1px solid rgba(var(--panel-accent-rgb, 239, 68, 68), 0.3);
    box-shadow: 0 18px 34px rgba(0, 0, 0, 0.34);

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: 0.2;
        background-image: radial-gradient(rgba(var(--panel-accent-rgb, 239, 68, 68), 0.28) 1px, transparent 1px);
        background-size: 20px 20px;
    }

    & > * {
        position: relative;
        z-index: 1;
    }
`;

const NodeHeader = styled.div`
    ${tw`flex items-center justify-between mb-4`};
`;

const NodeTitle = styled.div`
    ${tw`flex items-center text-neutral-100`};

    & > svg {
        ${tw`mr-2`};
        color: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.9);
    }

    & > span {
        ${tw`text-lg font-semibold`};
    }
`;

const StatusBadge = styled.span<{ $tone: Tone }>`
    ${tw`text-xs uppercase tracking-wide px-3 py-1 rounded-lg border`};

    ${({ $tone }) => {
        if ($tone === 'red') {
            return `
                color: #fecaca;
                border-color: rgba(248, 113, 113, 0.45);
                background: rgba(127, 29, 29, 0.35);
            `;
        }

        if ($tone === 'yellow') {
            return `
                color: #fef3c7;
                border-color: rgba(251, 191, 36, 0.45);
                background: rgba(120, 53, 15, 0.35);
            `;
        }

        return `
            color: #f8fafc;
            border-color: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.45);
            background: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.3);
        `;
    }}
`;

const MetricsGrid = styled.div`
    ${tw`grid gap-3 md:grid-cols-3`};
`;

const MetricCardShell = styled.div`
    ${tw`rounded-xl p-4`};
    background: linear-gradient(165deg, rgba(24, 34, 52, 0.86), rgba(16, 24, 39, 0.86));
    border: 1px solid rgba(71, 85, 105, 0.34);
`;

const MetricHead = styled.div`
    ${tw`flex items-center justify-between`};
`;

const MetricTitle = styled.div`
    ${tw`flex items-center text-neutral-200`};

    & > svg {
        ${tw`mr-2`};
        color: rgba(148, 163, 184, 0.95);
    }

    & > span {
        ${tw`text-xs uppercase tracking-wide`};
    }
`;

const MetricPercent = styled.span`
    ${tw`text-xs text-neutral-400`};
`;

const MetricPrimary = styled.p`
    ${tw`mt-2 text-2xl text-neutral-100 font-semibold`};
`;

const MetricSecondary = styled.p`
    ${tw`text-sm text-neutral-400`};
`;

const Meter = styled.div`
    ${tw`mt-3 h-2 rounded overflow-hidden`};
    background: rgba(71, 85, 105, 0.42);
`;

const MeterFill = styled.div<{ $tone: Tone }>`
    ${tw`h-full transition-all duration-300`};

    ${({ $tone }) => {
        if ($tone === 'red') {
            return 'background: linear-gradient(90deg, rgba(248, 113, 113, 0.95), rgba(220, 38, 38, 0.9));';
        }

        if ($tone === 'yellow') {
            return 'background: linear-gradient(90deg, rgba(251, 191, 36, 0.95), rgba(245, 158, 11, 0.9));';
        }

        return 'background: linear-gradient(90deg, rgba(var(--panel-accent-rgb, 239, 68, 68), 0.95), rgba(var(--panel-accent-rgb, 239, 68, 68), 0.72));';
    }}
`;

const EmptyState = styled.p`
    ${tw`text-center text-sm text-neutral-400`};
`;

const MetricCard = ({
    icon,
    label,
    primary,
    secondary,
    percent,
    tone,
}: {
    icon: IconDefinition;
    label: string;
    primary: string;
    secondary: string;
    percent: number | null;
    tone: Tone;
}) => (
    <MetricCardShell>
        <MetricHead>
            <MetricTitle>
                <FontAwesomeIcon icon={icon} />
                <span>{label}</span>
            </MetricTitle>
            <MetricPercent>{fmtPercent(percent)}</MetricPercent>
        </MetricHead>
        <MetricPrimary>{primary}</MetricPrimary>
        <MetricSecondary>{secondary}</MetricSecondary>
        <Meter>
            <MeterFill $tone={tone} style={{ width: `${clampPercent(percent)}%` }} />
        </Meter>
    </MetricCardShell>
);

export default () => {
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const isAdmin = useStoreState((state) => !!state.user.data?.rootAdmin);

    const { data, error } = useSWR<NodeStatus[]>('/api/client/nodes/status', getNodeStatuses);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'node-status', error });
        if (!error) clearFlashes('node-status');
    }, [error]);

    if (!isAdmin) return <Redirect to={'/'} />;

    return (
        <PageContentBlock title={'Node Status'} showFlashKey={'node-status'}>
            {!data ? (
                <Spinner centered size={'large'} />
            ) : data.length === 0 ? (
                <EmptyState>No nodes found.</EmptyState>
            ) : (
                <NodeGrid>
                    {data.map((node) => {
                        const tone = statusTone(node.online, node.maintenanceMode);

                        return (
                            <NodeCard key={node.uuid}>
                                <NodeHeader>
                                    <NodeTitle>
                                        <FontAwesomeIcon icon={faServer} />
                                        <span>{node.displayName}</span>
                                    </NodeTitle>
                                    <StatusBadge $tone={tone}>
                                        {!node.online ? 'Offline' : node.maintenanceMode ? 'Maintenance' : 'Online'}
                                    </StatusBadge>
                                </NodeHeader>
                                <MetricsGrid>
                                    <MetricCard
                                        icon={faMicrochip}
                                        label={'CPU'}
                                        primary={`${node.cpu.cores || '--'} Cores`}
                                        secondary={
                                            node.cpu.currentPercent === null
                                                ? 'Live load unavailable'
                                                : node.cpu.loadAverage1m === null
                                                  ? 'Current backend load'
                                                  : `Load avg (1m): ${node.cpu.loadAverage1m.toFixed(2)}`
                                        }
                                        percent={node.cpu.currentPercent}
                                        tone={usageTone(node.cpu.currentPercent, node.online, node.maintenanceMode)}
                                    />
                                    <MetricCard
                                        icon={faMemory}
                                        label={'Memory'}
                                        primary={`${fmtMbOrDash(node.memory.usedMb)} / ${fmtMb(node.memory.totalMb)}`}
                                        secondary={node.memory.usedMb === null ? 'Live usage unavailable' : 'Current backend usage'}
                                        percent={node.memory.usedPercent}
                                        tone={usageTone(node.memory.usedPercent, node.online, node.maintenanceMode)}
                                    />
                                    <MetricCard
                                        icon={faHdd}
                                        label={'Disk'}
                                        primary={`${fmtMbOrDash(node.disk.usedMb)} / ${fmtMb(node.disk.totalMb)}`}
                                        secondary={node.disk.usedMb === null ? 'Live usage unavailable' : 'Current backend usage'}
                                        percent={node.disk.usedPercent}
                                        tone={usageTone(node.disk.usedPercent, node.online, node.maintenanceMode)}
                                    />
                                </MetricsGrid>
                            </NodeCard>
                        );
                    })}
                </NodeGrid>
            )}
        </PageContentBlock>
    );
};
