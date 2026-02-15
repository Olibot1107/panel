import http from '@/api/http';

export interface KnowledgeBaseSection {
    id: number;
    title: string;
    content: string | null;
    sortOrder: number;
}

export interface KnowledgeBaseArticleSummary {
    id: number;
    title: string;
    slug: string;
    summary: string | null;
    readmePreview: string | null;
    isPublished: boolean;
    sectionCount: number;
    updatedAt: Date | null;
}

export interface KnowledgeBaseArticle extends KnowledgeBaseArticleSummary {
    readme: string | null;
    sections: KnowledgeBaseSection[];
}

const toSummary = (data: any): KnowledgeBaseArticleSummary => ({
    id: data.id,
    title: data.title,
    slug: data.slug,
    summary: data.summary,
    readmePreview: data.readme_preview,
    isPublished: !!data.is_published,
    sectionCount: Number(data.section_count || 0),
    updatedAt: data.updated_at ? new Date(data.updated_at) : null,
});

const toArticle = (data: any): KnowledgeBaseArticle => ({
    ...toSummary(data),
    readme: data.readme ?? null,
    sections: Array.isArray(data.sections)
        ? data.sections.map((section: any) => ({
              id: section.id,
              title: section.title,
              content: section.content ?? null,
              sortOrder: Number(section.sort_order || 0),
          }))
        : [],
});

export const listKnowledgeBaseArticles = async (search?: string): Promise<KnowledgeBaseArticleSummary[]> => {
    const { data } = await http.get('/api/client/support/knowledge-base', {
        params: {
            search: search && search.trim().length > 0 ? search.trim() : undefined,
        },
    });

    return Array.isArray(data?.data) ? data.data.map(toSummary) : [];
};

export const getKnowledgeBaseArticle = async (slug: string): Promise<KnowledgeBaseArticle> => {
    const { data } = await http.get(`/api/client/support/knowledge-base/${encodeURIComponent(slug)}`);
    return toArticle(data?.data || {});
};
