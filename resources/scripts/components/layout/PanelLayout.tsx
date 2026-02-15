import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBookOpen,
    faChartLine,
    faChevronDown,
    faFeatherAlt,
    faHistory,
    faHome,
    faKey,
    faServer,
    faUser,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import NavigationBar from '@/components/NavigationBar';
import { useLocation } from 'react-router';

export type PanelActiveSection = 'dashboard' | 'servers' | 'status' | 'knowledge' | 'account' | 'api' | 'activity';

interface Props {
    children: React.ReactNode;
    topTitle?: string;
    subHeader?: React.ReactNode;
    activeSection?: PanelActiveSection;
}

const Shell = styled.div`
    ${tw`min-h-screen`};
    background: radial-gradient(circle at top right, rgba(var(--panel-accent-rgb, 239, 68, 68), 0.22), transparent 40%),
        linear-gradient(180deg, #040b17 0%, #020710 100%);
    display: grid;
    grid-template-columns: 16.75rem minmax(0, 1fr);

    @media (max-width: 1024px) {
        grid-template-columns: minmax(0, 1fr);
    }
`;

const Sidebar = styled.aside`
    ${tw`p-4`};
    background: linear-gradient(180deg, rgba(8, 14, 26, 0.98) 0%, rgba(8, 14, 25, 0.98) 100%);
    border-right: 1px solid rgba(var(--panel-accent-rgb, 239, 68, 68), 0.4);

    @media (min-width: 1025px) {
        position: sticky;
        top: 0;
        height: 100vh;
        overflow-y: auto;
    }

    @media (max-width: 1024px) {
        border-right: 0;
        border-bottom: 1px solid rgba(var(--panel-accent-rgb, 239, 68, 68), 0.4);
    }
`;

const Brand = styled(Link)`
    ${tw`flex items-center px-3 py-2 rounded-lg mb-6 no-underline`};
    background: rgba(12, 20, 35, 0.8);
    border: 1px solid rgba(var(--panel-accent-rgb, 239, 68, 68), 0.45);
`;

const BrandIcon = styled.div`
    ${tw`w-9 h-9 rounded-full flex items-center justify-center text-neutral-100 mr-3`};
    background: linear-gradient(
        145deg,
        rgba(var(--panel-accent-rgb, 239, 68, 68), 0.95),
        rgba(var(--panel-accent-rgb, 239, 68, 68), 0.65)
    );
`;

const BrandName = styled.div`
    ${tw`leading-tight`};

    & > p {
        ${tw`text-sm text-neutral-100 font-semibold`};
    }

    & > span {
        ${tw`text-2xs uppercase tracking-wide`};
        color: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.95);
    }
`;

const NavSection = styled.section`
    ${tw`mb-6`};
`;

const SectionTitle = styled.div`
    ${tw`flex items-center justify-between text-2xs text-neutral-400 uppercase tracking-wider font-semibold px-3 mb-2`};
`;

const SidebarItemBase = styled.div<{ $active?: boolean; $static?: boolean }>`
    ${tw`flex items-center text-sm px-3 py-2 rounded-lg transition-colors duration-150`};
    border: 1px solid transparent;

    ${({ $active }) =>
        $active &&
        `
        color: #fff5f5;
        background: linear-gradient(
            135deg,
            rgba(var(--panel-accent-rgb, 239, 68, 68), 0.95),
            rgba(var(--panel-accent-rgb, 239, 68, 68), 0.68)
        );
        border-color: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.58);
        box-shadow: 0 8px 22px rgba(104, 27, 39, 0.3);
    `}

    ${({ $static }) =>
        $static &&
        `
        color: #7f8ca3;
    `}

    &:not([data-static='true']):hover {
        background: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.18);
        border-color: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.42);
    }

    & > svg {
        ${tw`mr-3 text-neutral-400`};
        ${({ $active }) => $active && 'color: #fff5f5;'}
    }
`;

const SidebarLink = styled(NavLink)`
    ${tw`no-underline block`};
`;

const MainArea = styled.div`
    ${tw`min-w-0 relative`};

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        background-image: radial-gradient(rgba(var(--panel-accent-rgb, 239, 68, 68), 0.2) 1px, transparent 1px);
        background-size: 22px 22px;
        opacity: 0.33;
    }
`;

const MainContent = styled.div`
    ${tw`px-4 md:px-8 pb-12 relative z-0`};
    min-height: calc(100vh - 4.6rem);
`;

const activeFromPath = (pathname: string): PanelActiveSection => {
    if (pathname.startsWith('/server/')) return 'servers';
    if (pathname.startsWith('/servers')) return 'servers';
    if (pathname.startsWith('/support/knowledge-base')) return 'knowledge';
    if (pathname.startsWith('/status')) return 'status';
    if (pathname.startsWith('/account/activity')) return 'activity';
    if (pathname.startsWith('/account/api')) return 'api';
    if (pathname.startsWith('/account')) return 'account';
    return 'dashboard';
};

const NavItem = ({
    icon,
    label,
    to,
    active,
    exact,
}: {
    icon: IconDefinition;
    label: string;
    to: string;
    active: boolean;
    exact?: boolean;
}) => (
    <SidebarLink to={to} exact={exact}>
        <SidebarItemBase $active={active}>
            <FontAwesomeIcon icon={icon} />
            {label}
        </SidebarItemBase>
    </SidebarLink>
);

const StaticItem = ({ icon, label }: { icon: IconDefinition; label: string }) => (
    <SidebarItemBase $static data-static={'true'}>
        <FontAwesomeIcon icon={icon} />
        {label}
    </SidebarItemBase>
);

const PanelLayout = ({ children, topTitle, subHeader, activeSection }: Props) => {
    const location = useLocation();
    const name = useStoreState((state: ApplicationStore) => state.settings.data?.name || 'Panel');
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data?.rootAdmin || false);
    const active = activeSection || activeFromPath(location.pathname);

    return (
        <Shell>
            <Sidebar>
                <Brand to={'/'}>
                    <BrandIcon>
                        <FontAwesomeIcon icon={faFeatherAlt} />
                    </BrandIcon>
                    <BrandName>
                        <p>{name}</p>
                        <span>Client Panel</span>
                    </BrandName>
                </Brand>
                <NavSection>
                    <SectionTitle>
                        Overview
                        <FontAwesomeIcon icon={faChevronDown} />
                    </SectionTitle>
                    <NavItem icon={faHome} label={'Dashboard'} to={'/'} exact active={active === 'dashboard'} />
                    <NavItem icon={faServer} label={'Servers'} to={'/servers'} active={active === 'servers'} />
                </NavSection>
                <NavSection>
                    <SectionTitle>
                        Support
                        <FontAwesomeIcon icon={faChevronDown} />
                    </SectionTitle>
                    <NavItem
                        icon={faBookOpen}
                        label={'Docs'}
                        to={'/support/knowledge-base'}
                        active={active === 'knowledge'}
                    />
                    {rootAdmin ? (
                        <NavItem icon={faChartLine} label={'Status'} to={'/status'} active={active === 'status'} />
                    ) : (
                        <StaticItem icon={faChartLine} label={'Status'} />
                    )}
                </NavSection>
                <NavSection>
                    <SectionTitle>
                        Account
                        <FontAwesomeIcon icon={faChevronDown} />
                    </SectionTitle>
                    <NavItem icon={faUser} label={'Account'} to={'/account'} exact active={active === 'account'} />
                    <NavItem icon={faKey} label={'API Credentials'} to={'/account/api'} active={active === 'api'} />
                    <NavItem
                        icon={faHistory}
                        label={'Activity'}
                        to={'/account/activity'}
                        active={active === 'activity'}
                    />
                </NavSection>
            </Sidebar>
            <MainArea>
                <div css={tw`relative z-50`}>
                    <NavigationBar title={topTitle} />
                    {subHeader}
                </div>
                <MainContent>{children}</MainContent>
            </MainArea>
        </Shell>
    );
};

export default PanelLayout;
