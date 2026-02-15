import * as Models from '@definitions/user/models';
import { FractalResponseData } from '@/api/http';
import { transform } from '@definitions/helpers';

export default class Transformers {
    static toUser = ({ attributes }: FractalResponseData): Models.User => {
        return {
            uuid: attributes.uuid,
            username: attributes.username,
            email: attributes.email,
            image: attributes.image,
            twoFactorEnabled: attributes['2fa_enabled'],
            permissions: attributes.permissions || [],
            createdAt: new Date(attributes.created_at),
            can(permission): boolean {
                return this.permissions.includes(permission);
            },
        };
    };

    static toActivityLog = ({ attributes }: FractalResponseData): Models.ActivityLog => {
        const { actor } = attributes.relationships || {};

        return {
            id: attributes.id,
            batch: attributes.batch,
            event: attributes.event,
            ip: attributes.ip,
            isApi: attributes.is_api,
            description: attributes.description,
            properties: attributes.properties,
            hasAdditionalMetadata: attributes.has_additional_metadata ?? false,
            timestamp: new Date(attributes.timestamp),
            relationships: {
                actor: transform(actor as FractalResponseData, this.toUser, null),
            },
        };
    };

    static toAccountNotification = ({ attributes }: FractalResponseData): Models.AccountNotification => {
        return {
            id: attributes.id,
            type: attributes.type,
            kind: attributes.kind ?? null,
            title: attributes.title ?? null,
            message: attributes.message ?? null,
            actionUrl: attributes.action_url ?? null,
            data: attributes.data || {},
            readAt: attributes.read_at ? new Date(attributes.read_at) : null,
            createdAt: attributes.created_at ? new Date(attributes.created_at) : null,
        };
    };
}

export class MetaTransformers {}
