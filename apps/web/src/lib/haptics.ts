/**
 * Native Android Haptic Feedback Helper
 * Uses navigator.vibrate API to provide tactile feedback on Android phones and Cap/PWA containers.
 */

export function triggerHaptic(durationMs: number = 25): void {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(durationMs);
    } catch {
      // Ignored if device doesn't support or permissions blocked
    }
  }
}

export function hapticSuccess(): void {
  triggerHaptic(35);
}

export function hapticDoubleTap(): void {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([20, 40, 20]);
    } catch {}
  }
}

export function hapticWarning(): void {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([40, 60, 40]);
    } catch {}
  }
}
