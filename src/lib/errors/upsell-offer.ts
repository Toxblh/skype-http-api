import { Incident } from "incident";
export namespace UpsellOfferError {
  export type Name = "UpsellOffer";
  export const name: Name = "UpsellOffer";

  export interface Data {
    html: string;
  }

  export type Cause = undefined;
}

export type UpsellOfferError = Incident<UpsellOfferError.Data,
  UpsellOfferError.Name,
  UpsellOfferError.Cause>;

export namespace UpsellOfferError {
  export type Type = UpsellOfferError;

  export function format({html}: Data) {
    return "Upsell offer detected!!!"
      + " Unable to find the Live token in the HTML response as the value of the element with the id \"t\"."
      + ` HTML page: ${JSON.stringify(html)}`;
  }

  export function create(html: string): UpsellOfferError {
    return new Incident(name, {html}, format);
  }
}
