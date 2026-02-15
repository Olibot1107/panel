import React from 'react';
import PageContentBlock from '@/components/elements/PageContentBlock';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faBookOpen } from '@fortawesome/free-solid-svg-icons';

const Surface = styled.section`
    ${tw`rounded-2xl p-6`};
    background: linear-gradient(150deg, rgba(11, 19, 34, 0.95), rgba(9, 16, 28, 0.96));
    border: 1px solid rgba(var(--panel-accent-rgb, 239, 68, 68), 0.25);
`;

const Heading = styled.h1`
    ${tw`text-4xl text-neutral-100 font-semibold mb-2`};
`;

const Subheading = styled.p`
    ${tw`text-neutral-400 mb-6`};
`;

const ArticleGrid = styled.div`
    ${tw`grid gap-3 md:grid-cols-2`};
`;

const ArticleCard = styled.article`
    ${tw`rounded-xl p-4`};
    background: rgba(10, 16, 29, 0.9);
    border: 1px solid rgba(71, 85, 105, 0.34);

    & > h3 {
        ${tw`text-neutral-100 text-lg font-semibold mb-1`};
    }

    & > p {
        ${tw`text-sm text-neutral-400`};
    }
`;

const ArticleLink = styled.button`
    ${tw`mt-3 text-sm border-0 bg-transparent p-0 inline-flex items-center`};
    color: rgba(var(--panel-accent-rgb, 239, 68, 68), 0.95);

    & > svg {
        ${tw`ml-2`};
    }
`;

const articles = [
    {
        title: 'How to Restart a Server',
        description: 'Safe restart steps, what each power action does, and expected downtime.',
    },
    {
        title: 'Troubleshooting Startup Errors',
        description: 'Find and fix startup issues, missing files, and invalid startup variables.',
    },
    {
        title: 'Backups and Restore Guide',
        description: 'Create backups, manage limits, and restore data without losing progress.',
    },
    {
        title: 'SFTP and File Access',
        description: 'Connect with SFTP, upload files, and fix common permission issues.',
    },
];

export default () => (
    <PageContentBlock title={'Knowledge Base'}>
        <Surface>
            <Heading>Knowledge Base</Heading>
            <Subheading>Guides and answers for common panel issues.</Subheading>
            <ArticleGrid>
                {articles.map((article) => (
                    <ArticleCard key={article.title}>
                        <h3>
                            <FontAwesomeIcon icon={faBookOpen} css={tw`mr-2 text-neutral-300`} />
                            {article.title}
                        </h3>
                        <p>{article.description}</p>
                        <ArticleLink type={'button'}>
                            Read article
                            <FontAwesomeIcon icon={faArrowRight} />
                        </ArticleLink>
                    </ArticleCard>
                ))}
            </ArticleGrid>
        </Surface>
    </PageContentBlock>
);
