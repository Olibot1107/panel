import React, { useEffect, useState } from 'react';
import { Server } from '@/api/server/getServer';
import getServers from '@/api/getServers';
import reorderServers from '@/api/reorderServers';
import ServerRow from '@/components/dashboard/ServerRow';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { usePersistedState } from '@/plugins/usePersistedState';
import Switch from '@/components/elements/Switch';
import tw from 'twin.macro';
import useSWR from 'swr';
import { PaginatedResult } from '@/api/http';
import Pagination from '@/components/elements/Pagination';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faArrowUp, faCheck, faEdit, faServer } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components/macro';

const HeroCard = styled.section`
    ${tw`rounded-xl p-5 mb-6`};
    background: radial-gradient(circle at 75% 30%, rgba(var(--panel-accent-rgb, 239, 68, 68), 0.28), transparent 42%),
        linear-gradient(135deg, rgba(13, 24, 46, 0.98), rgba(8, 14, 29, 0.96));
    border: 1px solid rgba(var(--panel-accent-rgb, 239, 68, 68), 0.35);

    & > h2 {
        ${tw`text-4xl font-semibold text-neutral-100`};
        letter-spacing: -0.02em;
    }

    & > p {
        ${tw`mt-2 text-neutral-300`};
    }
`;

const ActionBar = styled.div`
    ${tw`rounded-xl p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4`};
    background: rgba(10, 18, 34, 0.92);
    border: 1px solid rgba(var(--panel-accent-rgb, 239, 68, 68), 0.22);
`;

const SurfaceCard = styled.section`
    ${tw`rounded-xl p-5`};
    background: linear-gradient(145deg, rgba(11, 19, 34, 0.94), rgba(9, 16, 30, 0.96));
    border: 1px solid rgba(64, 98, 153, 0.28);
    box-shadow: 0 18px 45px rgba(1, 6, 18, 0.55);
`;

const CardHeading = styled.div`
    ${tw`flex items-center justify-between mb-4`};

    & > h3 {
        ${tw`text-2xl font-semibold text-neutral-100`};
    }

    & > span {
        ${tw`text-sm text-neutral-400`};
    }
`;

const ReorderButton = styled.button`
    ${tw`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed`};
    color: #eff6ff;
    background: linear-gradient(
        135deg,
        rgba(var(--panel-accent-rgb, 239, 68, 68), 0.95),
        rgba(var(--panel-accent-rgb, 239, 68, 68), 0.68)
    );

    &:hover {
        background: linear-gradient(
            135deg,
            rgba(var(--panel-accent-rgb, 239, 68, 68), 1),
            rgba(var(--panel-accent-rgb, 239, 68, 68), 0.74)
        );
    }
`;

const MoveButton = styled.button`
    ${tw`h-1/2 px-3 text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed`};
    background: rgba(18, 30, 55, 0.9);

    &:first-child {
        ${tw`rounded-t-md border-b`};
        border-color: rgba(73, 103, 155, 0.38);
    }

    &:last-child {
        ${tw`rounded-b-md`};
    }

    &:hover {
        background: rgba(25, 42, 77, 0.95);
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

const ServerListContainer = () => {
    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');

    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const uuid = useStoreState((state) => state.user.data!.uuid);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${uuid}:show_all_servers`, false);
    const [orderedItems, setOrderedItems] = useState<Server[] | null>(null);
    const [isSavingOrder, setIsSavingOrder] = useState(false);
    const [isReorderMode, setIsReorderMode] = useState(false);

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', showOnlyAdmin && rootAdmin, page],
        () => getServers({ page, type: showOnlyAdmin && rootAdmin ? 'admin' : undefined })
    );

    useEffect(() => {
        setPage(1);
    }, [showOnlyAdmin]);

    useEffect(() => {
        if (showOnlyAdmin) setIsReorderMode(false);
    }, [showOnlyAdmin]);

    useEffect(() => {
        if (!servers) return;
        if (servers.pagination.currentPage > 1 && !servers.items.length) {
            setPage(1);
        }
    }, [servers?.pagination.currentPage]);

    useEffect(() => {
        setOrderedItems(servers?.items ?? null);
    }, [servers?.items, servers?.pagination.currentPage]);

    useEffect(() => {
        window.history.replaceState(null, document.title, `/servers${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'servers', error });
        if (!error) clearFlashes('servers');
    }, [error]);

    const reorderEnabled = !(rootAdmin && showOnlyAdmin);

    const persistOrder = async (next: Server[], previous: Server[]) => {
        setOrderedItems(next);

        const ids = next.map((server) => Number(server.internalId)).filter((id) => Number.isFinite(id) && id > 0);

        if (ids.length !== next.length) {
            setOrderedItems(previous);
            return;
        }

        setIsSavingOrder(true);
        try {
            await reorderServers(ids);
        } catch (orderError) {
            setOrderedItems(previous);
            clearAndAddHttpError({ key: 'servers', error: orderError });
        } finally {
            setIsSavingOrder(false);
        }
    };

    const moveServer = (index: number, direction: -1 | 1) => {
        if (!orderedItems || isSavingOrder) return;

        const target = index + direction;
        if (target < 0 || target >= orderedItems.length) return;

        const previous = [...orderedItems];
        const next = [...orderedItems];
        const [item] = next.splice(index, 1);
        next.splice(target, 0, item);

        void persistOrder(next, previous);
    };

    return (
        <PageContentBlock title={'Servers'} showFlashKey={'servers'}>
            <HeroCard>
                <h2>Servers</h2>
                <p>Manage your server infrastructure in one place.</p>
            </HeroCard>

            {(rootAdmin || reorderEnabled) && (
                <ActionBar>
                    <div>
                        {rootAdmin && (
                            <div css={tw`flex items-center`}>
                                <p css={tw`uppercase text-xs text-neutral-400 mr-2`}>
                                    {showOnlyAdmin ? "Showing others' servers" : 'Showing your servers'}
                                </p>
                                <Switch
                                    name={'show_all_servers'}
                                    defaultChecked={showOnlyAdmin}
                                    onChange={() => setShowOnlyAdmin((s) => !s)}
                                />
                            </div>
                        )}
                    </div>
                    <div>
                        {reorderEnabled && (
                            <ReorderButton
                                type={'button'}
                                onClick={() => setIsReorderMode((current) => !current)}
                                disabled={isSavingOrder}
                            >
                                <FontAwesomeIcon icon={isReorderMode ? faCheck : faEdit} css={tw`mr-2`} />
                                {isReorderMode ? 'Done Reordering' : 'Edit Order'}
                            </ReorderButton>
                        )}
                    </div>
                </ActionBar>
            )}

            <SurfaceCard>
                <CardHeading>
                    <h3>All Servers</h3>
                    <span>{servers?.pagination.total || 0} total</span>
                </CardHeading>
                {!servers ? (
                    <Spinner centered size={'large'} />
                ) : (
                    <Pagination data={servers} onPageSelect={setPage}>
                        {({ items }) =>
                            (orderedItems ?? items).length > 0 ? (
                                (orderedItems ?? items).map((server, index) => (
                                    <div key={server.uuid} css={index > 0 ? tw`mt-3` : undefined}>
                                        {isReorderMode && reorderEnabled ? (
                                            <div css={tw`grid grid-cols-[1fr_auto] gap-2 items-stretch`}>
                                                <ServerRow server={server} />
                                                <div css={tw`flex flex-col`}>
                                                    <MoveButton
                                                        type={'button'}
                                                        onClick={() => moveServer(index, -1)}
                                                        disabled={isSavingOrder || index === 0}
                                                        aria-label={`Move ${server.name} up`}
                                                    >
                                                        <FontAwesomeIcon icon={faArrowUp} />
                                                    </MoveButton>
                                                    <MoveButton
                                                        type={'button'}
                                                        onClick={() => moveServer(index, 1)}
                                                        disabled={
                                                            isSavingOrder ||
                                                            index === (orderedItems ?? items).length - 1
                                                        }
                                                        aria-label={`Move ${server.name} down`}
                                                    >
                                                        <FontAwesomeIcon icon={faArrowDown} />
                                                    </MoveButton>
                                                </div>
                                            </div>
                                        ) : (
                                            <ServerRow server={server} />
                                        )}
                                    </div>
                                ))
                            ) : (
                                <EmptyState>
                                    <FontAwesomeIcon icon={faServer} />
                                    <h4>No servers found</h4>
                                    <p>
                                        {showOnlyAdmin
                                            ? 'There are no other servers to display.'
                                            : 'Create your first server to get started.'}
                                    </p>
                                </EmptyState>
                            )
                        }
                    </Pagination>
                )}
            </SurfaceCard>
        </PageContentBlock>
    );
};

export default ServerListContainer;
