<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('knowledge_base_articles')) {
            Schema::create('knowledge_base_articles', function (Blueprint $table) {
                $table->id();
                $table->unsignedInteger('created_by')->nullable();
                $table->string('title', 191);
                $table->string('slug', 191)->unique();
                $table->text('summary')->nullable();
                $table->longText('readme')->nullable();
                $table->boolean('is_published')->default(true);
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();

                $table->index(['is_published', 'sort_order']);
                $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            });
        }

        if (!Schema::hasTable('knowledge_base_sections')) {
            Schema::create('knowledge_base_sections', function (Blueprint $table) {
                $table->id();
                $table->foreignId('knowledge_base_article_id')->constrained('knowledge_base_articles')->cascadeOnDelete();
                $table->string('title', 191);
                $table->longText('content')->nullable();
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();

                $table->index(['knowledge_base_article_id', 'sort_order'], 'kb_sections_article_sort_idx');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('knowledge_base_sections');
        Schema::dropIfExists('knowledge_base_articles');
    }
};
