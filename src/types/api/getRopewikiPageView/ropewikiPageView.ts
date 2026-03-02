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
    regions: { name: string, id: string }[];
    difficulty: Difficulty;
    permit: PermitStatus | null;
    rappelCount: { min: number; max: number } | number | null;
    jumps: number | null;
    vehicle: string | null;
    rappelLongest: number | null;
    shuttleTime: number | null;
    minOverallTime: number | null;
    maxOverallTime: number | null;
    hikeLength: number | null;
    overallLength: number | null;
    minApproachTime: number | null;
    maxApproachTime: number | null;
    minDescentTime: number | null;
    maxDescentTime: number | null;
    minExitTime: number | null;
    maxExitTime: number | null;
    approachElevGain: number | null;
    exitElevGain: number | null;
    months: string[];
    latestRevisionDate: Date;
    bannerImage: RopewikiImageView | null;
    betaSections: RopewikiBetaSectionView[];
}
