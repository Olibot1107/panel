@extends('layouts.admin')

@section('title')
    Branding
@endsection

@section('content-header')
    <h1>Branding<small>Customize the client panel look and auth hero messaging.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.settings') }}">Settings</a></li>
        <li class="active">Branding</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">Client Panel Branding</h3>
                </div>
                <form action="{{ route('admin.settings.branding') }}" method="POST" enctype="multipart/form-data">
                    <div class="box-body">
                        <div class="row">
                            <div class="form-group col-md-6">
                                <label class="control-label">Panel Icon</label>
                                <div>
                                    @php
                                        $icon = (string) config('branding.icon', '');
                                    @endphp
                                    <div style="display: flex; gap: 14px; align-items: flex-start;">
                                        <div style="flex: 1 1 auto; min-width: 0;">
                                            <input type="file" class="form-control" name="branding:icon_file" accept="image/png,image/jpeg,image/webp" />
                                            <p class="text-muted" style="margin: .4rem 0 0 0;">
                                                <small>Shows in the client panel sidebar brand and on the auth pages. PNG/JPG/WEBP up to 2MB.</small>
                                            </p>
                                        </div>
                                        @if(!empty($icon))
                                            <div style="flex: 0 0 auto;">
                                                <img
                                                    src="/{{ $icon }}"
                                                    alt="Panel Icon"
                                                    style="width: 64px; height: 64px; object-fit: cover; background: #0b1220; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px;"
                                                >
                                            </div>
                                        @endif
                                    </div>
                                </div>
                            </div>
                            <div class="form-group col-md-6">
                                <label class="control-label">Auth Hero Title</label>
                                <div>
                                    <input
                                        type="text"
                                        class="form-control"
                                        name="branding:auth_hero_title"
                                        value="{{ old('branding:auth_hero_title', config('branding.auth_hero_title')) }}"
                                        placeholder="Control your servers in one place."
                                    />
                                    <p class="text-muted"><small>Shown on the left hero panel on the login and registration pages.</small></p>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="form-group col-md-12">
                                <label class="control-label">Auth Hero Tagline</label>
                                <div>
                                    <textarea
                                        class="form-control"
                                        name="branding:auth_hero_tagline"
                                        rows="3"
                                        placeholder="Secure access to deployments, monitoring, and account tools using the same interface style as your dashboard."
                                    >{{ old('branding:auth_hero_tagline', config('branding.auth_hero_tagline')) }}</textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="box-footer">
                        {!! csrf_field() !!}
                        <button type="submit" name="_method" value="PATCH" class="btn btn-sm btn-primary pull-right">Save</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
@endsection
