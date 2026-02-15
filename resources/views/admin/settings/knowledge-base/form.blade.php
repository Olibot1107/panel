@extends('layouts.admin')
@section('title')
    {{ $title }}
@endsection

@section('content-header')
    <h1>{{ $title }}<small>Write readme content and sectioned docs.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.settings') }}">Settings</a></li>
        <li><a href="{{ route('admin.settings.knowledge-base') }}">Docs</a></li>
        <li class="active">{{ $article ? 'Edit' : 'New' }}</li>
    </ol>
@endsection

@section('content')
    <form action="{{ $route }}" method="POST">
        {!! csrf_field() !!}
        @if($method !== 'POST')
            <input type="hidden" name="_method" value="{{ $method }}" />
        @endif

        <div class="row">
            <div class="col-xs-12 col-md-8">
                <div class="box box-primary">
                    <div class="box-header with-border">
                        <h3 class="box-title">Article</h3>
                    </div>
                    <div class="box-body">
                        <div class="form-group">
                            <label class="control-label">Title</label>
                            <input
                                type="text"
                                class="form-control"
                                name="title"
                                maxlength="191"
                                value="{{ old('title', $article->title ?? '') }}"
                                required
                            />
                        </div>
                        <div class="form-group">
                            <label class="control-label">Slug <span class="field-optional"></span></label>
                            <input
                                type="text"
                                class="form-control"
                                name="slug"
                                maxlength="191"
                                placeholder="auto-generated-from-title"
                                value="{{ old('slug', $article->slug ?? '') }}"
                            />
                            <p class="text-muted small">Lowercase letters, numbers and dashes only.</p>
                        </div>
                        <div class="form-group">
                            <label class="control-label">Summary <span class="field-optional"></span></label>
                            <textarea name="summary" class="form-control" rows="3">{{ old('summary', $article->summary ?? '') }}</textarea>
                            <p class="text-muted small">Short description shown in the docs list.</p>
                        </div>
                        <div class="form-group">
                            <label class="control-label">README Content <span class="field-optional"></span></label>
                            <textarea name="readme" class="form-control" rows="10">{{ old('readme', $article->readme ?? '') }}</textarea>
                            <p class="text-muted small">This is the top-level guide content for this article.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-xs-12 col-md-4">
                <div class="box">
                    <div class="box-header with-border">
                        <h3 class="box-title">Options</h3>
                    </div>
                    <div class="box-body">
                        <div class="form-group">
                            <label class="control-label">Sort Order</label>
                            <input
                                type="number"
                                class="form-control"
                                name="sort_order"
                                min="0"
                                max="9999"
                                value="{{ old('sort_order', $article->sort_order ?? 0) }}"
                            />
                        </div>
                        <div class="form-group">
                            @php($published = old('is_published', $article ? (int) $article->is_published : 1))
                            <label>
                                <input type="checkbox" name="is_published" value="1" @if((int) $published === 1) checked @endif />
                                Published
                            </label>
                        </div>
                    </div>
                    <div class="box-footer clearfix">
                        <a href="{{ route('admin.settings.knowledge-base') }}" class="btn btn-default btn-sm">Back</a>
                        <button type="submit" class="btn btn-primary btn-sm pull-right">Save Article</button>
                    </div>
                </div>

            </div>
        </div>

        <div class="row">
            <div class="col-xs-12">
                <div class="box">
                    <div class="box-header with-border">
                        <h3 class="box-title">Sections</h3>
                        <div class="box-tools">
                            <button type="button" class="btn btn-sm btn-default" id="addSectionButton">Add Section</button>
                        </div>
                    </div>
                    <div class="box-body" id="sectionsContainer">
                        @if(empty($sections))
                            <p class="text-muted" id="sectionsEmptyState">No sections yet. Add your first section.</p>
                        @endif

                        @foreach($sections as $index => $section)
                            <div class="panel panel-default kb-section">
                                <div class="panel-heading clearfix">
                                    <strong>Section</strong>
                                    <button type="button" class="btn btn-xs btn-danger pull-right remove-section">Remove</button>
                                </div>
                                <div class="panel-body">
                                    <div class="row">
                                        <div class="form-group col-md-8">
                                            <label class="control-label">Section Title</label>
                                            <input type="text" class="form-control" name="sections[{{ $index }}][title]" value="{{ $section['title'] ?? '' }}" maxlength="191" />
                                        </div>
                                        <div class="form-group col-md-4">
                                            <label class="control-label">Sort Order</label>
                                            <input type="number" class="form-control" min="0" max="9999" name="sections[{{ $index }}][sort_order]" value="{{ $section['sort_order'] ?? (($index + 1) * 10) }}" />
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label class="control-label">Content</label>
                                        <textarea class="form-control" rows="8" name="sections[{{ $index }}][content]">{{ $section['content'] ?? '' }}</textarea>
                                    </div>
                                </div>
                            </div>
                        @endforeach
                    </div>
                </div>
            </div>
        </div>
    </form>
@endsection

@section('footer-scripts')
    @parent

    <script>
        (function () {
            var sectionCount = {{ count($sections) }};
            var container = document.getElementById('sectionsContainer');
            var addButton = document.getElementById('addSectionButton');

            function removeEmptyState() {
                var empty = document.getElementById('sectionsEmptyState');
                if (empty) empty.remove();
            }

            function buildSection(index) {
                var wrapper = document.createElement('div');
                wrapper.className = 'panel panel-default kb-section';
                wrapper.innerHTML = `
                    <div class="panel-heading clearfix">
                        <strong>Section</strong>
                        <button type="button" class="btn btn-xs btn-danger pull-right remove-section">Remove</button>
                    </div>
                    <div class="panel-body">
                        <div class="row">
                            <div class="form-group col-md-8">
                                <label class="control-label">Section Title</label>
                                <input type="text" class="form-control" name="sections[${index}][title]" maxlength="191" />
                            </div>
                            <div class="form-group col-md-4">
                                <label class="control-label">Sort Order</label>
                                <input type="number" class="form-control" min="0" max="9999" name="sections[${index}][sort_order]" value="${(index + 1) * 10}" />
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="control-label">Content</label>
                            <textarea class="form-control" rows="8" name="sections[${index}][content]"></textarea>
                        </div>
                    </div>
                `;

                return wrapper;
            }

            addButton.addEventListener('click', function () {
                removeEmptyState();
                container.appendChild(buildSection(sectionCount));
                sectionCount++;
            });

            container.addEventListener('click', function (event) {
                var target = event.target;
                if (!(target instanceof HTMLElement)) return;
                if (!target.classList.contains('remove-section')) return;

                var block = target.closest('.kb-section');
                if (block) {
                    block.remove();
                }

                if (!container.querySelector('.kb-section')) {
                    var empty = document.createElement('p');
                    empty.className = 'text-muted';
                    empty.id = 'sectionsEmptyState';
                    empty.textContent = 'No sections yet. Add your first section.';
                    container.appendChild(empty);
                }
            });
        })();
    </script>
@endsection
