<?php

namespace Pterodactyl\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class EnsureAccountNotSuspended
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (!$user || $user->root_admin || !$user->isSuspended()) {
            return $next($request);
        }

        if ($request->expectsJson() || str_starts_with($request->path(), 'api/')) {
            return new JsonResponse([
                'errors' => [[
                    'detail' => 'This account has been suspended.',
                ]],
            ], 403);
        }

        // Force the user out of the session before sending them back to the login screen.
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/auth/login?suspended=1');
    }
}

