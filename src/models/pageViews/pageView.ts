import { PageViewType } from './pageViewType';
import type { OfflinePageView } from './offlinePageView';
import type { OnlinePageView } from './onlinePageView';

const onlinePageViewParsers = new Map<PageViewType, (result: unknown) => OnlinePageView>();
const offlinePageViewParsers = new Map<
    PageViewType,
    (result: unknown, pageRoot?: string | null) => OfflinePageView
>();

export function registerOnlinePageViewParser(
    pageViewType: PageViewType,
    parse: (result: unknown) => OnlinePageView,
): void {
    onlinePageViewParsers.set(pageViewType, parse);
}

export function registerOfflinePageViewParser(
    pageViewType: PageViewType,
    parse: (result: unknown, pageRoot?: string | null) => OfflinePageView,
): void {
    offlinePageViewParsers.set(pageViewType, parse);
}

/** Base page view type with wire parsers dispatching on {@link PageViewType}. */
export abstract class PageView {
    /** Parses online page JSON into a concrete {@link OnlinePageView}. */
    static fromResult(result: unknown): OnlinePageView {
        if (result == null || typeof result !== 'object') {
            throw new Error('PageView result must be an object');
        }
        const r = result as Record<string, unknown>;
        if (r.fetchType !== 'online') {
            throw new Error(
                `PageView.fromResult requires fetchType "online", got: ${JSON.stringify(r.fetchType)}`,
            );
        }
        const pageViewType = r.pageViewType;
        if (typeof pageViewType !== 'string') {
            throw new Error('PageView.pageViewType must be a string');
        }
        const parser = onlinePageViewParsers.get(pageViewType as PageViewType);
        if (parser == null) {
            throw new Error(
                `No online PageView parser registered for pageViewType ${JSON.stringify(pageViewType)}`,
            );
        }
        return parser(result);
    }

    /** Parses offline page JSON into a concrete {@link OfflinePageView}. */
    static fromOfflineResult(result: unknown, pageRoot?: string | null): OfflinePageView {
        if (result == null || typeof result !== 'object') {
            throw new Error('PageView offline result must be an object');
        }
        const r = result as Record<string, unknown>;
        if (r.fetchType !== 'offline') {
            throw new Error(
                `PageView.fromOfflineResult requires fetchType "offline", got: ${JSON.stringify(r.fetchType)}`,
            );
        }
        const pageViewType = r.pageViewType;
        if (typeof pageViewType !== 'string') {
            throw new Error('PageView.pageViewType must be a string');
        }
        const parser = offlinePageViewParsers.get(pageViewType as PageViewType);
        if (parser == null) {
            throw new Error(
                `No offline PageView parser registered for pageViewType ${JSON.stringify(pageViewType)}`,
            );
        }
        return parser(result, pageRoot);
    }
}
