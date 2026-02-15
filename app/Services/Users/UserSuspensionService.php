<?php

namespace Pterodactyl\Services\Users;

use Pterodactyl\Models\User;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Exceptions\DisplayException;

class UserSuspensionService
{
    /**
     * @throws DisplayException
     */
    public function suspend(User $user, ?string $reason = null): void
    {
        if ($user->root_admin) {
            throw new DisplayException('Cannot suspend an administrator account.');
        }

        if (!is_null($user->suspended_at)) {
            return;
        }

        $user->forceFill([
            'suspended_at' => now(),
            'suspended_reason' => $reason ? mb_substr($reason, 0, 191) : null,
        ])->saveOrFail();

        Activity::event('user:account.suspended')
            ->subject($user)
            ->property(['reason' => $reason])
            ->log();
    }

    public function unsuspend(User $user): void
    {
        if (is_null($user->suspended_at)) {
            return;
        }

        $user->forceFill([
            'suspended_at' => null,
            'suspended_reason' => null,
        ])->saveOrFail();

        Activity::event('user:account.unsuspended')
            ->subject($user)
            ->log();
    }
}

