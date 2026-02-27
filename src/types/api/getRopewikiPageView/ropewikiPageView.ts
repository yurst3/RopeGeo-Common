import type { Difficulty } from '../../difficulty';
import type { PermitStatus } from '../../permitStatus';
import type { RopewikiBetaSectionView } from './ropewikiBetaSectionView';
import type { RopewikiImageView } from './ropewikiImageView';

/**
 * Response type for GET getRopewikiPageView (full page view).
 */
export interface RopewikiPageView {
    pageId: string;
    name: string;
    aka: string[];
    url: string;
    quality: number;
    userVotes: number;
    difficulty: Difficulty;
    permit: PermitStatus | null;
    rappelCount: { min: number; max: number } | number | null;
    jumps: number | null;
    vehicle: string;
    rappelLongest: number;
    shuttle: number;
    minTime: number;
    maxTime: number;
    hike: number;
    months: string[];
    latestRevisionDate: Date;
    bannerImage: RopewikiImageView | null;
    betaSections: RopewikiBetaSectionView[];
}
