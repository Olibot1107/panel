<?php

namespace Pterodactyl\Http\Controllers\Api\Client;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Arr;
use Pterodactyl\Models\Node;
use Throwable;
use Pterodactyl\Repositories\Wings\DaemonConfigurationRepository;

class NodeStatusController extends ClientApiController
{
    public function __construct(private DaemonConfigurationRepository $repository)
    {
        parent::__construct();
    }

    /**
     * Return node online status and capacity information for root admins.
     */
    public function __invoke(Request $request): JsonResponse
    {
        abort_unless($request->user()->root_admin, JsonResponse::HTTP_FORBIDDEN);

        $nodes = Node::query()->with(['servers:id,node_id,memory,disk,cpu'])->get();
        $data = [];

        foreach ($nodes as $node) {
            $allocatedMemory = (int) $node->servers->sum('memory');
            $allocatedDisk = (int) $node->servers->sum('disk');
            $allocatedCpu = (int) $node->servers->sum('cpu');

            $online = false;
            $system = [];

            try {
                $system = $this->repository->setNode($node)->getSystemInformation();
                $online = true;
            } catch (Throwable) {
                // Keep node in response and mark as offline if Wings is unreachable.
            }

            $cpuCount = (int) Arr::get($system, 'cpu_count', 0);
            $allocatedCpuPercent = $cpuCount > 0 ? round(($allocatedCpu / ($cpuCount * 100)) * 100, 2) : null;
            $displayName = Arr::get($system, 'hostname')
                ?? Arr::get($system, 'name')
                ?? $node->name
                ?? $node->fqdn;

            $data[] = [
                'id' => $node->id,
                'uuid' => $node->uuid,
                'display_name' => $displayName,
                'name' => $node->name,
                'fqdn' => $node->fqdn,
                'online' => $online,
                'maintenance_mode' => (bool) $node->maintenance_mode,
                'cpu' => [
                    'cores' => $cpuCount,
                    'allocated_limit' => $allocatedCpu,
                    'allocated_percent' => $allocatedCpuPercent,
                ],
                'memory' => [
                    'total_mb' => (int) $node->memory,
                    'allocated_mb' => $allocatedMemory,
                    'allocated_percent' => $node->memory > 0 ? round(($allocatedMemory / $node->memory) * 100, 2) : null,
                ],
                'disk' => [
                    'total_mb' => (int) $node->disk,
                    'allocated_mb' => $allocatedDisk,
                    'allocated_percent' => $node->disk > 0 ? round(($allocatedDisk / $node->disk) * 100, 2) : null,
                ],
            ];
        }

        return new JsonResponse(['data' => $data]);
    }
}
