import http from '@/api/http';

export interface NodeStatus {
    id: number;
    uuid: string;
    displayName: string;
    name: string;
    fqdn: string;
    online: boolean;
    maintenanceMode: boolean;
    cpu: {
        cores: number;
        allocatedLimit: number;
        allocatedPercent: number | null;
        currentPercent: number | null;
        loadAverage1m: number | null;
    };
    memory: {
        totalMb: number;
        allocatedMb: number;
        allocatedPercent: number | null;
        usedMb: number | null;
        usedPercent: number | null;
    };
    disk: {
        totalMb: number;
        allocatedMb: number;
        allocatedPercent: number | null;
        usedMb: number | null;
        usedPercent: number | null;
    };
}

export default async (): Promise<NodeStatus[]> => {
    const { data } = await http.get('/api/client/nodes/status');

    return (data?.data || []).map((node: any) => ({
        id: node.id,
        uuid: node.uuid,
        displayName: node.display_name || node.name || node.fqdn,
        name: node.name,
        fqdn: node.fqdn,
        online: node.online,
        maintenanceMode: node.maintenance_mode,
        cpu: {
            cores: node.cpu?.cores || 0,
            allocatedLimit: node.cpu?.allocated_limit || 0,
            allocatedPercent: node.cpu?.allocated_percent ?? null,
            currentPercent: node.cpu?.current_percent ?? null,
            loadAverage1m: node.cpu?.load_average_1m ?? null,
        },
        memory: {
            totalMb: node.memory?.total_mb || 0,
            allocatedMb: node.memory?.allocated_mb || 0,
            allocatedPercent: node.memory?.allocated_percent ?? null,
            usedMb: node.memory?.used_mb ?? null,
            usedPercent: node.memory?.used_percent ?? null,
        },
        disk: {
            totalMb: node.disk?.total_mb || 0,
            allocatedMb: node.disk?.allocated_mb || 0,
            allocatedPercent: node.disk?.allocated_percent ?? null,
            usedMb: node.disk?.used_mb ?? null,
            usedPercent: node.disk?.used_percent ?? null,
        },
    }));
};
