<?php

namespace Pterodactyl\Notifications;

use Illuminate\Notifications\Notification;

class ServerCrashed extends Notification
{
    public function __construct(
        private string $serverUuid,
        private string $serverName,
        private ?string $serverUuidShort = null,
        private ?int $exitCode = null,
        private ?string $signal = null,
    ) {
    }

    public function via(): array
    {
        // Database only: remote activity processing should be fast and non-blocking.
        return ['database'];
    }

    public function toArray(): array
    {
        $details = [];
        if (!is_null($this->exitCode)) $details[] = "exit code {$this->exitCode}";
        if (!is_null($this->signal)) $details[] = "signal {$this->signal}";

        $message = sprintf('"%s" appears to have crashed.', $this->serverName);
        if (!empty($details)) {
            $message .= ' (' . implode(', ', $details) . ')';
        }

        $actionUrl = $this->serverUuidShort ? '/server/' . $this->serverUuidShort : '/';

        return [
            'kind' => 'server_crash',
            'title' => 'Server crashed',
            'message' => $message,
            'action_url' => $actionUrl,
            'server' => [
                'uuid' => $this->serverUuid,
                'uuid_short' => $this->serverUuidShort,
                'name' => $this->serverName,
            ],
            'exit_code' => $this->exitCode,
            'signal' => $this->signal,
        ];
    }
}
