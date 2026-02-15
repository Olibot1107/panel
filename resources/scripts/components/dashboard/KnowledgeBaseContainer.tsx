import React, { useEffect, useMemo, useState } from 'react';
import PageContentBlock from '@/components/elements/PageContentBlock';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faBookOpen, faSearch } from '@fortawesome/free-solid-svg-icons';
import useSWR from 'swr';
import Spinner from '@/components/elements/Spinner';
import { Link } from 'react-router-dom';
import { useStoreState } from 'easy-peasy';
import { listKnowledgeBaseArticles } from '@/lib/knowledgeBase';
import useFlash from '@/plugins/useFlash';

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

const Toolbar = styled.div`
    ${tw`flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-5`};
`;

const SearchWrap = styled.label`
    ${tw`relative block md:w-[22rem]`};

    & > input {
        ${tw`w-full rounded-xl pl-4 pr-11 py-3 text-sm`};
        color: #e5e7eb;
        background: rgba(10, 16, 29, 0.9);
        border: 1px solid rgba(71, 85, 105, 0.35);
    }

    & > svg {
        ${tw`absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400`};
    }
`;

const ArticleGrid = styled.div`
    ${tw`grid gap-3 md:grid-cols-2`};
`;

const ArticleCard = styled(Link)`
    ${tw`block no-underline`};
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

const AdminLink = styled.a`
    ${tw`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm no-underline`};
    color: #f8fafc;
    border: 1px solid rgba(var(--panel-accent-rgb, 239, 68, 68), 0.55);
    background: linear-gradient(
        135deg,
        rgba(var(--panel-accent-rgb, 239, 68, 68), 0.95),
        rgba(var(--panel-accent-rgb, 239, 68, 68), 0.7)
    );
`;

const EmptyState = styled.div`
    ${tw`rounded-xl p-6 text-sm text-neutral-400`};
    background: rgba(10, 16, 29, 0.6);
    border: 1px solid rgba(71, 85, 105, 0.28);
`;

export default () => {
    const rootAdmin = useStoreState((state) => !!state.user.data?.rootAdmin);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [search, setSearch] = useState('');

    const debouncedSearch = useMemo(() => search.trim(), [search]);
    const { data: articles, error } = useSWR(['knowledge-base', debouncedSearch], () =>
        listKnowledgeBaseArticles(debouncedSearch || undefined)
    );

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'knowledge-base', error });
        if (!error) clearFlashes('knowledge-base');
    }, [error, clearAndAddHttpError, clearFlashes]);

    return (
        <PageContentBlock title={'Docs'} showFlashKey={'knowledge-base'}>
            <Surface>
                <Heading>Docs</Heading>
                <Subheading>Guides and answers for common panel issues.</Subheading>

                <Toolbar>
                    <SearchWrap>
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.currentTarget.value)}
                            placeholder={'Search docs...'}
                        />
                        <FontAwesomeIcon icon={faSearch} />
                    </SearchWrap>
                    {rootAdmin && <AdminLink href={'/admin/settings/knowledge-base'}>Manage Docs</AdminLink>}
                </Toolbar>

                {!articles ? (
                    <Spinner centered size={'small'} />
                ) : articles.length > 0 ? (
                    <ArticleGrid>
                        {articles.map((article) => (
                            <ArticleCard key={article.id} to={`/support/knowledge-base/${article.slug}`}>
                                <h3>
                                    <FontAwesomeIcon icon={faBookOpen} css={tw`mr-2 text-neutral-300`} />
                                    {article.title}
                                </h3>
                                <p>{article.summary || article.readmePreview || 'No summary available.'}</p>
                                <ArticleLink as={'span'}>
                                    Read article
                                    <FontAwesomeIcon icon={faArrowRight} />
                                </ArticleLink>
                            </ArticleCard>
                        ))}
                    </ArticleGrid>
                ) : (
                    <EmptyState>No documentation pages match your search.</EmptyState>
                )}
            </Surface>
        </PageContentBlock>
    );
};
