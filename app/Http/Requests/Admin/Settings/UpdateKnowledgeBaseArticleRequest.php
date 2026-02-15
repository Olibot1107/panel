<?php

namespace Pterodactyl\Http\Requests\Admin\Settings;

use Illuminate\Validation\Rule;
use Pterodactyl\Models\KnowledgeBaseArticle;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class UpdateKnowledgeBaseArticleRequest extends AdminFormRequest
{
    public function rules(): array
    {
        /** @var KnowledgeBaseArticle|null $article */
        $article = $this->route('article');

        return [
            'title' => ['required', 'string', 'min:2', 'max:191'],
            'slug' => [
                'nullable',
                'string',
                'max:191',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('knowledge_base_articles', 'slug')->ignore($article?->id),
            ],
            'summary' => ['nullable', 'string'],
            'readme' => ['nullable', 'string'],
            'is_published' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'sections' => ['nullable', 'array', 'max:100'],
            'sections.*.title' => ['nullable', 'string', 'max:191'],
            'sections.*.content' => ['nullable', 'string'],
            'sections.*.sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
        ];
    }
}

