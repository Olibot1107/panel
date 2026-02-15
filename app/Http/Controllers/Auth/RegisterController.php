<?php

namespace Pterodactyl\Http\Controllers\Auth;

use Ramsey\Uuid\Uuid;
use Pterodactyl\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Contracts\Hashing\Hasher;
use Pterodactyl\Http\Requests\Auth\RegisterRequest;

class RegisterController extends AbstractLoginController
{
    public function __construct(private Hasher $hasher)
    {
        parent::__construct();
    }

    /**
     * Create a new panel user and immediately log them in.
     *
     * @throws \Throwable
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = new User();
        $user->forceFill([
            'uuid' => Uuid::uuid4()->toString(),
            'username' => $data['username'],
            'email' => $data['email'],
            'name_first' => $data['name_first'],
            'name_last' => $data['name_last'],
            'password' => $this->hasher->make($data['password']),
        ])->saveOrFail();

        return $this->sendLoginResponse($user, $request);
    }
}
