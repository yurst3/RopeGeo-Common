import type { MiniMapType } from './miniMapType';

export interface OnlineMiniMap {
    readonly fetchType: 'online';
    readonly miniMapType: MiniMapType;
}
