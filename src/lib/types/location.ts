export interface Location {
  /**
   * `"home" | "work" | ...`
   */
  type: string
  /**
   * `"BE" | "FR" | "fr" | "gb" |...`
   */
  country?: string
  city?: string
  state?: string
}
