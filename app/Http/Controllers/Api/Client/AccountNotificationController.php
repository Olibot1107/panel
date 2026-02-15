<?php

namespace Pterodactyl\Http\Controllers\Api\Client;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Notifications\DatabaseNotification;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;
use Pterodactyl\Transformers\Api\Client\NotificationTransformer;

class AccountNotificationController extends ClientApiController
{
    /**
     * Returns paginated notifications for the authenticated user.
     */
    public function index(ClientApiRequest $request): array
    {
        $limit = min((int) $request->query('per_page', 25), 100);

        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->paginate($limit)
            ->appends($request->query());

        return $this->fractal->collection($notifications)
            ->transformWith($this->getTransformer(NotificationTransformer::class))
            ->addMeta([
                'unread_count' => $request->user()->unreadNotifications()->count(),
            ])
            ->toArray();
    }

    /**
     * Returns the count of unread notifications for the authenticated user.
     */
    public function unreadCount(ClientApiRequest $request): JsonResponse
    {
        return new JsonResponse([
            'data' => [
                'unread_count' => $request->user()->unreadNotifications()->count(),
            ],
        ]);
    }

    /**
     * Marks a single notification as read.
     */
    public function read(ClientApiRequest $request, string $id): JsonResponse
    {
        /** @var DatabaseNotification $notification */
        $notification = $request->user()->notifications()->whereKey($id)->firstOrFail();
        $notification->markAsRead();

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    /**
     * Marks all notifications as read.
     */
    public function readAll(ClientApiRequest $request): JsonResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    /**
     * Deletes a notification.
     */
    public function delete(Request $request, string $id): JsonResponse
    {
        /** @var DatabaseNotification $notification */
        $notification = $request->user()->notifications()->whereKey($id)->firstOrFail();
        $notification->delete();

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }
}
