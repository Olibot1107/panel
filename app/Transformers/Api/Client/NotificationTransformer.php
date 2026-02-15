<?php

namespace Pterodactyl\Transformers\Api\Client;

use Illuminate\Notifications\DatabaseNotification;

class NotificationTransformer extends BaseClientTransformer
{
    public function getResourceName(): string
    {
        return 'notification';
    }

    public function transform(DatabaseNotification $model): array
    {
        $data = is_array($model->data) ? $model->data : [];

        return [
            'id' => $model->id,
            'type' => $model->type,
            'kind' => $data['kind'] ?? null,
            'title' => $data['title'] ?? null,
            'message' => $data['message'] ?? null,
            'action_url' => $data['action_url'] ?? null,
            'data' => (object) $data,
            'read_at' => $model->read_at?->toAtomString(),
            'created_at' => $model->created_at?->toAtomString(),
        ];
    }
}

