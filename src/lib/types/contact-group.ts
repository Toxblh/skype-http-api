/**
 * Example:
 * ```
 * {
 *   "id": "000C3765-A8A0-464C-8083-C8383B86A772",
 *   "name": "Favorites",
 *   "is_favorite": true
 * }
 * ```
 */
export interface ContactGroup {
  id: string
  name: string
  isFavorite?: boolean
  contacts?: any[]
}
