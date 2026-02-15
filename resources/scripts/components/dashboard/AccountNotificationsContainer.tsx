import React, { useEffect, useMemo, useState } from 'react';
import PageContentBlock from '@/components/elements/PageContentBlock';
import ContentBox from '@/components/elements/ContentBox';
import FlashMessageRender from '@/components/FlashMessageRender';
import Spinner from '@/components/elements/Spinner';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import { useFlashKey } from '@/plugins/useFlash';
import useFlash from '@/plugins/useFlash';
import {
    deleteAccountNotification,
    markAccountNotificationRead,
    markAllAccountNotificationsRead,
    useAccountNotifications,
} from '@/api/account/notifications';
import { AccountNotification } from '@definitions/user';
import { formatDistanceToNow } from 'date-fns';
import classNames from 'classnames';
import { styles as btnStyles } from '@/components/elements/button/index';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBan,
    faBell,
    faCheckCircle,
    faFilter,
    faServer,
    faExclamationTriangle,
    faTrash,
    faUserPlus,
} from '@fortawesome/free-solid-svg-icons';
import { useHistory } from 'react-router-dom';

type NotificationKindFilter = 'all' | 'unread' | 'crash' | 'invite' | 'changes';

const kindMeta = (kind: string | null) => {
    switch (kind) {
        case 'server_crash':
            return {
                label: 'Crash',
                icon: faExclamationTriangle,
                pill: 'bg-red-500/18 text-red-100 border border-red-500/30',
                accent: 'bg-red-500',
            };
        case 'server_invite':
            return {
                label: 'Invite',
                icon: faUserPlus,
                pill: 'bg-cyan-500/18 text-cyan-100 border border-cyan-500/30',
                accent: 'bg-cyan-400',
            };
        case 'server_created':
            return {
                label: 'Created',
                icon: faServer,
                pill: 'bg-emerald-500/18 text-emerald-100 border border-emerald-500/30',
                accent: 'bg-emerald-400',
            };
        case 'server_deleted':
            return {
                label: 'Deleted',
                icon: faTrash,
                pill: 'bg-rose-500/18 text-rose-100 border border-rose-500/30',
                accent: 'bg-rose-400',
            };
        case 'server_suspended':
            return {
                label: 'Suspended',
                icon: faBan,
                pill: 'bg-yellow-500/18 text-yellow-100 border border-yellow-500/30',
                accent: 'bg-yellow-400',
            };
        case 'server_unsuspended':
            return {
                label: 'Restored',
                icon: faCheckCircle,
                pill: 'bg-emerald-500/18 text-emerald-100 border border-emerald-500/30',
                accent: 'bg-emerald-400',
            };
        default:
            return {
                label: 'Other',
                icon: faBell,
                pill: 'bg-neutral-500/18 text-neutral-100 border border-neutral-500/30',
                accent: 'bg-neutral-400',
            };
    }
};

const Surface = styled.div`
    ${tw`rounded-xl overflow-hidden`};
    background: linear-gradient(140deg, rgba(15, 23, 38, 0.88), rgba(9, 15, 27, 0.92));
    border: 1px solid rgba(var(--panel-accent-rgb, 239, 68, 68), 0.18);
`;

const ControlsRow = styled.div`
    ${tw`flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4`};
`;

const Filters = styled.div`
    ${tw`flex flex-wrap items-center gap-2`};
`;

const FilterPill = styled.button<{ $active?: boolean }>`
    ${tw`inline-flex items-center gap-2 text-xs uppercase tracking-wide px-3 py-2 rounded-full transition-colors`};
    border: 1px solid rgba(148, 163, 184, 0.22);
    background: rgba(15, 23, 38, 0.6);
    color: rgba(226, 232, 240, 0.85);

    ${({ $active }) =>
        $active &&
        `
        background: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.22);
        border-color: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.38);
        color: rgba(255, 245, 245, 0.95);
    `}

    &:hover {
        background: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.16);
        border-color: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.28);
    }
`;

const RightActions = styled.div`
    ${tw`flex items-center gap-2 md:justify-end`};
`;

const NotificationCard = styled.div<{ $unread?: boolean }>`
    ${tw`relative rounded-xl p-4 md:p-5`};
    background: rgba(8, 14, 26, 0.66);
    border: 1px solid rgba(148, 163, 184, 0.18);

    ${({ $unread }) =>
        $unread &&
        `
        background: rgba(8, 14, 26, 0.8);
        border-color: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.22);
    `}
`;

const CardAccent = styled.div<{ $className: string }>`
    ${tw`absolute left-0 top-3 bottom-3 w-1 rounded-full opacity-90`};
`;

const IconBubble = styled.div<{ $unread?: boolean }>`
    ${tw`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0`};
    background: rgba(2, 6, 23, 0.45);
    border: 1px solid rgba(148, 163, 184, 0.18);
    ${({ $unread }) => $unread && `border-color: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.24);`}
`;

const NotificationRow = ({
    notification,
    onOpen,
    onMarkRead,
    onDelete,
}: {
    notification: AccountNotification;
    onOpen: () => void;
    onMarkRead: () => void;
    onDelete: () => void;
}) => {
    const createdAt = notification.createdAt || new Date();
    const isUnread = !notification.readAt;
    const meta = kindMeta(notification.kind);

    return (
        <NotificationCard $unread={isUnread}>
            <CardAccent className={meta.accent} $className={meta.accent} />
            <div className={'flex items-start gap-4'}>
                <IconBubble $unread={isUnread}>
                    <FontAwesomeIcon icon={meta.icon} className={'text-neutral-100'} />
                </IconBubble>
                <div className={'min-w-0 flex-1'}>
                    <div className={'flex items-center gap-2 flex-wrap'}>
                        <span className={classNames('text-xs uppercase tracking-wide px-2 py-1 rounded', meta.pill)}>
                            {meta.label}
                        </span>
                        {isUnread && (
                            <span className={'inline-flex items-center gap-2 text-xs text-yellow-200'}>
                                <span className={'w-2 h-2 rounded-full bg-yellow-300'} />
                                Unread
                            </span>
                        )}
                        <span className={'text-xs text-neutral-400 ml-auto'}>
                            {formatDistanceToNow(createdAt, { addSuffix: true })}
                        </span>
                    </div>
                    <p className={'text-neutral-100 mt-2 font-semibold break-words'}>
                        {notification.title || 'Notification'}
                    </p>
                    {notification.message && (
                        <p className={'text-neutral-300 mt-1 leading-relaxed break-words'}>{notification.message}</p>
                    )}
                </div>
                <div className={'flex flex-col sm:flex-row gap-2 flex-shrink-0 w-full sm:w-auto'}>
                    {notification.actionUrl && (
                        <a
                            className={classNames(btnStyles.button, btnStyles.primary, btnStyles.small, 'w-full sm:w-auto')}
                            href={notification.actionUrl}
                            onClick={(e) => {
                                e.preventDefault();
                                onOpen();
                            }}
                        >
                            Open
                        </a>
                    )}
                    {isUnread && (
                        <button
                            className={classNames(
                                btnStyles.button,
                                btnStyles.text,
                                btnStyles.small,
                                btnStyles.secondary,
                                'w-full sm:w-auto'
                            )}
                            onClick={onMarkRead}
                        >
                            Mark read
                        </button>
                    )}
                    <button
                        className={classNames(
                            btnStyles.button,
                            btnStyles.danger,
                            btnStyles.small,
                            btnStyles.secondary,
                            'w-full sm:w-auto'
                        )}
                        onClick={onDelete}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </NotificationCard>
    );
};

export default () => {
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('account:notifications');
    const { addFlash } = useFlash();
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState<NotificationKindFilter>('all');
    const history = useHistory();
    const { data, isValidating, error, mutate } = useAccountNotifications({ page, per_page: 25 });

    useEffect(() => {
        clearAndAddHttpError(error);
    }, [error]);

    const items = useMemo(() => data?.items || [], [data]);
    const unreadInPage = useMemo(() => items.filter((n) => !n.readAt).length, [items]);

    const visible = useMemo(() => {
        const allowed = new Set([
            'server_crash',
            'server_invite',
            'server_created',
            'server_deleted',
            'server_suspended',
            'server_unsuspended',
        ]);

        const base = items.filter((n) => allowed.has(n.kind || ''));

        if (filter === 'unread') return base.filter((n) => !n.readAt);
        if (filter === 'crash') return base.filter((n) => n.kind === 'server_crash');
        if (filter === 'invite') return base.filter((n) => n.kind === 'server_invite');
        if (filter === 'changes')
            return base.filter(
                (n) =>
                    n.kind === 'server_created' ||
                    n.kind === 'server_deleted' ||
                    n.kind === 'server_suspended' ||
                    n.kind === 'server_unsuspended'
            );

        return base;
    }, [items, filter]);

    const navigateTo = (actionUrl: string) => {
        try {
            const url = new URL(actionUrl, window.location.origin);
            if (url.origin === window.location.origin) {
                history.push(url.pathname + url.search + url.hash);
                return;
            }
        } catch {
            // ignore
        }

        window.location.assign(actionUrl);
    };

    const handleMarkRead = async (id: string) => {
        clearFlashes();
        try {
            await markAccountNotificationRead(id);
            await mutate();
        } catch (e: unknown) {
            clearAndAddHttpError(e instanceof Error ? e : String(e));
        }
    };

    const handleDelete = async (id: string) => {
        clearFlashes();
        try {
            await deleteAccountNotification(id);
            await mutate();
        } catch (e: unknown) {
            clearAndAddHttpError(e instanceof Error ? e : String(e));
        }
    };

    const handleReadAll = async () => {
        clearFlashes();
        try {
            await markAllAccountNotificationsRead();
            addFlash({ key: 'account:notifications', type: 'success', message: 'Marked all notifications as read.' });
            await mutate();
        } catch (e: unknown) {
            clearAndAddHttpError(e instanceof Error ? e : String(e));
        }
    };

    return (
        <PageContentBlock title={'Notifications'}>
            <FlashMessageRender byKey={'account:notifications'} />
            <ContentBox
                title={'Server Notifications'}
                showLoadingOverlay={!data && isValidating}
                className={'mb-6'}
            >
                <ControlsRow>
                    <Filters>
                        <span className={'text-xs uppercase tracking-wide text-neutral-400 inline-flex items-center gap-2'}>
                            <FontAwesomeIcon icon={faFilter} />
                            Filter
                        </span>
                        <FilterPill $active={filter === 'all'} onClick={() => setFilter('all')}>
                            All
                        </FilterPill>
                        <FilterPill $active={filter === 'unread'} onClick={() => setFilter('unread')}>
                            Unread <span className={'text-neutral-200/80'}>{data?.unreadCount ?? unreadInPage}</span>
                        </FilterPill>
                        <FilterPill $active={filter === 'crash'} onClick={() => setFilter('crash')}>
                            Crashes
                        </FilterPill>
                        <FilterPill $active={filter === 'invite'} onClick={() => setFilter('invite')}>
                            Invites
                        </FilterPill>
                        <FilterPill $active={filter === 'changes'} onClick={() => setFilter('changes')}>
                            Changes
                        </FilterPill>
                    </Filters>
                    <RightActions>
                        <button
                            className={classNames(btnStyles.button, btnStyles.text, btnStyles.small)}
                            onClick={handleReadAll}
                            disabled={(data?.unreadCount ?? unreadInPage) <= 0}
                            title={'Mark all notifications as read'}
                        >
                            Mark all read
                        </button>
                    </RightActions>
                </ControlsRow>

                {!data && isValidating ? (
                    <Spinner centered />
                ) : visible.length === 0 ? (
                    <Surface>
                        <div className={'p-8 text-center'}>
                            <p className={'text-neutral-100 font-semibold'}>Nothing here yet.</p>
                            <p className={'text-neutral-300 mt-2'}>
                                Crash alerts, invites, and server status changes will show up here.
                            </p>
                        </div>
                    </Surface>
                ) : (
                    <Surface>
                        <div className={'p-3 md:p-4 grid gap-3'}>
                            {visible.map((notification) => (
                                <NotificationRow
                                    key={notification.id}
                                    notification={notification}
                                    onOpen={async () => {
                                        if (!notification.readAt) await handleMarkRead(notification.id);
                                        navigateTo(notification.actionUrl || '/');
                                    }}
                                    onMarkRead={() => handleMarkRead(notification.id)}
                                    onDelete={() => handleDelete(notification.id)}
                                />
                            ))}
                        </div>
                    </Surface>
                )}
            </ContentBox>

            {data && (
                <PaginationFooter pagination={data.pagination} onPageSelect={(p) => setPage(p)} />
            )}
        </PageContentBlock>
    );
};
