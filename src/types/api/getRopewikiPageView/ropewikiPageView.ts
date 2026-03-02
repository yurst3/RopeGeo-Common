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
    overallLength: number | null;
    descentLength: number | null;
    exitLength: number | null;
    approachLength: number | null;
    overallTime: { min: number; max: number } | number | null;
    approachTime: { min: number; max: number } | number | null;
    descentTime: { min: number; max: number } | number | null;
    exitTime: { min: number; max: number } | number | null;
    approachElevGain: number | null;
    descentElevGain: number | null;
    exitElevGain: number | null;
    months: string[];
    latestRevisionDate: Date;
    bannerImage: RopewikiImageView | null;
    betaSections: RopewikiBetaSectionView[];
}
