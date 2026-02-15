import React from 'react';
import styled from 'styled-components/macro';

interface Props {
    value: string;
    className?: string;
}

const Value = styled.span`
    display: inline-block;
    color: transparent;
    text-shadow: 0 0 8px rgba(226, 232, 240, 0.92);
    filter: blur(1.6px);
    letter-spacing: 0.02em;
    user-select: none;
    transition: filter 140ms ease, text-shadow 140ms ease, color 140ms ease;

    &:hover {
        color: inherit;
        text-shadow: none;
        filter: none;
        user-select: text;
    }
`;

const BlurredValue = ({ value, className }: Props) => (
    <Value className={className} aria-label={'Hidden sensitive value'} title={'Hover to reveal'}>
        {value}
    </Value>
);

export default BlurredValue;
