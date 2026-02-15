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
use Pterodactyl\Events\Server\Deleting as ServerDeletingEvent;
use Illuminate\Contracts\Notifications\Dispatcher;

class ServerDeleted extends Notification implements ShouldQueue, ReceivesEvents
{
    use Queueable;

    public Server $server;
    public User $user;

    /**
     * @phpstan-param ServerDeletingEvent $event
     */
    public function handle(Event|ServerDeletingEvent $event): void
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
        return [
            'kind' => 'server_deleted',
            'title' => 'Server deleted',
            'message' => sprintf('"%s" has been deleted.', $this->server->name),
            'action_url' => '/servers',
            'server' => [
                'uuid' => $this->server->uuid,
                'uuid_short' => $this->server->uuidShort,
                'name' => $this->server->name,
            ],
        ];
    }
}
