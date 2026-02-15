import { Model, UUID } from '@/api/definitions';
import { SubuserPermission } from '@/state/server/subusers';

interface User extends Model {
    uuid: string;
    username: string;
    email: string;
    image: string;
    twoFactorEnabled: boolean;
    createdAt: Date;
    permissions: SubuserPermission[];
    can(permission: SubuserPermission): boolean;
}

interface ActivityLog extends Model<'actor'> {
    id: string;
    batch: UUID | null;
    event: string;
    ip: string | null;
    isApi: boolean;
    description: string | null;
    properties: Record<string, string | unknown>;
    hasAdditionalMetadata: boolean;
    timestamp: Date;
    relationships: {
        actor: User | null;
    };
}

interface AccountNotification extends Model {
    id: string;
    type: string;
    kind: string | null;
    title: string | null;
    message: string | null;
    actionUrl: string | null;
    data: Record<string, unknown>;
    readAt: Date | null;
    createdAt: Date | null;
}
