<?php

namespace Pterodactyl\Http\Requests\Api\Client\Account;

use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class UpdateAvatarRequest extends ClientApiRequest
{
    public function rules(): array
    {
        return [
            'avatar' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }
}
