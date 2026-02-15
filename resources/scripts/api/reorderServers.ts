import http from '@/api/http';

export default async (serverIds: number[]): Promise<void> => {
    await http.post('/api/client/servers/reorder', {
        server_ids: serverIds,
    });
};
