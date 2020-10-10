export interface RelationshipHistory {
  /**
   * Example:
   * ```
   * [
   *   {
   *     "type": "add_contact",
   *     "subtype": "t1",
   *     "time": "2017-08-15T14:28:44Z"
   *   }
   * ]
   * ```
   *
   * ```
   * "relationship_history": {
   *   "sources": [
   *     {
   *       "type": "scd",
   *       "time": "2017-12-03T15:27:37.019204Z"
   *     },
   *     {
   *       "type": "scd",
   *       "subtype": "auto_accept",
   *       "time": "2017-12-03T15:27:37.019204Z"
   *     }
   *   ]
   * }
   * ```
   */
  sources: any[]
}
