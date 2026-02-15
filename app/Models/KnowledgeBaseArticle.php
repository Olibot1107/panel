<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int|null $created_by
 * @property string $title
 * @property string $slug
 * @property string|null $summary
 * @property string|null $readme
 * @property bool $is_published
 * @property int $sort_order
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property User|null $creator
 * @property \Illuminate\Database\Eloquent\Collection<int, KnowledgeBaseSection> $sections
 *
 * @method static Builder|KnowledgeBaseArticle published()
 * @method static Builder|KnowledgeBaseArticle newModelQuery()
 * @method static Builder|KnowledgeBaseArticle newQuery()
 * @method static Builder|KnowledgeBaseArticle query()
 *
 * @mixin \Eloquent
 */
class KnowledgeBaseArticle extends Model
{
    public const RESOURCE_NAME = 'knowledge_base_article';

    protected $table = 'knowledge_base_articles';

    protected $fillable = [
        'created_by',
        'title',
        'slug',
        'summary',
        'readme',
        'is_published',
        'sort_order',
    ];

    protected $casts = [
        'created_by' => 'int',
        'is_published' => 'bool',
        'sort_order' => 'int',
    ];

    public static array $validationRules = [
        'title' => ['required', 'string', 'min:2', 'max:191'],
        'slug' => ['required', 'string', 'min:1', 'max:191'],
        'summary' => ['nullable', 'string'],
        'readme' => ['nullable', 'string'],
        'is_published' => ['boolean'],
        'sort_order' => ['integer', 'min:0'],
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return HasMany<KnowledgeBaseSection, $this>
     */
    public function sections(): HasMany
    {
        return $this->hasMany(KnowledgeBaseSection::class)->orderBy('sort_order')->orderBy('id');
    }

    public function scopePublished(Builder $builder): Builder
    {
        return $builder->where('is_published', true);
    }
}

