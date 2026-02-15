<?php

namespace Pterodactyl\Http\Requests\Admin\Settings;

use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class BrandingSettingsFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'branding:auth_hero_title' => 'nullable|string|max:191',
            'branding:auth_hero_tagline' => 'nullable|string|max:512',
            // Stored as "branding:icon" after upload; this field is only the upload payload.
            'branding:icon_file' => 'nullable|file|max:2048|mimes:png,jpg,jpeg,webp',
        ];
    }

    public function attributes(): array
    {
        return [
            'branding:auth_hero_title' => 'Auth Hero Title',
            'branding:auth_hero_tagline' => 'Auth Hero Tagline',
            'branding:icon_file' => 'Panel Icon',
        ];
    }
}

