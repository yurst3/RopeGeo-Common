/**
 * Side-effect import so ACA (and future) filter-options parsers register with
 * {@link DifficultyFilterOptions.fromResult}. Imported from the package types barrel so
 * registration is guaranteed even when bundlers tree-shake unused re-exports.
 */
import './acaDifficultyFilterOptions';
