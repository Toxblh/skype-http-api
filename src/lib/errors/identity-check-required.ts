import { Incident } from 'incident'

export namespace IdentityCheckRequired {
  export type Name = 'IdentityCheckRequired'
  export const name: Name = 'IdentityCheckRequired'

  export interface Data {}

  export type Cause = undefined
}

/* tslint:disable-next-line:max-line-length */
export type IdentityCheckRequired = Incident<
  IdentityCheckRequired.Data,
  IdentityCheckRequired.Name,
  IdentityCheckRequired.Cause
>

export namespace IdentityCheckRequired {
  export type Type = IdentityCheckRequired

  export function format() {
    return (
      'The log in request was made from a new location, ' +
      'you need to confirm your identity in order to continue. Check your email for more info'
    )
  }

  export function create(username?: string): IdentityCheckRequired {
    return Incident(name, { username }, format)
  }
}
