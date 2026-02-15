import useSWR, { ConfigInterface, responseInterface } from 'swr';
import { AxiosError } from 'axios';
import http, { PaginatedResult } from '@/api/http';
import { toPaginatedSet } from '@definitions/helpers';
import useFilteredObject from '@/plugins/useFilteredObject';
import { useUserSWRKey } from '@/plugins/useSWRKey';
import { AccountNotification, Transformers } from '@definitions/user';

export interface AccountNotificationsResponse extends PaginatedResult<AccountNotification> {
    unreadCount: number;
}

export type AccountNotificationsFilters = {
    page?: number;
    per_page?: number;
};

export interface AccountNotificationsUnreadCountResponse {
    unreadCount: number;
}

const useAccountNotifications = (
    filters?: AccountNotificationsFilters,
    config?: ConfigInterface<AccountNotificationsResponse, AxiosError>
): responseInterface<AccountNotificationsResponse, AxiosError> => {
    const key = useUserSWRKey(['account', 'notifications', JSON.stringify(useFilteredObject(filters || {}))]);

    return useSWR<AccountNotificationsResponse>(
        key,
        async () => {
            const { data } = await http.get('/api/client/account/notifications', { params: filters });
            const paginated = toPaginatedSet(data, Transformers.toAccountNotification);
            const unreadCount = data?.meta?.unread_count ?? 0;

            return {
                ...paginated,
                unreadCount,
            };
        },
        { revalidateOnMount: true, revalidateOnFocus: false, ...(config || {}) }
    );
};

const useAccountNotificationsUnreadCount = (
    config?: ConfigInterface<AccountNotificationsUnreadCountResponse, AxiosError>
): responseInterface<AccountNotificationsUnreadCountResponse, AxiosError> => {
    const key = useUserSWRKey(['account', 'notifications', 'unread-count']);

    return useSWR<AccountNotificationsUnreadCountResponse>(
        key,
        async () => {
            const { data } = await http.get('/api/client/account/notifications/unread-count');
            return {
                unreadCount: data?.data?.unread_count ?? 0,
            };
        },
        {
            revalidateOnMount: true,
            revalidateOnFocus: true,
            refreshInterval: 30_000,
            ...(config || {}),
        }
    );
};

const markAccountNotificationRead = async (id: string): Promise<void> => {
    await http.post(`/api/client/account/notifications/${id}/read`);
};

const markAllAccountNotificationsRead = async (): Promise<void> => {
    await http.post('/api/client/account/notifications/read-all');
};

const deleteAccountNotification = async (id: string): Promise<void> => {
    await http.delete(`/api/client/account/notifications/${id}`);
};

export {
    useAccountNotifications,
    useAccountNotificationsUnreadCount,
    markAccountNotificationRead,
    markAllAccountNotificationsRead,
    deleteAccountNotification,
};
