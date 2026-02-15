<?php

namespace Pterodactyl\Http\Controllers\Api\Client;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Pterodactyl\Models\KnowledgeBaseArticle;
use Pterodactyl\Models\KnowledgeBaseSection;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class KnowledgeBaseController extends ClientApiController
{
    public function index(ClientApiRequest $request): JsonResponse
    {
        $query = KnowledgeBaseArticle::query()
            ->orderBy('sort_order')
            ->orderBy('title');

        if (!$request->user()->root_admin) {
            $query->published();
        }

        if ($request->filled('search')) {
            $search = trim($request->string('search')->toString());
            $query->where(function ($builder) use ($search) {
                $builder->where('title', 'like', "%{$search}%")
                    ->orWhere('summary', 'like', "%{$search}%")
                    ->orWhere('readme', 'like', "%{$search}%");
            });
        }

        $articles = $query->withCount('sections')->get();

        return new JsonResponse([
            'data' => $articles->map(fn (KnowledgeBaseArticle $article) => $this->transformSummary($article))
                ->values()
                ->toArray(),
        ]);
    }

    public function view(ClientApiRequest $request, string $slug): JsonResponse
    {
        $article = KnowledgeBaseArticle::query()
            ->where('slug', $slug)
            ->with('sections')
            ->firstOrFail();

        abort_unless($article->is_published || $request->user()->root_admin, JsonResponse::HTTP_NOT_FOUND);

        return new JsonResponse(['data' => $this->transformArticle($article)]);
    }

    protected function transformSummary(KnowledgeBaseArticle $article): array
    {
        return [
            'id' => $article->id,
            'title' => $article->title,
            'slug' => $article->slug,
            'summary' => $article->summary,
            'readme_preview' => $article->readme ? Str::limit(strip_tags($article->readme), 220) : null,
            'is_published' => $article->is_published,
            'section_count' => $article->sections_count ?? 0,
            'updated_at' => $article->updated_at?->toAtomString(),
        ];
    }

    protected function transformArticle(KnowledgeBaseArticle $article): array
    {
        return [
            ...$this->transformSummary($article),
            'readme' => $article->readme,
            'sections' => $article->sections
                ->map(fn (KnowledgeBaseSection $section) => [
                    'id' => $section->id,
                    'title' => $section->title,
                    'content' => $section->content,
                    'sort_order' => $section->sort_order,
                ])
                ->values()
                ->toArray(),
        ];
    }
}

