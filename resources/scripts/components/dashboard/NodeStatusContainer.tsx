import React, { useEffect } from 'react';
import useSWR from 'swr';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHdd, faMemory, faMicrochip, faServer } from '@fortawesome/free-solid-svg-icons';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';
import ContentBox from '@/components/elements/ContentBox';
import getNodeStatuses, { NodeStatus } from '@/api/getNodeStatuses';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { Redirect } from 'react-router-dom';

const fmtPercent = (value: number | null) => (value === null ? '--' : `${value.toFixed(1)}%`);
const fmtMb = (value: number) => `${value.toLocaleString()} MB`;
const clampPercent = (value: number | null) => {
    if (value === null) return 0;
    return Math.max(0, Math.min(100, value));
};

const Meter = styled.div`
    ${tw`mt-2 h-2 rounded bg-neutral-800 overflow-hidden`};
`;

const MeterFill = styled.div<{ $tone: 'green' | 'yellow' | 'red' }>`
    ${tw`h-full transition-all duration-300`};

    ${({ $tone }) => ($tone === 'green' ? tw`bg-green-500` : $tone === 'yellow' ? tw`bg-yellow-500` : tw`bg-red-500`)};
`;

const statusTone = (online: boolean, maintenance: boolean): 'green' | 'yellow' | 'red' => {
    if (!online) return 'red';
    if (maintenance) return 'yellow';
    return 'green';
};

const StatusBadge = ({ online, maintenanceMode }: { online: boolean; maintenanceMode: boolean }) => {
    const tone = statusTone(online, maintenanceMode);

    return (
        <span
            css={[
                tw`text-xs uppercase tracking-wide px-2 py-1 rounded`,
                tone === 'green' ? tw`bg-green-500/20 text-green-300` : tone === 'yellow' ? tw`bg-yellow-500/20 text-yellow-300` : tw`bg-red-500/20 text-red-300`,
            ]}
        >
            {!online ? 'Offline' : maintenanceMode ? 'Maintenance' : 'Online'}
        </span>
    );
};

const MetricCard = ({
    icon,
    label,
    primary,
    secondary,
    percent,
    tone,
}: {
    icon: any;
    label: string;
    primary: string;
    secondary: string;
    percent: number | null;
    tone: 'green' | 'yellow' | 'red';
}) => (
    <div css={tw`rounded bg-neutral-900/40 p-3`}>
        <div css={tw`flex items-center justify-between`}>
            <div css={tw`flex items-center text-neutral-200`}>
                <FontAwesomeIcon icon={icon} css={tw`mr-2 text-neutral-400`} />
                <span css={tw`text-xs uppercase tracking-wide`}>{label}</span>
            </div>
            <span css={tw`text-xs text-neutral-400`}>{fmtPercent(percent)}</span>
        </div>
        <div css={tw`mt-2 text-sm text-neutral-100`}>{primary}</div>
        <div css={tw`text-xs text-neutral-400`}>{secondary}</div>
        <Meter>
            <MeterFill $tone={tone} style={{ width: `${clampPercent(percent)}%` }} />
        </Meter>
    </div>
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
                <p css={tw`text-center text-sm text-neutral-400`}>No nodes found.</p>
            ) : (
                <div css={tw`grid gap-4`}>
                    {data.map((node) => (
                        <ContentBox key={node.uuid}>
                            <div css={tw`space-y-4`}>
                                <div css={tw`flex items-center justify-between`}>
                                    <div css={tw`flex items-center text-neutral-300`}>
                                        <FontAwesomeIcon icon={faServer} css={tw`mr-2 text-neutral-400`} />
                                        <span css={tw`text-sm`}>{node.displayName}</span>
                                    </div>
                                    <StatusBadge online={node.online} maintenanceMode={node.maintenanceMode} />
                                </div>
                                <div css={tw`grid gap-3 md:grid-cols-3`}>
                                    <MetricCard
                                        icon={faMicrochip}
                                        label={'CPU'}
                                        primary={`${node.cpu.cores || '--'} Cores`}
                                        secondary={`Allocated Limit: ${node.cpu.allocatedLimit}%`}
                                        percent={node.cpu.allocatedPercent}
                                        tone={statusTone(node.online, node.maintenanceMode)}
                                    />
                                    <MetricCard
                                        icon={faMemory}
                                        label={'Memory'}
                                        primary={`${fmtMb(node.memory.allocatedMb)} / ${fmtMb(node.memory.totalMb)}`}
                                        secondary={'Allocated to servers'}
                                        percent={node.memory.allocatedPercent}
                                        tone={statusTone(node.online, node.maintenanceMode)}
                                    />
                                    <MetricCard
                                        icon={faHdd}
                                        label={'Disk'}
                                        primary={`${fmtMb(node.disk.allocatedMb)} / ${fmtMb(node.disk.totalMb)}`}
                                        secondary={'Allocated to servers'}
                                        percent={node.disk.allocatedPercent}
                                        tone={statusTone(node.online, node.maintenanceMode)}
                                    />
                                </div>
                            </div>
                        </ContentBox>
                    ))}
                </div>
            )}
        </PageContentBlock>
    );
};
