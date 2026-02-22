import { identifyDevice } from 'vexo-analytics'

/**
 * Identify the current user/device for Vexo analytics.
 * Call this when the user signs in or when you have their identity (e.g. email).
 */
export function identifyUser(identifier: string): void {
  identifyDevice(identifier)
}
