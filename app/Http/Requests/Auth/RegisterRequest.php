<?php

namespace Pterodactyl\Http\Requests\Auth;

use Pterodactyl\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return Collection::make(User::getRules())
            ->only(['email', 'username', 'name_first', 'name_last'])
            ->merge([
                'password' => ['required', 'string', 'confirmed', 'min:8'],
            ])
            ->toArray();
    }
}
