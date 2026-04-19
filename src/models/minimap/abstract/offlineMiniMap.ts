import type { MiniMapType } from './miniMapType';

export interface OfflineMiniMap {
    readonly fetchType: 'offline';
    readonly miniMapType: MiniMapType;
}
