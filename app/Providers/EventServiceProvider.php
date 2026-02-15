<?php

namespace Pterodactyl\Providers;

use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Subuser;
use Pterodactyl\Models\EggVariable;
use Pterodactyl\Observers\UserObserver;
use Pterodactyl\Observers\ServerObserver;
use Pterodactyl\Observers\SubuserObserver;
use Pterodactyl\Listeners\TwoFactorListener;
use Pterodactyl\Listeners\RevocationListener;
use Pterodactyl\Observers\EggVariableObserver;
use Pterodactyl\Listeners\AuthenticationListener;
use Pterodactyl\Events\Server\Created as ServerCreatedEvent;
use Pterodactyl\Events\Server\Deleting as ServerDeletingEvent;
use Pterodactyl\Events\Server\Installed as ServerInstalledEvent;
use Pterodactyl\Events\Server\Suspended as ServerSuspendedEvent;
use Pterodactyl\Events\Server\Unsuspended as ServerUnsuspendedEvent;
use Pterodactyl\Notifications\ServerCreated as ServerCreatedNotification;
use Pterodactyl\Notifications\ServerDeleted as ServerDeletedNotification;
use Pterodactyl\Notifications\ServerInstalled as ServerInstalledNotification;
use Pterodactyl\Notifications\ServerSuspended as ServerSuspendedNotification;
use Pterodactyl\Notifications\ServerUnsuspended as ServerUnsuspendedNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     */
    protected $listen = [
        ServerCreatedEvent::class => [ServerCreatedNotification::class],
        ServerDeletingEvent::class => [ServerDeletedNotification::class],
        ServerInstalledEvent::class => [ServerInstalledNotification::class],
        ServerSuspendedEvent::class => [ServerSuspendedNotification::class],
        ServerUnsuspendedEvent::class => [ServerUnsuspendedNotification::class],
    ];

    protected $subscribe = [
        AuthenticationListener::class,
        RevocationListener::class,
        TwoFactorListener::class,
    ];

    protected static $shouldDiscoverEvents = false;

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        parent::boot();

        User::observe(UserObserver::class);
        Server::observe(ServerObserver::class);
        Subuser::observe(SubuserObserver::class);
        EggVariable::observe(EggVariableObserver::class);
    }
}
