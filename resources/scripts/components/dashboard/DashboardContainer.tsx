import React, { useEffect } from 'react';
import { Server } from '@/api/server/getServer';
import getServers from '@/api/getServers';
import ServerRow from '@/components/dashboard/ServerRow';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import tw from 'twin.macro';
import useSWR from 'swr';
import { PaginatedResult } from '@/api/http';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen, faServer } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components/macro';
import { useActivityLogs } from '@/api/account/activity';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '@/components/Avatar';
import { ActivityLog } from '@definitions/user';
import BlurredValue from '@/components/elements/BlurredValue';

const DashboardGrid = styled.div`
    ${tw`grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(19rem,1fr)]`};
`;

const SurfaceCard = styled.section`
    ${tw`rounded-xl p-5`};
    background: linear-gradient(145deg, rgba(11, 19, 34, 0.94), rgba(9, 16, 30, 0.96));
    border: 1px solid rgba(64, 98, 153, 0.28);
    box-shadow: 0 18px 45px rgba(1, 6, 18, 0.55);
`;

const HeroCard = styled(SurfaceCard)`
    background: radial-gradient(circle at 75% 30%, rgba(var(--panel-accent-rgb, 239, 68, 68), 0.35), transparent 42%),
        linear-gradient(135deg, rgba(13, 24, 46, 0.98), rgba(8, 14, 29, 0.96));
    border-color: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.38);

    & > h2 {
        ${tw`text-4xl font-semibold text-neutral-100`};
        letter-spacing: -0.02em;
    }

    & > p {
        ${tw`mt-2 text-neutral-300`};
    }
`;

const CardHeading = styled.div`
    ${tw`flex items-center justify-between mb-4`};

    & > h3 {
        ${tw`text-2xl font-semibold text-neutral-100`};
    }
`;

const CardHeadingAction = styled(Link)`
    ${tw`text-sm no-underline`};
    color: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.95);

    &:hover {
        color: rgba(var(--panel-accent-rgb, 239, 68, 68), 1);
    }
`;

const EmptyState = styled.div`
    ${tw`rounded-lg p-8 text-center`};
    background: rgba(5, 9, 18, 0.4);
    border: 1px solid rgba(55, 81, 126, 0.28);

    & > svg {
        ${tw`text-neutral-400 text-3xl mb-4`};
    }

    & > h4 {
        ${tw`text-lg text-neutral-200`};
    }

    & > p {
        ${tw`text-sm text-neutral-400 mt-2`};
    }
`;

const ProfileCard = styled(SurfaceCard)`
    ${tw`flex items-center`};
`;

const ProfileName = styled.div`
    ${tw`ml-4`};

    & > h3 {
        ${tw`text-2xl text-neutral-100 font-semibold`};
    }

    & > p {
        ${tw`text-sm text-neutral-400`};
    }
`;

const RoleBadge = styled.span`
    ${tw`inline-block text-xs rounded-md px-2 py-1 font-semibold mr-2 mb-2`};
    color: #f5c96b;
    background: rgba(113, 84, 20, 0.42);
    border: 1px solid rgba(184, 137, 45, 0.55);
`;

const ActivityItem = styled.div`
    ${tw`relative py-3 pl-10`};

    &:not(:last-of-type) {
        border-bottom: 1px solid rgba(65, 92, 139, 0.2);
    }

    &::before {
        content: '';
        position: absolute;
        left: 0.6rem;
        top: 1.5rem;
        bottom: -0.8rem;
        width: 1px;
        background: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.22);
    }

    &:last-of-type::before {
        display: none;
    }
`;

const ActivityDot = styled.span`
    ${tw`absolute rounded-full`};
    left: 0;
    top: 1rem;
    width: 1.35rem;
    height: 1.35rem;
    background: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.9);
    border: 3px solid rgba(12, 21, 37, 1);
    box-shadow: 0 0 0 1px rgba(var(--panel-accent-rgb, 239, 68, 68), 0.35);
`;

const ActivityTitle = styled.p`
    ${tw`text-neutral-100 text-sm font-medium`};
`;

const ActivityDetail = styled.p`
    ${tw`text-xs text-neutral-300 mt-1 line-clamp-1`};
`;

const ActivityTime = styled.p`
    ${tw`text-xs text-neutral-400 mt-1`};
`;

const eventDescription = (entry: ActivityLog): React.ReactNode => {
    if (entry.description && entry.description.trim().length > 0) {
        return entry.description;
    }

    if (entry.ip) {
        return (
            <>
                From <BlurredValue value={entry.ip} />
            </>
        );
    }

    return 'No additional details';
};

const AvatarRing = styled.span`
    ${tw`w-14 h-14 rounded-full overflow-hidden border p-[2px]`};
    border-color: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.5);
`;

const normalizeEventName = (event: string): string =>
    event
        .replace(/\./g, ' ')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (match) => match.toUpperCase());

export default () => {
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const username = useStoreState((state) => state.user.data!.username);
    const email = useStoreState((state) => state.user.data!.email);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(['/api/client/servers', 1], () =>
        getServers({ page: 1 })
    );

    const { data: activity, isValidating: activityLoading } = useActivityLogs(
        { page: 1, sorts: { timestamp: -1 } },
        { revalidateOnMount: true, revalidateOnFocus: false }
    );

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error]);
    const recentServers = servers?.items.slice(0, 2) || [];

    return (
        <PageContentBlock title={'Dashboard'} showFlashKey={'dashboard'}>
            <DashboardGrid>
                <div css={tw`space-y-6`}>
                    <HeroCard>
                        <h2>Welcome back, {username}</h2>
                        <p>Monitor your infrastructure and manage your services.</p>
                    </HeroCard>

                    <SurfaceCard>
                        <CardHeading>
                            <h3>Recent Servers</h3>
                            <CardHeadingAction to={'/servers'}>View All -&gt;</CardHeadingAction>
                        </CardHeading>
                        {!servers ? (
                            <Spinner centered size={'large'} />
                        ) : recentServers.length > 0 ? (
                            recentServers.map((server, index) => (
                                <div key={server.uuid} css={index > 0 ? tw`mt-3` : undefined}>
                                    <ServerRow server={server} />
                                </div>
                            ))
                        ) : (
                            <EmptyState>
                                <FontAwesomeIcon icon={faServer} />
                                <h4>No servers found</h4>
                                <p>Create your first server to get started.</p>
                            </EmptyState>
                        )}
                    </SurfaceCard>

                    <SurfaceCard>
                        <CardHeading>
                            <h3>Knowledge Base</h3>
                            <CardHeadingAction to={'/support/knowledge-base'}>View All -&gt;</CardHeadingAction>
                        </CardHeading>
                        <EmptyState>
                            <FontAwesomeIcon icon={faBookOpen} />
                            <h4>No featured articles yet</h4>
                            <p>Helpful guides and quick answers will appear here.</p>
                        </EmptyState>
                    </SurfaceCard>
                </div>

                <div css={tw`space-y-6`}>
                    <ProfileCard>
                        <AvatarRing>
                            <Avatar.User />
                        </AvatarRing>
                        <ProfileName>
                            <h3>{username}</h3>
                            <div>
                                <RoleBadge>{rootAdmin ? 'Admin' : 'User'}</RoleBadge>
                            </div>
                            <p>@{email.split('@')[0]}</p>
                        </ProfileName>
                    </ProfileCard>

                    <SurfaceCard>
                        <CardHeading>
                            <h3>Recent Activity</h3>
                            <CardHeadingAction to={'/account/activity'}>View All -&gt;</CardHeadingAction>
                        </CardHeading>
                        {!activity && activityLoading ? (
                            <Spinner centered size={'small'} />
                        ) : activity?.items.length ? (
                            activity.items.slice(0, 4).map((entry) => (
                                <ActivityItem key={entry.id}>
                                    <ActivityDot />
                                    <ActivityTitle>{normalizeEventName(entry.event)}</ActivityTitle>
                                    <ActivityDetail>{eventDescription(entry)}</ActivityDetail>
                                    <ActivityTime>
                                        {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                                    </ActivityTime>
                                </ActivityItem>
                            ))
                        ) : (
                            <EmptyState>
                                <FontAwesomeIcon icon={faServer} />
                                <h4>No recent activity</h4>
                                <p>Account events will show up here as they happen.</p>
                            </EmptyState>
                        )}
                    </SurfaceCard>
                </div>
            </DashboardGrid>
        </PageContentBlock>
    );
};
