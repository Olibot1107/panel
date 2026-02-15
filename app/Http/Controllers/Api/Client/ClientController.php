<?php

namespace Pterodactyl\Http\Controllers\Api\Client;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Permission;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use Pterodactyl\Models\Filters\MultiFieldServerFilter;
use Pterodactyl\Transformers\Api\Client\ServerTransformer;
use Pterodactyl\Http\Requests\Api\Client\GetServersRequest;

class ClientController extends ClientApiController
{
    /**
     * ClientController constructor.
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Return all the servers available to the client making the API
     * request, including servers the user has access to as a subuser.
     */
    public function index(GetServersRequest $request): array
    {
        $user = $request->user();
        $transformer = $this->getTransformer(ServerTransformer::class);

        // Start the query builder and ensure we eager load any requested relationships from the request.
        $builder = QueryBuilder::for(
            Server::query()->with($this->getIncludesForTransformer($transformer, ['node']))
        )->allowedFilters([
            'uuid',
            'name',
            'description',
            'external_id',
            AllowedFilter::custom('*', new MultiFieldServerFilter()),
        ]);

        $type = $request->input('type');
        // Either return all the servers the user has access to because they are an admin `?type=admin` or
        // just return all the servers the user has access to because they are the owner or a subuser of the
        // server. If ?type=admin-all is passed all servers on the system will be returned to the user, rather
        // than only servers they can see because they are an admin.
        if (in_array($type, ['admin', 'admin-all'])) {
            // If they aren't an admin but want all the admin servers don't fail the request, just
            // make it a query that will never return any results back.
            if (!$user->root_admin) {
                $builder->whereRaw('1 = 2');
            } else {
                $builder = $type === 'admin-all'
                    ? $builder
                    : $builder->whereNotIn('servers.id', $user->accessibleServers()->pluck('id')->all());
            }
        } elseif ($type === 'owner') {
            $builder = $builder->where('servers.owner_id', $user->id);
        } else {
            $builder = $builder->whereIn('servers.id', $user->accessibleServers()->pluck('id')->all());
        }

        $this->applyServerOrdering($builder, $user->server_order ?? []);

        $servers = $builder->paginate(min($request->query('per_page', 50), 100))->appends($request->query());

        return $this->fractal->transformWith($transformer)->collection($servers)->toArray();
    }

    /**
     * Persist a preferred server order for the authenticated user.
     */
    public function reorderServers(Request $request): JsonResponse
    {
        $data = $request->validate([
            'server_ids' => ['required', 'array', 'min:1'],
            'server_ids.*' => ['integer', 'distinct'],
        ]);

        $user = $request->user();
        $accessibleIds = $user->accessibleServers()->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values();

        $requested = collect($data['server_ids'])
            ->map(fn ($id) => (int) $id)
            ->intersect($accessibleIds)
            ->values();

        if ($requested->isEmpty()) {
            return new JsonResponse([
                'errors' => [[
                    'code' => 'ValidationException',
                    'status' => '422',
                    'detail' => 'None of the provided server ids are accessible to this user.',
                ]],
            ], 422);
        }

        $currentOrder = collect($user->server_order ?? [])
            ->map(fn ($id) => (int) $id)
            ->intersect($accessibleIds)
            ->values();

        $remaining = $currentOrder->reject(fn ($id) => $requested->contains($id))->values();
        $unordered = $accessibleIds
            ->reject(fn ($id) => $requested->contains($id) || $remaining->contains($id))
            ->values();

        $newOrder = $requested->concat($remaining)->concat($unordered)->values()->all();

        $user->forceFill(['server_order' => $newOrder])->save();

        return new JsonResponse(['data' => ['server_order' => $newOrder]]);
    }

    /**
     * Apply user-selected server ordering with a deterministic fallback.
     */
    protected function applyServerOrdering(QueryBuilder $builder, array $order): void
    {
        $order = collect($order)
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values();

        if ($order->isEmpty()) {
            $builder->orderByDesc('servers.id');
            return;
        }

        $caseSql = 'CASE';
        $bindings = [];
        foreach ($order as $index => $id) {
            $caseSql .= ' WHEN servers.id = ? THEN ' . $index;
            $bindings[] = $id;
        }
        $caseSql .= ' ELSE ' . $order->count() . ' END';

        $builder->orderByRaw($caseSql, $bindings)->orderByDesc('servers.id');
    }

    /**
     * Returns all the subuser permissions available on the system.
     */
    public function permissions(): array
    {
        return [
            'object' => 'system_permissions',
            'attributes' => [
                'permissions' => Permission::permissions(),
            ],
        ];
    }
}
