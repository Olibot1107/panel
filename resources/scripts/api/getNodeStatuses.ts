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
    };
    memory: {
        totalMb: number;
        allocatedMb: number;
        allocatedPercent: number | null;
    };
    disk: {
        totalMb: number;
        allocatedMb: number;
        allocatedPercent: number | null;
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
        },
        memory: {
            totalMb: node.memory?.total_mb || 0,
            allocatedMb: node.memory?.allocated_mb || 0,
            allocatedPercent: node.memory?.allocated_percent ?? null,
        },
        disk: {
            totalMb: node.disk?.total_mb || 0,
            allocatedMb: node.disk?.allocated_mb || 0,
            allocatedPercent: node.disk?.allocated_percent ?? null,
        },
    }));
};
