export function vibrate(ms: number | number[] = 10) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(ms);
    } catch (e) {
      // ignore
    }
  }
}

export const haptics = {
  light: () => vibrate(10),
  medium: () => vibrate(20),
  heavy: () => vibrate(40),
  success: () => vibrate([10, 30, 20]),
};
