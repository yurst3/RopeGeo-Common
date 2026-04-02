/**
 * Side-effect import so ACA (and future) difficulty parsers register with
 * {@link Difficulty.fromResult}. Imported first from the package types barrel so registration
 * is guaranteed even when bundlers tree-shake unused re-exports.
 */
import './acaDifficulty';
