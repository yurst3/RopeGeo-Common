import type { OfflinePagePreview } from '../previews/offlinePagePreview';
import type { OnlinePagePreview } from '../previews/onlinePagePreview';
import { PagePreview } from '../previews/pagePreview';
import { createUuidV4 } from './createUuidV4';
import { UserAvatar, type UserAvatarFields, type UserAvatarJson } from './userAvatar';
import './block/registerTripReportBlockParsers';
import { TripReportBlock, type TripReportBlockJson } from './block/tripReportBlock';
import { TripReportBlockType } from './block/tripReportBlockType';
import { TripReportDates, type TripReportDatesJson } from './tripReportDates';

/** Saved pages may be offline previews, so a linked page can be either kind. */
export type TripReportPage = OnlinePagePreview | OfflinePagePreview;

export const DEFAULT_TRIP_REPORT_TITLE = 'My Trip Report';
export const MAX_TRIP_REPORT_MAP_BLOCKS = 3;

/** Bump when the stored JSON shape changes in a way {@link TripReport.fromJSON} must handle. */
export const TRIP_REPORT_SCHEMA_VERSION = 1;

/** Problems that keep a report from being saved until they're fixed. */
export type TripReportValidationError = 'emptyTitle';

export type TripReportJson = {
    schemaVersion: number;
    id: string;
    /** ISO 8601 timestamp. */
    createdAt: string;
    title: string;
    dates: TripReportDatesJson;
    /** Plain page preview objects, rebuilt with `PagePreview.fromResult`. */
    relevantPages: unknown[];
    blocks: TripReportBlockJson[];
    userAvatar: UserAvatarJson[];
    bannerImage?: string;
};

type TripReportFields = {
    title: string;
    dates: TripReportDates;
    relevantPages: TripReportPage[];
    blocks: TripReportBlock[];
    userAvatar: UserAvatar[];
    bannerImage?: string;
};

/** Parses each entry, dropping any that are malformed instead of failing the whole report. */
function parseEach<T>(values: unknown, parse: (value: never) => T): T[] {
    if (!Array.isArray(values)) return [];
    const out: T[] = [];
    for (const value of values) {
        try {
            out.push(parse(value as never));
        } catch (error) {
            console.warn('[TripReport] skipped invalid entry', error);
        }
    }
    return out;
}

/**
 * A trip report being written. Every `with…` method returns a new report, so it can be held
 * directly in React state.
 */
export class TripReport {
    readonly id: string;
    readonly createdAt: Date;
    readonly title: string;
    readonly dates: TripReportDates;
    /** Pages linked to the report, in display order. */
    readonly relevantPages: TripReportPage[];
    /** Content blocks, in display order. */
    readonly blocks: TripReportBlock[];
    /** Users on the trip. The first is the report's author. */
    readonly userAvatar: UserAvatar[];
    /** URL or local file path of the banner image; undefined when none has been chosen. */
    readonly bannerImage?: string;

    constructor(
        id: string,
        createdAt: Date,
        title: string,
        dates: TripReportDates,
        relevantPages: TripReportPage[],
        blocks: TripReportBlock[],
        userAvatar: UserAvatar[],
        bannerImage?: string,
    ) {
        this.id = id;
        this.createdAt = createdAt;
        this.title = title;
        this.dates = dates;
        this.relevantPages = relevantPages;
        this.blocks = blocks;
        this.userAvatar = userAvatar;
        this.bannerImage = bannerImage;
    }

    /** A new report authored by the signed-in user, whose profile details come from `author`. */
    static createDraft(author: UserAvatarFields, now: Date = new Date()): TripReport {
        return new TripReport(
            createUuidV4(),
            now,
            DEFAULT_TRIP_REPORT_TITLE,
            TripReportDates.singleDay(now),
            [],
            [],
            [UserAvatar.create(author)],
        );
    }

    private copy(changes: Partial<TripReportFields>): TripReport {
        const next: TripReportFields = {
            title: this.title,
            dates: this.dates,
            relevantPages: this.relevantPages,
            blocks: this.blocks,
            userAvatar: this.userAvatar,
            bannerImage: this.bannerImage,
            ...changes,
        };
        return new TripReport(
            this.id,
            this.createdAt,
            next.title,
            next.dates,
            next.relevantPages,
            next.blocks,
            next.userAvatar,
            next.bannerImage,
        );
    }

    /** Kept exactly as typed (even blank) so the editor can show it; see {@link validationErrors}. */
    withTitle(title: string): TripReport {
        return this.copy({ title });
    }

    get validationErrors(): TripReportValidationError[] {
        const errors: TripReportValidationError[] = [];
        if (this.title.trim().length === 0) errors.push('emptyTitle');
        return errors;
    }

    get isValid(): boolean {
        return this.validationErrors.length === 0;
    }

    withDates(dates: TripReportDates): TripReport {
        return this.copy({ dates });
    }

    /** Pass undefined to clear the banner image. */
    withBannerImage(bannerImage: string | undefined): TripReport {
        return this.copy({ bannerImage });
    }

    withRelevantPages(relevantPages: TripReportPage[]): TripReport {
        return this.copy({ relevantPages });
    }

    withoutRelevantPage(pageId: string): TripReport {
        return this.withRelevantPages(this.relevantPages.filter((page) => page.id !== pageId));
    }

    get mapBlockCount(): number {
        return this.blocks.filter((block) => block.blockType === TripReportBlockType.Map).length;
    }

    get canAddMapBlock(): boolean {
        return this.mapBlockCount < MAX_TRIP_REPORT_MAP_BLOCKS;
    }

    /** Map blocks past {@link MAX_TRIP_REPORT_MAP_BLOCKS} are ignored. */
    withBlockAdded(block: TripReportBlock): TripReport {
        if (block.blockType === TripReportBlockType.Map && !this.canAddMapBlock) {
            return this;
        }
        return this.copy({ blocks: [...this.blocks, block] });
    }

    withBlockUpdated(
        blockId: string,
        update: (block: TripReportBlock) => TripReportBlock,
    ): TripReport {
        return this.copy({
            blocks: this.blocks.map((block) => (block.id === blockId ? update(block) : block)),
        });
    }

    withBlockRemoved(blockId: string): TripReport {
        return this.copy({ blocks: this.blocks.filter((block) => block.id !== blockId) });
    }

    toJSON(): TripReportJson {
        const json: TripReportJson = {
            schemaVersion: TRIP_REPORT_SCHEMA_VERSION,
            id: this.id,
            createdAt: this.createdAt.toISOString(),
            title: this.title.trim(),
            dates: this.dates.toJSON(),
            relevantPages: this.relevantPages.map((page) => JSON.parse(JSON.stringify(page))),
            blocks: this.blocks.map((block) => block.toJSON()),
            userAvatar: this.userAvatar.map((avatar) => avatar.toJSON()),
        };
        if (this.bannerImage != null) json.bannerImage = this.bannerImage;
        return json;
    }

    /**
     * Rebuilds a stored report. Malformed pages, blocks, or avatars are dropped so one bad entry
     * doesn't lose the rest of the draft; a missing id or dates throws.
     */
    static fromJSON(json: TripReportJson): TripReport {
        if (typeof json.id !== 'string' || json.id.length === 0) {
            throw new Error('TripReport JSON is missing an id');
        }
        const createdAt = new Date(json.createdAt);
        return new TripReport(
            json.id,
            Number.isNaN(createdAt.getTime()) ? new Date() : createdAt,
            typeof json.title === 'string' ? json.title : DEFAULT_TRIP_REPORT_TITLE,
            TripReportDates.fromJSON(json.dates),
            parseEach(json.relevantPages, (page) => PagePreview.fromResult(page) as TripReportPage),
            parseEach(json.blocks, (block) => TripReportBlock.fromResult(block)),
            parseEach(json.userAvatar, UserAvatar.fromJSON),
            typeof json.bannerImage === 'string' ? json.bannerImage : undefined,
        );
    }
}
