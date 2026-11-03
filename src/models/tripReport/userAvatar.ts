// Temporary model until the backend defines users.

import { createUuidV4 } from './createUuidV4';

export type UserAvatarBadgeRank = 'bronze' | 'silver' | 'gold';

/** Identifies the artwork drawn inside a badge medal. */
export type UserAvatarBadgeIcon = 'tripReport';

const BADGE_RANKS: readonly UserAvatarBadgeRank[] = ['bronze', 'silver', 'gold'];
const BADGE_ICONS: readonly UserAvatarBadgeIcon[] = ['tripReport'];

export type UserAvatarFields = {
    name: string;
    /** URL or local file path; undefined when the user has no profile image. */
    profileImage?: string;
    /** Null when the user has no badge selected. */
    badgeRank: UserAvatarBadgeRank | null;
    /** Null when the user has no badge selected. */
    badgeIcon: UserAvatarBadgeIcon | null;
};

export type UserAvatarJson = UserAvatarFields & { id: string };

/** What's needed to draw a user's profile image with their selected badge. */
export class UserAvatar {
    readonly id: string;
    readonly name: string;
    readonly profileImage?: string;
    readonly badgeRank: UserAvatarBadgeRank | null;
    readonly badgeIcon: UserAvatarBadgeIcon | null;

    constructor(
        id: string,
        name: string,
        profileImage: string | undefined,
        badgeRank: UserAvatarBadgeRank | null,
        badgeIcon: UserAvatarBadgeIcon | null,
    ) {
        this.id = id;
        this.name = name;
        this.profileImage = profileImage;
        this.badgeRank = badgeRank;
        this.badgeIcon = badgeIcon;
    }

    /** Creates an avatar with a new random id. */
    static create(fields: UserAvatarFields): UserAvatar {
        return new UserAvatar(
            createUuidV4(),
            fields.name,
            fields.profileImage,
            fields.badgeRank,
            fields.badgeIcon,
        );
    }

    toJSON(): UserAvatarJson {
        const json: UserAvatarJson = {
            id: this.id,
            name: this.name,
            badgeRank: this.badgeRank,
            badgeIcon: this.badgeIcon,
        };
        if (this.profileImage != null) json.profileImage = this.profileImage;
        return json;
    }

    /** Unknown badge values load as no badge. */
    static fromJSON(json: UserAvatarJson): UserAvatar {
        return new UserAvatar(
            String(json.id),
            String(json.name ?? ''),
            typeof json.profileImage === 'string' ? json.profileImage : undefined,
            BADGE_RANKS.includes(json.badgeRank as UserAvatarBadgeRank) ? json.badgeRank : null,
            BADGE_ICONS.includes(json.badgeIcon as UserAvatarBadgeIcon) ? json.badgeIcon : null,
        );
    }
}
