import React from 'react';
import FlashMessageRender from '@/components/FlashMessageRender';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import tw from 'twin.macro';
import { css } from 'styled-components/macro';

type Props = Readonly<
    React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
        title?: string;
        borderColor?: string;
        showFlashes?: string | boolean;
        showLoadingOverlay?: boolean;
    }
>;

const ContentBox = ({ title, borderColor, showFlashes, showLoadingOverlay, children, ...props }: Props) => (
    <div {...props}>
        {title && <h2 css={tw`text-neutral-100 mb-4 px-4 text-2xl`}>{title}</h2>}
        {showFlashes && (
            <FlashMessageRender byKey={typeof showFlashes === 'string' ? showFlashes : undefined} css={tw`mb-4`} />
        )}
        <div
            css={[
                tw`p-4 rounded shadow-lg relative`,
                css`
                    background: linear-gradient(155deg, rgba(15, 23, 38, 0.95), rgba(9, 15, 27, 0.96));
                    border: 1px solid rgba(var(--panel-accent-rgb, 239, 68, 68), 0.26);
                    box-shadow: 0 18px 34px rgba(0, 0, 0, 0.32);
                `,
                !!borderColor && tw`border-t-4`,
            ]}
        >
            <SpinnerOverlay visible={showLoadingOverlay || false} />
            {children}
        </div>
    </div>
);

export default ContentBox;
