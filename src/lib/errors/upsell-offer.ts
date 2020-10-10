import { Incident } from 'incident'

export namespace UpsellOfferError {
  export type Name = 'UpsellOffer'
  export const name: Name = 'UpsellOffer'

  export interface Data {}

  export type Cause = undefined
}

export type UpsellOfferError = Incident<UpsellOfferError.Data, UpsellOfferError.Name, UpsellOfferError.Cause>

export namespace UpsellOfferError {
  export type Type = UpsellOfferError

  export function format() {
    return 'UpsellOffer'
  }

  export function create(username?: string): UpsellOfferError {
    return Incident(name, { username }, format)
  }
}
