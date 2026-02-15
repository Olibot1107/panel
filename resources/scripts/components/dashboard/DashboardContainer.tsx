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
import { faArrowDown, faArrowUp, faCheck, faEdit } from '@fortawesome/free-solid-svg-icons';

export default () => {
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
        // Don't use react-router to handle changing this part of the URL, otherwise it
        // triggers a needless re-render. We just want to track this in the URL incase the
        // user refreshes the page.
        window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error]);

    const reorderEnabled = !(rootAdmin && showOnlyAdmin);

    const persistOrder = async (next: Server[], previous: Server[]) => {
        setOrderedItems(next);

        const ids = next
            .map((server) => Number(server.internalId))
            .filter((id) => Number.isFinite(id) && id > 0);

        if (ids.length !== next.length) {
            setOrderedItems(previous);
            return;
        }

        setIsSavingOrder(true);
        try {
            await reorderServers(ids);
        } catch (orderError) {
            setOrderedItems(previous);
            clearAndAddHttpError({ key: 'dashboard', error: orderError });
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
        <PageContentBlock title={'Dashboard'} showFlashKey={'dashboard'}>
            {(rootAdmin || reorderEnabled) && (
                <div css={tw`mb-3 flex justify-between items-center`}>
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
                            <button
                                type={'button'}
                                onClick={() => setIsReorderMode((current) => !current)}
                                disabled={isSavingOrder}
                                css={tw`px-3 py-2 rounded bg-primary-500 hover:bg-primary-400 text-primary-50 text-sm disabled:opacity-60 disabled:cursor-not-allowed`}
                            >
                                <FontAwesomeIcon icon={isReorderMode ? faCheck : faEdit} css={tw`mr-2`} />
                                {isReorderMode ? 'Done Reordering' : 'Edit Order'}
                            </button>
                        )}
                    </div>
                </div>
            )}
            {!servers ? (
                <Spinner centered size={'large'} />
            ) : (
                <Pagination data={servers} onPageSelect={setPage}>
                    {({ items }) =>
                        (orderedItems ?? items).length > 0 ? (
                            (orderedItems ?? items).map((server, index) => (
                                <div key={server.uuid} css={index > 0 ? tw`mt-2` : undefined}>
                                    {isReorderMode && reorderEnabled ? (
                                        <div css={tw`grid grid-cols-[1fr_auto] gap-2 items-stretch`}>
                                            <ServerRow server={server} />
                                            <div css={tw`flex flex-col`}>
                                                <button
                                                    type={'button'}
                                                    css={tw`h-1/2 px-3 rounded-t bg-neutral-700 text-neutral-200 hover:bg-neutral-600 disabled:opacity-40 disabled:cursor-not-allowed`}
                                                    onClick={() => moveServer(index, -1)}
                                                    disabled={isSavingOrder || index === 0}
                                                    aria-label={`Move ${server.name} up`}
                                                >
                                                    <FontAwesomeIcon icon={faArrowUp} />
                                                </button>
                                                <button
                                                    type={'button'}
                                                    css={tw`h-1/2 px-3 rounded-b bg-neutral-700 text-neutral-200 hover:bg-neutral-600 border-t border-neutral-600 disabled:opacity-40 disabled:cursor-not-allowed`}
                                                    onClick={() => moveServer(index, 1)}
                                                    disabled={isSavingOrder || index === (orderedItems ?? items).length - 1}
                                                    aria-label={`Move ${server.name} down`}
                                                >
                                                    <FontAwesomeIcon icon={faArrowDown} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <ServerRow server={server} />
                                    )}
                                </div>
                            ))
                        ) : (
                            <p css={tw`text-center text-sm text-neutral-400`}>
                                {showOnlyAdmin
                                    ? 'There are no other servers to display.'
                                    : 'There are no servers associated with your account.'}
                            </p>
                        )
                    }
                </Pagination>
            )}
        </PageContentBlock>
    );
};
