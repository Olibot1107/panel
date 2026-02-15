import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCogs, faLayerGroup, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import SearchContainer from '@/components/dashboard/search/SearchContainer';
import tw, { theme } from 'twin.macro';
import styled, { css } from 'styled-components/macro';
import http from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import Avatar from '@/components/Avatar';
import {
    ACCENT_COLORS,
    ACCENT_STORAGE_KEY,
    AccentColor,
    AccentName,
    applyAccentToDocument,
    getAccentByName,
    readStoredAccent,
} from '@/lib/accent';

interface Props {
    title?: string;
}

const quickActionStyles = css`
    ${tw`h-10 w-10 rounded-full flex items-center justify-center no-underline cursor-pointer transition-colors duration-150 text-neutral-300`};
    background: rgba(8, 15, 27, 0.86);
    border: 1px solid rgba(var(--panel-accent-rgb, 239, 68, 68), 0.38);

    &:hover,
    &:focus-visible,
    &.active {
        ${tw`text-neutral-100`};
        background: rgba(33, 18, 25, 0.96);
        border-color: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.72);
    }
`;

const TopNavigation = styled.div`
    ${tw`relative flex flex-col md:flex-row md:items-center md:justify-between px-4 lg:px-8 py-3 md:py-0 gap-3 md:gap-0`};
    min-height: 4.6rem;
    background: linear-gradient(90deg, rgba(5, 11, 23, 0.96), rgba(7, 13, 24, 0.94));
    border-bottom: 1px solid rgba(var(--panel-accent-rgb, 239, 68, 68), 0.38);
`;

const HeaderTitle = styled.h1`
    ${tw`text-xl md:text-[2.1rem] text-neutral-100 font-semibold`};
    letter-spacing: -0.02em;
`;

const RightSection = styled.div`
    ${tw`flex items-center justify-between md:justify-end gap-2 md:gap-3 w-full md:w-auto ml-auto`};
`;

const QuickActions = styled.div`
    ${tw`flex items-center gap-2`};

    & > a,
    & > button,
    & > .quick-action {
        ${quickActionStyles};
    }
`;

const AccentPicker = styled.div`
    ${tw`relative`};
`;

const AccentToggleButton = styled.button<{ $hex: string }>`
    ${tw`h-10 w-10 rounded-full flex items-center justify-center`};
    background: rgba(8, 15, 27, 0.86);
    border: 1px solid rgba(var(--panel-accent-rgb, 239, 68, 68), 0.38);

    & > span {
        ${tw`w-6 h-6 rounded-full border-2 border-white`};
        background: ${({ $hex }) => $hex};
        box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.35);
    }

    &:hover {
        border-color: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.72);
    }
`;

const AccentDropdown = styled.div`
    ${tw`absolute right-0 mt-2 rounded-2xl p-4 w-64`};
    top: 100%;
    background: linear-gradient(180deg, rgba(14, 21, 35, 0.98), rgba(11, 16, 27, 0.98));
    border: 1px solid rgba(74, 86, 108, 0.45);
    box-shadow: 0 16px 42px rgba(0, 0, 0, 0.48);
    z-index: 40;

    & > h3 {
        ${tw`text-2xl text-neutral-100 font-semibold mb-3`};
    }
`;

const AccentOption = styled.button<{ $selected: boolean }>`
    ${tw`w-full flex items-center justify-between rounded-xl px-2 py-2 text-left transition-colors duration-150`};
    color: ${({ $selected }) => ($selected ? '#f8fafc' : '#e5e7eb')};
    background: ${({ $selected }) => ($selected ? 'rgba(41, 53, 74, 0.7)' : 'transparent')};

    &:hover {
        background: rgba(41, 53, 74, 0.7);
    }
`;

const AccentOptionInfo = styled.div`
    ${tw`flex items-center`};
`;

const AccentSwatch = styled.span<{ $hex: string }>`
    ${tw`w-6 h-6 rounded-full mr-3 border-2 border-white`};
    background: ${({ $hex }) => $hex};
`;

const ProfileLink = styled(Link)`
    ${tw`hidden lg:flex items-center no-underline px-3 py-2 rounded-xl`};
    background: rgba(11, 21, 40, 0.86);
    border: 1px solid rgba(var(--panel-accent-rgb, 239, 68, 68), 0.38);

    &:hover {
        background: rgba(23, 30, 47, 0.95);
        border-color: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.72);
    }
`;

const ProfileLabel = styled.div`
    ${tw`ml-3 leading-tight`};

    & > p {
        ${tw`text-sm text-neutral-100 font-medium`};
    }

    & > span {
        color: ${theme`colors.neutral.400`};
        font-size: 0.7rem;
        text-transform: lowercase;
    }
`;

export default ({ title }: Props) => {
    const user = useStoreState((state: ApplicationStore) => state.user.data);
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [accentMenuVisible, setAccentMenuVisible] = useState(false);
    const [accent, setAccent] = useState<AccentColor>(() => readStoredAccent());
    const accentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        applyAccentToDocument(accent);
        window.localStorage.setItem(ACCENT_STORAGE_KEY, accent.name);
    }, [accent]);

    useEffect(() => {
        if (!accentMenuVisible) return;

        const onClickOutside = (event: MouseEvent) => {
            if (accentRef.current && !accentRef.current.contains(event.target as Node)) {
                setAccentMenuVisible(false);
            }
        };

        const onEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setAccentMenuVisible(false);
            }
        };

        document.addEventListener('mousedown', onClickOutside);
        document.addEventListener('keydown', onEscape);

        return () => {
            document.removeEventListener('mousedown', onClickOutside);
            document.removeEventListener('keydown', onEscape);
        };
    }, [accentMenuVisible]);

    const onTriggerLogout = () => {
        setIsLoggingOut(true);
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    const onSelectAccent = (name: AccentName) => {
        setAccent(getAccentByName(name));
        setAccentMenuVisible(false);
    };

    const resolvedTitle = title || '';

    return (
        <TopNavigation>
            <SpinnerOverlay visible={isLoggingOut} />
            {resolvedTitle && <HeaderTitle>{resolvedTitle}</HeaderTitle>}
            <RightSection>
                <QuickActions>
                    <SearchContainer className={'quick-action'} />
                    <Tooltip placement={'bottom'} content={'Dashboard'}>
                        <NavLink to={'/'} exact>
                            <FontAwesomeIcon icon={faLayerGroup} />
                        </NavLink>
                    </Tooltip>
                    <AccentPicker ref={accentRef}>
                        <Tooltip placement={'bottom'} content={'Accent Color'}>
                            <AccentToggleButton
                                type={'button'}
                                aria-label={'Accent Color'}
                                onClick={() => setAccentMenuVisible((visible) => !visible)}
                                $hex={accent.hex}
                            >
                                <span />
                            </AccentToggleButton>
                        </Tooltip>
                        {accentMenuVisible && (
                            <AccentDropdown>
                                <h3>Accent Color</h3>
                                {ACCENT_COLORS.map((color) => (
                                    <AccentOption
                                        key={color.name}
                                        type={'button'}
                                        $selected={accent.name === color.name}
                                        onClick={() => onSelectAccent(color.name)}
                                    >
                                        <AccentOptionInfo>
                                            <AccentSwatch $hex={color.hex} />
                                            <span>{color.label}</span>
                                        </AccentOptionInfo>
                                        {accent.name === color.name && (
                                            <FontAwesomeIcon icon={faCheck} css={tw`text-[var(--panel-accent)]`} />
                                        )}
                                    </AccentOption>
                                ))}
                            </AccentDropdown>
                        )}
                    </AccentPicker>
                    {rootAdmin && (
                        <Tooltip placement={'bottom'} content={'Admin'}>
                            <a href={'/admin'} rel={'noreferrer'}>
                                <FontAwesomeIcon icon={faCogs} />
                            </a>
                        </Tooltip>
                    )}
                    <Tooltip placement={'bottom'} content={'Sign Out'}>
                        <button type={'button'} onClick={onTriggerLogout} aria-label={'Sign Out'}>
                            <FontAwesomeIcon icon={faSignOutAlt} />
                        </button>
                    </Tooltip>
                </QuickActions>
                <ProfileLink to={'/account'}>
                    <span className={'flex items-center justify-center w-8 h-8 rounded-full overflow-hidden'}>
                        <Avatar.User />
                    </span>
                    <ProfileLabel>
                        <p>{user?.username || 'User'}</p>
                        <span>{user?.email || 'account'}</span>
                    </ProfileLabel>
                </ProfileLink>
            </RightSection>
        </TopNavigation>
    );
};
