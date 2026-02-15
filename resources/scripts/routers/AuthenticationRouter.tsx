import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import LoginContainer from '@/components/auth/LoginContainer';
import ForgotPasswordContainer from '@/components/auth/ForgotPasswordContainer';
import ResetPasswordContainer from '@/components/auth/ResetPasswordContainer';
import LoginCheckpointContainer from '@/components/auth/LoginCheckpointContainer';
import RegisterContainer from '@/components/auth/RegisterContainer';
import { NotFound } from '@/components/elements/ScreenBlock';
import { useHistory, useLocation } from 'react-router';
import styled from 'styled-components/macro';
import tw from 'twin.macro';

const AuthLayout = styled.div`
    ${tw`relative min-h-screen px-2 sm:px-4 py-8 xl:py-16`};
    background: radial-gradient(circle at top right, rgba(var(--panel-accent-rgb, 239, 68, 68), 0.22), transparent 40%),
        linear-gradient(180deg, #040b17 0%, #020710 100%);
    display: grid;
    align-items: center;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        background-image: radial-gradient(rgba(var(--panel-accent-rgb, 239, 68, 68), 0.2) 1px, transparent 1px);
        background-size: 22px 22px;
        opacity: 0.25;
    }
`;

export default () => {
    const history = useHistory();
    const location = useLocation();
    const { path } = useRouteMatch();

    return (
        <AuthLayout>
            <Switch location={location}>
                <Route path={`${path}/login`} component={LoginContainer} exact />
                <Route path={`${path}/register`} component={RegisterContainer} exact />
                <Route path={`${path}/login/checkpoint`} component={LoginCheckpointContainer} />
                <Route path={`${path}/password`} component={ForgotPasswordContainer} exact />
                <Route path={`${path}/password/reset/:token`} component={ResetPasswordContainer} />
                <Route path={`${path}/checkpoint`} />
                <Route path={'*'}>
                    <NotFound onBack={() => history.push('/auth/login')} />
                </Route>
            </Switch>
        </AuthLayout>
    );
};
