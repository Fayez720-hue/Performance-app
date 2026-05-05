"use client"

/**
 * Disabled to prevent redirect loops in Capacitor/Mobile environments.
 * The app handles session restoration internally via cookies/JWT.
 */
export function ReturnToAppHandler() {
  return null
}
