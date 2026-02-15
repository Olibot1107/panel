import styled from 'styled-components/macro';
import tw from 'twin.macro';

export default styled.div<{ $hoverable?: boolean }>`
    ${tw`flex rounded no-underline text-neutral-200 items-center p-4 border transition-colors duration-150 overflow-hidden`};
    background: linear-gradient(140deg, rgba(67, 83, 104, 0.95), rgba(60, 76, 97, 0.96));
    border-color: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.18);

    ${(props) =>
        props.$hoverable !== false &&
        `
            &:hover {
                border-color: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.5);
            }
        `};

    & .icon {
        ${tw`rounded-full w-16 flex items-center justify-center p-3`};
        background: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.25);
        border: 1px solid rgba(var(--panel-accent-rgb, 239, 68, 68), 0.45);
    }
`;
