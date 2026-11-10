import { COLORS } from './engine.js';
import { comparePatchWithItems, describePhotoPatch } from './appearance.js';

/** Descriptive light/dark contrast only; this is not a measure of attractiveness. */
export function comparePhotoSwatch(rgb, items) {
  return comparePatchWithItems(rgb, items, COLORS);
}

export { describePhotoPatch };
