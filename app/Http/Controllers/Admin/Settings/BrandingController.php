<?php

namespace Pterodactyl\Http\Controllers\Admin\Settings;

use Illuminate\View\View;
use Illuminate\Support\Str;
use Illuminate\Http\RedirectResponse;
use Prologue\Alerts\AlertsMessageBag;
use Illuminate\Contracts\Console\Kernel;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Pterodactyl\Http\Requests\Admin\Settings\BrandingSettingsFormRequest;

class BrandingController extends Controller
{
    public function __construct(
        private AlertsMessageBag $alert,
        private Kernel $kernel,
        private SettingsRepositoryInterface $settings,
    ) {
    }

    public function index(): View
    {
        return view('admin.settings.branding');
    }

    /**
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
     */
    public function update(BrandingSettingsFormRequest $request): RedirectResponse
    {
        foreach (
            $request->normalize([
                'branding:auth_hero_title',
                'branding:auth_hero_tagline',
            ]) as $key => $value
        ) {
            $this->settings->set('settings::' . $key, $value);
        }

        if ($request->hasFile('branding:icon_file')) {
            $file = $request->file('branding:icon_file');

            $extension = mb_strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'png');
            $filename = sprintf('panel_icon_%s.%s', Str::random(16), $extension);
            $relativePath = 'uploads/branding/' . $filename;
            $directory = public_path('uploads/branding');

            if (!is_dir($directory)) {
                mkdir($directory, 0755, true);
            }

            $previous = (string) $this->settings->get('settings::branding:icon', '');
            $file->move($directory, $filename);
            $this->settings->set('settings::branding:icon', $relativePath);

            if (!empty($previous) && str_starts_with($previous, 'uploads/branding/')) {
                $previousPath = public_path($previous);
                if (is_file($previousPath)) {
                    @unlink($previousPath);
                }
            }
        }

        $this->kernel->call('queue:restart');
        $this->alert->success('Branding settings have been updated successfully and the queue worker was restarted to apply these changes.')->flash();

        return redirect()->route('admin.settings.branding');
    }
}

