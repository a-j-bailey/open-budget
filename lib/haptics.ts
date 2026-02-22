import * as Haptics from 'expo-haptics'
import { ImpactFeedbackStyle } from 'expo-haptics'

/** Light tap for nav, tabs, pickers, and selection changes. */
export function hapticSelection(): void {
  Haptics.selectionAsync().catch(() => {})
}

/** Medium impact for primary button presses (submit, add, confirm). */
export function hapticImpact(): void {
  Haptics.impactAsync(ImpactFeedbackStyle.Medium).catch(() => {})
}

/** Light impact for secondary or cancel actions. */
export function hapticImpactLight(): void {
  Haptics.impactAsync(ImpactFeedbackStyle.Light).catch(() => {})
}

/** Heavy impact for destructive or important actions. */
export function hapticImpactHeavy(): void {
  Haptics.impactAsync(ImpactFeedbackStyle.Heavy).catch(() => {})
}
