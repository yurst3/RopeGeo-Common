import { registerResultParser, Result, ResultType } from './result';
import { LinkPreview } from '../../linkPreview/linkPreview';

/**
 * Result of getRopewikiPageLinkPreview (GET /ropewiki/page/{id}/link-preview).
 */
export class RopewikiPageLinkPreviewResult extends Result<LinkPreview> {
    constructor(public readonly result: LinkPreview) {
        super(result, ResultType.RopewikiPageLinkPreview);
    }

    /**
     * Validates and parses result via LinkPreview.fromResult.
     */
    static fromResult(result: unknown): RopewikiPageLinkPreviewResult {
        const parsed = LinkPreview.fromResult(result);
        return new RopewikiPageLinkPreviewResult(parsed);
    }
}

registerResultParser(ResultType.RopewikiPageLinkPreview, (v) =>
    RopewikiPageLinkPreviewResult.fromResult(v),
);
