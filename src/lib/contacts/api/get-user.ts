import { Contact } from '../../types/contact'
import { ContactGroup } from '../../types/contact-group'

/**
 * @internal
 */
export interface GetUserResult {
  contacts: Contact[]
  // TODO(demurgos): Rename to `blockList`?
  // {mri: MriKey}[]
  blocklist: any[]
  groups: ContactGroup[]
  /**
   * `"full" | ...`
   */
  scope?: string
}
