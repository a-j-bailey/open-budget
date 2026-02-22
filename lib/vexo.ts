import { identifyDevice } from 'vexo-analytics'

/**
 * Identify the current user/device for Vexo analytics.
 * Call this when the user signs in or when you have their identity (e.g. email).
 * No-op in __DEV__ so we don't track dev users.
 */
export function identifyUser(identifier: string): void {
  if (__DEV__) return
  identifyDevice(identifier)
}
