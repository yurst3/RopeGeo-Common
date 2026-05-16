/**
 * Side-effect import so ACA (and future) difficulty rating parsers register with
 * {@link DifficultyRating.fromResult}. Imported first from the package types barrel so registration
 * is guaranteed even when bundlers tree-shake unused re-exports.
 */
import './acaDifficultyRating';
