<?php

namespace Pterodactyl\Notifications;

use Pterodactyl\Models\User;
use Illuminate\Bus\Queueable;
use Pterodactyl\Events\Event;
use Pterodactyl\Models\Server;
use Illuminate\Container\Container;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Pterodactyl\Contracts\Core\ReceivesEvents;
use Pterodactyl\Events\Server\Unsuspended as ServerUnsuspendedEvent;
use Illuminate\Contracts\Notifications\Dispatcher;

class ServerUnsuspended extends Notification implements ShouldQueue, ReceivesEvents
{
    use Queueable;

    public Server $server;
    public User $user;

    /**
     * @phpstan-param ServerUnsuspendedEvent $event
     */
    public function handle(Event|ServerUnsuspendedEvent $event): void
    {
        $event->server->loadMissing('user');

        $this->server = $event->server;
        $this->user = $event->server->user;

        Container::getInstance()->make(Dispatcher::class)->sendNow($this->user, $this);
    }

    public function via(): array
    {
        return ['database'];
    }

    public function toArray(): array
    {
        $actionUrl = '/server/' . $this->server->uuidShort;

        return [
            'kind' => 'server_unsuspended',
            'title' => 'Server unsuspended',
            'message' => sprintf('"%s" has been unsuspended and can be started again.', $this->server->name),
            'action_url' => $actionUrl,
            'server' => [
                'uuid' => $this->server->uuid,
                'uuid_short' => $this->server->uuidShort,
                'name' => $this->server->name,
            ],
        ];
    }
}
