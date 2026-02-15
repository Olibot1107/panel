import React from 'react';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { getKnowledgeBaseArticle } from '@/lib/knowledgeBase';
import { NotFound } from '@/components/elements/ScreenBlock';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';

const Surface = styled.section`
    ${tw`rounded-2xl p-6`};
    background: linear-gradient(150deg, rgba(11, 19, 34, 0.95), rgba(9, 16, 28, 0.96));
    border: 1px solid rgba(var(--panel-accent-rgb, 239, 68, 68), 0.25);
`;

const BackLink = styled(Link)`
    ${tw`inline-flex items-center no-underline text-sm mb-4`};
    color: #cbd5e1;

    & > svg {
        ${tw`mr-2`};
    }
`;

const Heading = styled.h1`
    ${tw`text-4xl text-neutral-100 font-semibold mb-2`};
`;

const Summary = styled.p`
    ${tw`text-neutral-400 mb-6`};
`;

const Readme = styled.div`
    ${tw`rounded-xl p-4 mb-5 whitespace-pre-wrap text-neutral-200 text-sm leading-6`};
    background: rgba(10, 16, 29, 0.75);
    border: 1px solid rgba(71, 85, 105, 0.35);
`;

const Section = styled.section`
    ${tw`rounded-xl p-4 mb-4`};
    background: rgba(10, 16, 29, 0.75);
    border: 1px solid rgba(71, 85, 105, 0.35);

    & > h3 {
        ${tw`text-xl font-semibold text-neutral-100 mb-2`};
    }
`;

const SectionContent = styled.p`
    ${tw`text-sm text-neutral-200 whitespace-pre-wrap leading-6`};
`;

export default () => {
    const { slug } = useParams<{ slug: string }>();
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [article, setArticle] = useState<Awaited<ReturnType<typeof getKnowledgeBaseArticle>> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        getKnowledgeBaseArticle(slug)
            .then((data) => {
                setArticle(data);
                setNotFound(false);
                clearFlashes('knowledge-base:article');
            })
            .catch((error) => {
                if (error?.response?.status === 404) {
                    setNotFound(true);
                } else {
                    clearAndAddHttpError({ key: 'knowledge-base:article', error });
                }
            })
            .then(() => setIsLoading(false));
    }, [slug, clearAndAddHttpError, clearFlashes]);

    if (isLoading) {
        return (
            <PageContentBlock title={'Docs'}>
                <Spinner centered size={'large'} />
            </PageContentBlock>
        );
    }

    if (notFound || !article) {
        return <NotFound title={'Article Not Found'} message={'This docs article does not exist.'} />;
    }

    return (
        <PageContentBlock title={article.title} showFlashKey={'knowledge-base:article'}>
            <Surface>
                <BackLink to={'/support/knowledge-base'}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Back to docs
                </BackLink>

                <Heading>{article.title}</Heading>
                <Summary>{article.summary || 'Documentation article'}</Summary>

                {article.readme && <Readme>{article.readme}</Readme>}

                {article.sections.map((section) => (
                    <Section key={section.id}>
                        <h3>{section.title}</h3>
                        <SectionContent>{section.content || 'No content for this section yet.'}</SectionContent>
                    </Section>
                ))}
            </Surface>
        </PageContentBlock>
    );
};
