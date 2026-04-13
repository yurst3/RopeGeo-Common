import { PagePreview } from '../previews/pagePreview';
import { RouteType } from '../routes/routeType';
import { PageViewType } from './pageViewType';

export interface OfflinePageView {
    readonly fetchType: 'offline';
    readonly id: string;
    readonly routeType: RouteType;
    readonly pageViewType: PageViewType;
    toPagePreview(): PagePreview;
}

