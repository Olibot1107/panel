import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import {
    ACCENT_COLORS,
    ACCENT_STORAGE_KEY,
    AccentColor,
    AccentName,
    applyAccentToDocument,
    getAccentByName,
    readStoredAccent,
} from '@/lib/accent';

const Wrapper = styled.div`
    ${tw`absolute right-4 top-4 z-20`};
`;

const Toggle = styled.button<{ $hex: string }>`
    ${tw`h-10 px-3 rounded-xl flex items-center gap-2 text-sm text-neutral-100`};
    background: rgba(8, 15, 27, 0.86);
    border: 1px solid rgba(var(--panel-accent-rgb, 239, 68, 68), 0.44);

    & > span {
        ${tw`w-4 h-4 rounded-full border border-white/80`};
        background: ${({ $hex }) => $hex};
    }

    &:hover {
        border-color: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.72);
    }
`;

const Dropdown = styled.div`
    ${tw`absolute right-0 mt-2 rounded-2xl p-3 w-56`};
    top: 100%;
    background: linear-gradient(180deg, rgba(14, 21, 35, 0.98), rgba(11, 16, 27, 0.98));
    border: 1px solid rgba(74, 86, 108, 0.45);
    box-shadow: 0 16px 42px rgba(0, 0, 0, 0.48);
`;

const Option = styled.button<{ $selected: boolean }>`
    ${tw`w-full flex items-center justify-between rounded-xl px-2 py-2 text-left transition-colors duration-150 text-sm`};
    color: ${({ $selected }) => ($selected ? '#f8fafc' : '#e5e7eb')};
    background: ${({ $selected }) => ($selected ? 'rgba(41, 53, 74, 0.7)' : 'transparent')};

    &:hover {
        background: rgba(41, 53, 74, 0.7);
    }
`;

const Swatch = styled.span<{ $hex: string }>`
    ${tw`w-5 h-5 rounded-full mr-3 border border-white/80`};
    background: ${({ $hex }) => $hex};
`;

const Info = styled.div`
    ${tw`flex items-center`};
`;

export default () => {
    const [open, setOpen] = useState(false);
    const [accent, setAccent] = useState<AccentColor>(() => readStoredAccent());
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        applyAccentToDocument(accent);
        window.localStorage.setItem(ACCENT_STORAGE_KEY, accent.name);
    }, [accent]);

    useEffect(() => {
        if (!open) return;

        const onClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        const onEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };

        document.addEventListener('mousedown', onClickOutside);
        document.addEventListener('keydown', onEscape);

        return () => {
            document.removeEventListener('mousedown', onClickOutside);
            document.removeEventListener('keydown', onEscape);
        };
    }, [open]);

    const onSelect = (name: AccentName) => {
        setAccent(getAccentByName(name));
        setOpen(false);
    };

    return (
        <Wrapper ref={ref}>
            <Toggle type={'button'} aria-label={'Theme color'} onClick={() => setOpen((v) => !v)} $hex={accent.hex}>
                <span />
            </Toggle>
            {open && (
                <Dropdown>
                    {ACCENT_COLORS.map((color) => (
                        <Option
                            key={color.name}
                            type={'button'}
                            $selected={accent.name === color.name}
                            onClick={() => onSelect(color.name)}
                        >
                            <Info>
                                <Swatch $hex={color.hex} />
                                {color.label}
                            </Info>
                            {accent.name === color.name && <FontAwesomeIcon icon={faCheck} css={tw`text-[var(--panel-accent)]`} />}
                        </Option>
                    ))}
                </Dropdown>
            )}
        </Wrapper>
    );
};
