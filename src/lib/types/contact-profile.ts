import { IsoDate } from './iso-date'
import { Location } from './location'
import { Name } from './name'
import { Phone } from './phone'
import { Url } from './url'

/**
 * Represents a profile returned by the contact API v2 (contacts.skype.com/contacts/v2).
 * It is possible for a profile to only contain the name (`28:concierge` for a newly create user)
 */
export interface ContactProfile {
  /**
   * Examples:
   * - `https://avatar.skype.com/v1/avatars/:userId?auth_key=1601633273` (the authKey can be negative)
   * - `https://avatar.skype.com/v1/avatars/:userId/public`
   * - `https://az705183.vo.msecnd.net/dam/skype/media/concierge-assets/avatar/avatarcnsrg-144.png`
   */
  avatarUrl?: Url
  birthday?: IsoDate
  /**
   * `"male" | "female"`
   */
  gender?: string
  locations?: Location[]
  phones?: Phone[]
  /**
   * Can contain tags.
   * Examples:
   * - `"<ss type=\"music\">(music)</ss> Rick Astley - Never Gonna Give You Up"`
   * - `"Foo &amp; bar"`
   */
  mood?: string
  name?: Name
  about?: string

  /**
   * Probably always an URL
   * Example: `"https://go.skype.com/faq.skype.bot"`
   */
  website?: string

  /**
   * `"en" | "fr"`
   */
  language?: string
  skype_handle?: string
}
