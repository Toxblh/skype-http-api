import { AgentInfo } from './agent-info'

/**
 * Example (concierge bot):
 * ```
 * {
 *   "capabilities": [],
 *   "trust": "not-trusted",
 *   "type": "participant",
 *   "info": {
 *     "capabilities": [],
 *     "trusted": true,
 *     "type": "Participant"
 *   },
 *   "stage_info": {}
 * }
 * ```
 *
 * Example (concierge bot, from a new user):
 * ```
 * {
 *   "trust": "not-trusted",
 *   "type": "participant",
 *   "info": {
 *     "trusted": "True",
 *     "type": "Participant"
 *   }
 * }
 * ```
 */
export interface Agent {
  capabilities?: any[]
  /**
   * `"participant" | ...`
   */
  type: string
  /**
   * `"not-trusted" | ...`
   */
  trust: string

  info: AgentInfo

  stageInfo?: any
}
