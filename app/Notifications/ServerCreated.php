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
use Pterodactyl\Events\Server\Created as ServerCreatedEvent;
use Illuminate\Contracts\Notifications\Dispatcher;

class ServerCreated extends Notification implements ShouldQueue, ReceivesEvents
{
    use Queueable;

    public Server $server;
    public User $user;

    /**
     * @phpstan-param ServerCreatedEvent $event
     */
    public function handle(Event|ServerCreatedEvent $event): void
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
            'kind' => 'server_created',
            'title' => 'Server created',
            'message' => sprintf('"%s" has been created and is now in your account.', $this->server->name),
            'action_url' => $actionUrl,
            'server' => [
                'uuid' => $this->server->uuid,
                'uuid_short' => $this->server->uuidShort,
                'name' => $this->server->name,
            ],
        ];
    }
}
