/** Canvas pixels per CSS pixel (milestone 21: sharp on retina). ponytail: capped at 3; lower it if big phones drop frames. */
export const DPR = Math.min(window.devicePixelRatio || 1, 3);
