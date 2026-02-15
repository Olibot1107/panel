<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $knowledge_base_article_id
 * @property string $title
 * @property string|null $content
 * @property int $sort_order
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property KnowledgeBaseArticle $article
 *
 * @method static Builder|KnowledgeBaseSection newModelQuery()
 * @method static Builder|KnowledgeBaseSection newQuery()
 * @method static Builder|KnowledgeBaseSection query()
 *
 * @mixin \Eloquent
 */
class KnowledgeBaseSection extends Model
{
    public const RESOURCE_NAME = 'knowledge_base_section';

    protected $table = 'knowledge_base_sections';

    protected $fillable = [
        'knowledge_base_article_id',
        'title',
        'content',
        'sort_order',
    ];

    protected $casts = [
        'knowledge_base_article_id' => 'int',
        'sort_order' => 'int',
    ];

    public static array $validationRules = [
        'knowledge_base_article_id' => ['required', 'integer', 'exists:knowledge_base_articles,id'],
        'title' => ['required', 'string', 'min:1', 'max:191'],
        'content' => ['nullable', 'string'],
        'sort_order' => ['integer', 'min:0'],
    ];

    /**
     * @return BelongsTo<KnowledgeBaseArticle, $this>
     */
    public function article(): BelongsTo
    {
        return $this->belongsTo(KnowledgeBaseArticle::class, 'knowledge_base_article_id');
    }
}

