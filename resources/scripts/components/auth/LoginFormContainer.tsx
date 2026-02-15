import React, { forwardRef } from 'react';
import { Form } from 'formik';
import styled from 'styled-components/macro';
import { breakpoint } from '@/theme';
import FlashMessageRender from '@/components/FlashMessageRender';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import tw from 'twin.macro';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
    subtitle?: string;
    variant?: 'classic' | 'dashboard';
};

const Container = styled.div`
    ${breakpoint('sm')`
        ${tw`w-4/5 mx-auto`}
    `};

    ${breakpoint('md')`
        ${tw`p-10`}
    `};

    ${breakpoint('lg')`
        ${tw`w-3/5`}
    `};

    ${breakpoint('xl')`
        ${tw`w-full`}
        max-width: 700px;
    `};
`;

const DashboardContainer = styled.div`
    ${tw`w-full max-w-5xl mx-auto px-4 sm:px-6`};
`;

const DashboardShell = styled.div`
    ${tw`grid gap-5 items-stretch`};
    grid-template-columns: minmax(0, 1fr);

    ${breakpoint('lg')`
        grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    `};
`;

const DashboardHero = styled.aside`
    ${tw`relative rounded-xl p-6 lg:p-8 overflow-hidden`};
    background: radial-gradient(circle at 76% 20%, rgba(var(--panel-accent-rgb, 239, 68, 68), 0.3), transparent 42%),
        linear-gradient(135deg, rgba(14, 25, 46, 0.97), rgba(8, 16, 31, 0.98));
    border: 1px solid rgba(var(--panel-accent-rgb, 239, 68, 68), 0.38);
    box-shadow: 0 18px 45px rgba(1, 6, 18, 0.55);

    & > h3 {
        ${tw`text-3xl text-neutral-100 font-semibold mt-8 leading-tight`};
        letter-spacing: -0.02em;
    }

    & > p {
        ${tw`text-neutral-300 mt-4 text-sm leading-relaxed`};
    }
`;

const DashboardCard = styled.div`
    ${tw`rounded-xl p-6 lg:p-8`};
    background: linear-gradient(145deg, rgba(11, 19, 34, 0.94), rgba(9, 16, 30, 0.96));
    border: 1px solid rgba(64, 98, 153, 0.28);
    box-shadow: 0 18px 45px rgba(1, 6, 18, 0.55);
`;

const DashboardHeading = styled.h2`
    ${tw`text-3xl text-neutral-100 font-semibold`};
    letter-spacing: -0.02em;
`;

const DashboardSubtitle = styled.p`
    ${tw`mt-2 mb-7 text-neutral-300 text-sm`};
`;

export default forwardRef<HTMLFormElement, Props>(({ title, subtitle, variant = 'classic', ...props }, ref) => {
    const brandingIcon = useStoreState((state: ApplicationStore) => state.settings.data?.branding?.icon || '');
    const authHeroTitle = useStoreState(
        (state: ApplicationStore) => state.settings.data?.branding?.authHeroTitle || 'Control your servers in one place.'
    );
    const authHeroTagline = useStoreState(
        (state: ApplicationStore) =>
            state.settings.data?.branding?.authHeroTagline ||
            'Secure access to deployments, monitoring, and account tools using the same interface style as your dashboard.'
    );

    const heroIconSrc = brandingIcon ? `/${brandingIcon.replace(/^\/*/, '')}` : '/assets/svgs/pterodactyl.svg';

    if (variant === 'dashboard') {
        return (
            <DashboardContainer>
                <FlashMessageRender css={tw`mb-4`} />
                <Form {...props} ref={ref}>
                    <DashboardShell>
                        <DashboardHero>
                            <img src={heroIconSrc} css={tw`block w-12 h-12 object-contain`} />
                            <h3>{authHeroTitle}</h3>
                            <p>{authHeroTagline}</p>
                        </DashboardHero>
                        <DashboardCard>
                            {title && <DashboardHeading>{title}</DashboardHeading>}
                            {subtitle && <DashboardSubtitle>{subtitle}</DashboardSubtitle>}
                            {!subtitle && title && <div css={tw`mb-6`} />}
                            <div css={tw`space-y-4`}>{props.children}</div>
                        </DashboardCard>
                    </DashboardShell>
                </Form>
            </DashboardContainer>
        );
    }

    return (
        <Container>
            {title && <h2 css={tw`text-3xl text-center text-neutral-100 font-medium py-4`}>{title}</h2>}
            <FlashMessageRender css={tw`mb-2 px-1`} />
            <Form {...props} ref={ref}>
                <div css={tw`md:flex w-full bg-white shadow-lg rounded-lg p-6 md:pl-0 mx-1`}>
                    <div css={tw`flex-none select-none mb-6 md:mb-0 self-center`}>
                        <img src={'/assets/svgs/pterodactyl.svg'} css={tw`block w-48 md:w-64 mx-auto`} />
                    </div>
                    <div css={tw`flex-1`}>{props.children}</div>
                </div>
            </Form>
        </Container>
    );
});
