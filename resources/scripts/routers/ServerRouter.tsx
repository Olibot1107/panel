import TransferListener from '@/components/server/TransferListener';
import React, { useEffect, useState } from 'react';
import { NavLink, Route, Switch, useRouteMatch } from 'react-router-dom';
import TransitionRouter from '@/TransitionRouter';
import WebsocketHandler from '@/components/server/WebsocketHandler';
import { ServerContext } from '@/state/server';
import Can from '@/components/elements/Can';
import Spinner from '@/components/elements/Spinner';
import { NotFound, ServerError } from '@/components/elements/ScreenBlock';
import { httpErrorToHuman } from '@/api/http';
import { useStoreState } from 'easy-peasy';
import InstallListener from '@/components/server/InstallListener';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router';
import ConflictStateRenderer from '@/components/server/ConflictStateRenderer';
import PermissionRoute from '@/components/elements/PermissionRoute';
import routes from '@/routers/routes';
import PanelLayout from '@/components/layout/PanelLayout';
import styled from 'styled-components/macro';
import tw from 'twin.macro';

const ServerTabs = styled.div`
    ${tw`px-4 md:px-8 py-3 overflow-x-auto`};
    background: linear-gradient(180deg, rgba(8, 15, 27, 0.96), rgba(8, 14, 24, 0.92));
    border-bottom: 1px solid rgba(var(--panel-accent-rgb, 239, 68, 68), 0.32);
    backdrop-filter: blur(10px);
    box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.04);

    & > div {
        ${tw`mx-auto flex items-center gap-2.5 min-w-max`};
        max-width: 1200px;
    }
`;

const TabLink = styled(NavLink)`
    ${tw`no-underline text-sm text-neutral-300 px-4 py-2 rounded-xl transition-all duration-150`};
    border: 1px solid transparent;
    background: rgba(14, 22, 37, 0.55);

    &:hover {
        background: rgba(21, 31, 50, 0.88);
        border-color: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.35);
        color: #f3f4f6;
    }

    &.active {
        background: linear-gradient(
            135deg,
            rgba(var(--panel-accent-rgb, 239, 68, 68), 0.9),
            rgba(var(--panel-accent-rgb, 239, 68, 68), 0.68)
        );
        color: #f8fafc;
        border-color: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.62);
        box-shadow: 0 8px 22px rgba(var(--panel-accent-rgb, 239, 68, 68), 0.3);
    }
`;

const ExternalAdmin = styled.a`
    ${tw`no-underline text-sm px-3 py-2 rounded-xl text-neutral-200`};
    border: 1px solid rgba(var(--panel-accent-rgb, 239, 68, 68), 0.28);
    background: rgba(14, 22, 37, 0.68);

    &:hover {
        background: rgba(21, 31, 50, 0.88);
        border-color: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.45);
    }
`;

export default () => {
    const match = useRouteMatch<{ id: string }>();
    const location = useLocation();

    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [error, setError] = useState('');

    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const name = ServerContext.useStoreState((state) => state.server.data?.name);
    const inConflictState = ServerContext.useStoreState((state) => state.server.inConflictState);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.internalId);
    const getServer = ServerContext.useStoreActions((actions) => actions.server.getServer);
    const clearServerState = ServerContext.useStoreActions((actions) => actions.clearServerState);

    const to = (value: string, url = false) => {
        if (value === '/') {
            return url ? match.url : match.path;
        }
        return `${(url ? match.url : match.path).replace(/\/*$/, '')}/${value.replace(/^\/+/, '')}`;
    };

    useEffect(
        () => () => {
            clearServerState();
        },
        []
    );

    useEffect(() => {
        setError('');

        getServer(match.params.id).catch((error) => {
            console.error(error);
            setError(httpErrorToHuman(error));
        });

        return () => {
            clearServerState();
        };
    }, [match.params.id]);

    const subHeader =
        uuid && id ? (
            <ServerTabs>
                <div>
                    {routes.server
                        .filter((route) => !!route.name)
                        .map((route) =>
                            route.permission ? (
                                <Can key={route.path} action={route.permission} matchAny>
                                    <TabLink to={to(route.path, true)} exact={route.exact}>
                                        {route.name}
                                    </TabLink>
                                </Can>
                            ) : (
                                <TabLink key={route.path} to={to(route.path, true)} exact={route.exact}>
                                    {route.name}
                                </TabLink>
                            )
                        )}
                    {rootAdmin && (
                        // eslint-disable-next-line react/jsx-no-target-blank
                        <ExternalAdmin href={`/admin/servers/view/${serverId}`} target={'_blank'}>
                            <FontAwesomeIcon icon={faExternalLinkAlt} />
                        </ExternalAdmin>
                    )}
                </div>
            </ServerTabs>
        ) : null;

    return (
        <PanelLayout topTitle={name || 'Server Console'} subHeader={subHeader} activeSection={'servers'}>
            {!uuid || !id ? (
                error ? (
                    <ServerError message={error} />
                ) : (
                    <Spinner size={'large'} centered />
                )
            ) : (
                <>
                    <InstallListener />
                    <TransferListener />
                    <WebsocketHandler />
                    {inConflictState && (!rootAdmin || (rootAdmin && !location.pathname.endsWith(`/server/${id}`))) ? (
                        <ConflictStateRenderer />
                    ) : (
                        <ErrorBoundary>
                            <TransitionRouter>
                                <Switch location={location}>
                                    {routes.server.map(({ path, permission, component: Component }) => (
                                        <PermissionRoute key={path} permission={permission} path={to(path)} exact>
                                            <Spinner.Suspense>
                                                <Component />
                                            </Spinner.Suspense>
                                        </PermissionRoute>
                                    ))}
                                    <Route path={'*'} component={NotFound} />
                                </Switch>
                            </TransitionRouter>
                        </ErrorBoundary>
                    )}
                </>
            )}
        </PanelLayout>
    );
};
