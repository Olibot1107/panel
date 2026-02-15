@extends('layouts.admin')
@section('title')
    Docs
@endsection

@section('content-header')
    <h1>Docs<small>Create and organize documentation pages.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.settings') }}">Settings</a></li>
        <li class="active">Docs</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">Docs Articles</h3>
                    <div class="box-tools">
                        <a href="{{ route('admin.settings.knowledge-base.new') }}" class="btn btn-sm btn-primary">New Article</a>
                    </div>
                </div>
                <div class="box-body table-responsive no-padding">
                    <table class="table table-hover">
                        <tbody>
                        <tr>
                            <th>Title</th>
                            <th>Slug</th>
                            <th>Status</th>
                            <th>Sections</th>
                            <th>Sort</th>
                            <th>Updated</th>
                            <th class="text-right">Actions</th>
                        </tr>
                        @forelse($articles as $article)
                            <tr>
                                <td>{{ $article->title }}</td>
                                <td><code>{{ $article->slug }}</code></td>
                                <td>
                                    @if($article->is_published)
                                        <span class="label label-success">Published</span>
                                    @else
                                        <span class="label label-default">Draft</span>
                                    @endif
                                </td>
                                <td>{{ $article->sections_count }}</td>
                                <td>{{ $article->sort_order }}</td>
                                <td>{{ $article->updated_at?->format('Y-m-d H:i') }}</td>
                                <td class="text-right">
                                    <a class="btn btn-xs btn-primary" href="{{ route('admin.settings.knowledge-base.view', $article->id) }}">Edit</a>
                                    <form action="{{ route('admin.settings.knowledge-base.delete', $article->id) }}" method="POST" style="display:inline-block;">
                                        {!! csrf_field() !!}
                                        <button type="submit" name="_method" value="DELETE" class="btn btn-xs btn-danger">Delete</button>
                                    </form>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="7" class="text-center text-muted">No docs articles yet.</td>
                            </tr>
                        @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
@endsection
