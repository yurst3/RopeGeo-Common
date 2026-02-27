import type { RopewikiImageView } from './ropewikiImageView';

/**
 * Beta section view for getRopewikiPageView.
 */
export interface RopewikiBetaSectionView {
    order: number;
    title: string;
    text: string;
    images: RopewikiImageView[];
    latestRevisionDate: Date;
}
