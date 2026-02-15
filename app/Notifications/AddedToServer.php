<?php

namespace Pterodactyl\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;

class AddedToServer extends Notification implements ShouldQueue
{
    use Queueable;

    public object $server;

    /**
     * Create a new notification instance.
     */
    public function __construct(array $server)
    {
        $this->server = (object) $server;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(): MailMessage
    {
        return (new MailMessage())
            ->greeting('Hello ' . $this->server->user . '!')
            ->line('You have been added as a subuser for the following server, allowing you certain control over the server.')
            ->line('Server Name: ' . $this->server->name)
            ->action('Visit Server', url('/server/' . $this->server->uuidShort));
    }

    /**
     * Get the array representation of the notification for database storage.
     */
    public function toArray(): array
    {
        return [
            'kind' => 'server_invite',
            'title' => 'Added to server',
            'message' => sprintf('You have been added as a subuser for "%s".', $this->server->name),
            // Store relative paths so notifications work no matter what host the panel is accessed on.
            'action_url' => '/server/' . $this->server->uuidShort,
            'server' => [
                'name' => $this->server->name,
                'uuid_short' => $this->server->uuidShort,
            ],
        ];
    }
}
