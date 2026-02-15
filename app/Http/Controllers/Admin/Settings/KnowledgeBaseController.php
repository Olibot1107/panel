<?php

namespace Pterodactyl\Http\Controllers\Admin\Settings;

use Illuminate\Support\Str;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Prologue\Alerts\AlertsMessageBag;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\KnowledgeBaseArticle;
use Pterodactyl\Http\Requests\Admin\Settings\StoreKnowledgeBaseArticleRequest;
use Pterodactyl\Http\Requests\Admin\Settings\UpdateKnowledgeBaseArticleRequest;

class KnowledgeBaseController extends Controller
{
    public function __construct(private AlertsMessageBag $alert)
    {
    }

    public function index(): View
    {
        $articles = KnowledgeBaseArticle::query()
            ->withCount('sections')
            ->orderBy('sort_order')
            ->orderBy('title')
            ->get();

        return view('admin.settings.knowledge-base.index', [
            'articles' => $articles,
        ]);
    }

    public function create(): View
    {
        return view('admin.settings.knowledge-base.form', [
            'article' => null,
            'sections' => old('sections', []),
            'route' => route('admin.settings.knowledge-base.store'),
            'method' => 'POST',
            'title' => 'New Docs Article',
        ]);
    }

    public function view(KnowledgeBaseArticle $article): View
    {
        $article->loadMissing('sections');

        return view('admin.settings.knowledge-base.form', [
            'article' => $article,
            'sections' => old('sections', $article->sections->map(fn ($section) => [
                'title' => $section->title,
                'content' => $section->content,
                'sort_order' => $section->sort_order,
            ])->values()->toArray()),
            'route' => route('admin.settings.knowledge-base.update', $article->id),
            'method' => 'PATCH',
            'title' => 'Edit Docs Article',
        ]);
    }

    public function store(StoreKnowledgeBaseArticleRequest $request): RedirectResponse
    {
        $article = DB::transaction(function () use ($request): KnowledgeBaseArticle {
            $article = KnowledgeBaseArticle::query()->create([
                'created_by' => $request->user()->id,
                'title' => trim($request->string('title')->toString()),
                'slug' => $this->resolveSlug($request->input('slug'), $request->string('title')->toString()),
                'summary' => $request->input('summary'),
                'readme' => $request->input('readme'),
                'is_published' => $request->boolean('is_published'),
                'sort_order' => (int) $request->input('sort_order', 0),
            ]);

            $this->syncSections($article, $request->input('sections', []));

            return $article;
        });

        $this->alert->success('Docs article created.')->flash();

        return redirect()->route('admin.settings.knowledge-base.view', $article->id);
    }

    public function update(UpdateKnowledgeBaseArticleRequest $request, KnowledgeBaseArticle $article): RedirectResponse
    {
        DB::transaction(function () use ($request, $article): void {
            $article->fill([
                'title' => trim($request->string('title')->toString()),
                'slug' => $this->resolveSlug(
                    $request->input('slug'),
                    $request->string('title')->toString(),
                    $article->id
                ),
                'summary' => $request->input('summary'),
                'readme' => $request->input('readme'),
                'is_published' => $request->boolean('is_published'),
                'sort_order' => (int) $request->input('sort_order', 0),
            ])->save();

            $this->syncSections($article, $request->input('sections', []));
        });

        $this->alert->success('Docs article updated.')->flash();

        return redirect()->route('admin.settings.knowledge-base.view', $article->id);
    }

    public function delete(KnowledgeBaseArticle $article): RedirectResponse
    {
        $article->delete();

        $this->alert->success('Docs article deleted.')->flash();

        return redirect()->route('admin.settings.knowledge-base');
    }

    protected function resolveSlug(?string $slugInput, string $title, ?int $ignoreArticleId = null): string
    {
        $base = trim((string) $slugInput) !== '' ? trim((string) $slugInput) : Str::slug($title);
        if ($base === '') {
            $base = 'article';
        }

        $slug = $base;
        $suffix = 2;
        while (KnowledgeBaseArticle::query()
            ->where('slug', $slug)
            ->when($ignoreArticleId, fn ($query) => $query->where('id', '!=', $ignoreArticleId))
            ->exists()
        ) {
            $slug = "{$base}-{$suffix}";
            ++$suffix;
        }

        return $slug;
    }

    /**
     * @param array<int, array{title?: string|null, content?: string|null, sort_order?: int|string|null}> $sections
     */
    protected function syncSections(KnowledgeBaseArticle $article, array $sections): void
    {
        $normalized = collect($sections)
            ->map(function (array $section, int $index): array {
                $title = trim((string) ($section['title'] ?? ''));
                $content = trim((string) ($section['content'] ?? ''));
                $sortOrder = (int) ($section['sort_order'] ?? ($index + 1) * 10);

                return [
                    'title' => $title,
                    'content' => $content,
                    'sort_order' => max($sortOrder, 0),
                ];
            })
            ->filter(fn (array $section): bool => $section['title'] !== '' || $section['content'] !== '')
            ->map(function (array $section): array {
                if ($section['title'] === '') {
                    $section['title'] = 'Section';
                }

                return $section;
            })
            ->values()
            ->toArray();

        $article->sections()->delete();
        if (!empty($normalized)) {
            $article->sections()->createMany($normalized);
        }
    }
}
