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
                $system = $this->repository->setNode($node)->getSystemInformation(2);
                $online = true;
            } catch (Throwable) {
                // Fallback for older Wings versions that may not support v2 payloads.
                try {
                    $system = $this->repository->setNode($node)->getSystemInformation();
                    $online = true;
                } catch (Throwable) {
                    // Keep node in response and mark as offline if Wings is unreachable.
                }
            }

            $cpuCount = (int) $this->firstNumeric($system, [
                'system.cpu_threads',
                'cpu_count',
                'system.cpu_count',
            ], 0);
            $allocatedCpuPercent = $cpuCount > 0 ? round(($allocatedCpu / ($cpuCount * 100)) * 100, 2) : null;

            $cpuLoadPercent = $this->firstNumeric($system, [
                'system.cpu_load_percent',
                'resources.cpu_absolute',
                'resources.cpu_usage',
                'cpu_absolute',
                'cpu_usage',
            ]);
            $cpuLoadAverage = $this->firstNumeric($system, [
                'system.load_average.1m',
                'system.load_average.one',
                'system.load_average.0',
                'load_average.one',
                'load_average.0',
            ]);
            if (is_null($cpuLoadPercent) && !is_null($cpuLoadAverage) && $cpuCount > 0) {
                $cpuLoadPercent = round(($cpuLoadAverage / $cpuCount) * 100, 2);
            }

            $memoryTotalBytes = $this->firstNumeric($system, [
                'system.memory_total_bytes',
                'system.memory_bytes',
                'memory_total_bytes',
                'memory_bytes',
            ]);
            $memoryUsedBytes = $this->firstNumeric($system, [
                'system.memory_used_bytes',
                'memory_used_bytes',
                'resources.memory_bytes',
            ]);

            $diskTotalBytes = $this->firstNumeric($system, [
                'system.disk_total_bytes',
                'disk_total_bytes',
                'system.disk_space.total_bytes',
                'disk_space.total_bytes',
            ]);
            $diskUsedBytes = $this->firstNumeric($system, [
                'system.disk_used_bytes',
                'disk_used_bytes',
                'system.disk_space.used_bytes',
                'disk_space.used_bytes',
            ]);

            $memoryTotalMb = $this->bytesToMb($memoryTotalBytes) ?? (int) $node->memory;
            $memoryUsedMb = $this->bytesToMb($memoryUsedBytes);
            $memoryUsedPercent = $memoryTotalMb > 0 && !is_null($memoryUsedMb)
                ? round(($memoryUsedMb / $memoryTotalMb) * 100, 2)
                : null;

            $diskTotalMb = $this->bytesToMb($diskTotalBytes) ?? (int) $node->disk;
            $diskUsedMb = $this->bytesToMb($diskUsedBytes);
            $diskUsedPercent = $diskTotalMb > 0 && !is_null($diskUsedMb)
                ? round(($diskUsedMb / $diskTotalMb) * 100, 2)
                : null;

            $displayName = Arr::get($system, 'hostname')
                ?? Arr::get($system, 'system.hostname')
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
                    'current_percent' => $cpuLoadPercent,
                    'load_average_1m' => $cpuLoadAverage,
                ],
                'memory' => [
                    'total_mb' => $memoryTotalMb,
                    'allocated_mb' => $allocatedMemory,
                    'allocated_percent' => $node->memory > 0 ? round(($allocatedMemory / $node->memory) * 100, 2) : null,
                    'used_mb' => $memoryUsedMb,
                    'used_percent' => $memoryUsedPercent,
                ],
                'disk' => [
                    'total_mb' => $diskTotalMb,
                    'allocated_mb' => $allocatedDisk,
                    'allocated_percent' => $node->disk > 0 ? round(($allocatedDisk / $node->disk) * 100, 2) : null,
                    'used_mb' => $diskUsedMb,
                    'used_percent' => $diskUsedPercent,
                ],
            ];
        }

        return new JsonResponse(['data' => $data]);
    }

    private function firstNumeric(array $payload, array $paths, ?float $default = null): ?float
    {
        foreach ($paths as $path) {
            $value = Arr::get($payload, $path);
            if (is_numeric($value)) {
                return (float) $value;
            }
        }

        return $default;
    }

    private function bytesToMb(?float $bytes): ?int
    {
        if (is_null($bytes)) {
            return null;
        }

        return (int) round($bytes / 1024 / 1024);
    }
}
