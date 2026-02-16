<?php

namespace Pterodactyl\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Pterodactyl\Models\User;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class EnsureRegistrationEnabled
{
    public function handle(Request $request, Closure $next): Response
    {
        $hasUsers = true;
        try {
            $hasUsers = User::query()->exists();
        } catch (\Throwable) {
            // If the database cannot be queried, fall back to normal
            // registration setting behavior without crashing the request.
        }

        // Always allow creating the first account so the panel can be bootstrapped.
        if (config('pterodactyl.auth.registration_enabled', true) || !$hasUsers) {
            return $next($request);
        }

        // For browser hits, keep the user on the login page. For any write action
        // (or API style request), behave as if the endpoint does not exist.
        if ($request->isMethod('get')) {
            return redirect()->route('auth.login');
        }

        throw new NotFoundHttpException('Registration is disabled.');
    }
}
