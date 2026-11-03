let nextBlockId = 0;

/** Locally unique block id, e.g. `map-1730000000000-3`. */
export function createBlockId(blockType: string): string {
    nextBlockId += 1;
    return `${blockType}-${Date.now()}-${nextBlockId}`;
}
