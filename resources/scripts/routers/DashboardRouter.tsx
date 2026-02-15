import React from 'react';
import { Route, Switch } from 'react-router-dom';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import ServerListContainer from '@/components/dashboard/ServerListContainer';
import NodeStatusContainer from '@/components/dashboard/NodeStatusContainer';
import KnowledgeBaseContainer from '@/components/dashboard/KnowledgeBaseContainer';
import KnowledgeBaseArticleContainer from '@/components/dashboard/KnowledgeBaseArticleContainer';
import { NotFound } from '@/components/elements/ScreenBlock';
import TransitionRouter from '@/TransitionRouter';
import { useLocation } from 'react-router';
import Spinner from '@/components/elements/Spinner';
import routes from '@/routers/routes';
import PanelLayout from '@/components/layout/PanelLayout';

export default () => {
    const location = useLocation();

    return (
        <PanelLayout>
            <TransitionRouter>
                <React.Suspense fallback={<Spinner centered />}>
                    <Switch location={location}>
                        <Route path={'/servers'} exact>
                            <ServerListContainer />
                        </Route>
                        <Route path={'/'} exact>
                            <DashboardContainer />
                        </Route>
                        <Route path={'/status'} exact>
                            <NodeStatusContainer />
                        </Route>
                        <Route path={'/support/knowledge-base'} exact>
                            <KnowledgeBaseContainer />
                        </Route>
                        <Route path={'/support/knowledge-base/:slug'} exact>
                            <KnowledgeBaseArticleContainer />
                        </Route>
                        {routes.account.map(({ path, component: Component }) => (
                            <Route key={path} path={`/account/${path}`.replace('//', '/')} exact>
                                <Component />
                            </Route>
                        ))}
                        <Route path={'*'}>
                            <NotFound />
                        </Route>
                    </Switch>
                </React.Suspense>
            </TransitionRouter>
        </PanelLayout>
    );
};
