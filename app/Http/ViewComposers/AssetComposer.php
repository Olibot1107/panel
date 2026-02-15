<?php

namespace Pterodactyl\Http\ViewComposers;

use Illuminate\View\View;
use Pterodactyl\Services\Helpers\AssetHashService;

class AssetComposer
{
    /**
     * AssetComposer constructor.
     */
    public function __construct(private AssetHashService $assetHashService)
    {
    }

    /**
     * Provide access to the asset service in the views.
     */
    public function compose(View $view): void
    {
        $view->with('asset', $this->assetHashService);
        $view->with('siteConfiguration', [
            'name' => config('app.name') ?? 'Voidium Pannel',
            'locale' => config('app.locale') ?? 'en',
            'branding' => [
                // Stored as a relative path under /public (e.g. "uploads/branding/panel-icon.png").
                'icon' => config('branding.icon') ?? '',
                'authHeroTitle' => config('branding.auth_hero_title') ?? 'Control your servers in one place.',
                'authHeroTagline' => config('branding.auth_hero_tagline')
                    ?? 'Secure access to deployments, monitoring, and account tools using the same interface style as your dashboard.',
            ],
            'recaptcha' => [
                'enabled' => config('recaptcha.enabled', false),
                'siteKey' => config('recaptcha.website_key') ?? '',
            ],
            'registration' => [
                'enabled' => config('pterodactyl.auth.registration_enabled', true),
            ],
        ]);
    }
}
