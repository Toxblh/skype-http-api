import { Incident } from "incident";

export namespace AccountRecoverRestriction {
  export type Name = "AccountRecoverRestriction";
  export const name: Name = "AccountRecoverRestriction";

  export interface Data {
  }

  export type Cause = undefined;
}

/* tslint:disable-next-line:max-line-length */
export type AccountRecoverRestriction = Incident<AccountRecoverRestriction.Data,
  AccountRecoverRestriction.Name, AccountRecoverRestriction.Cause>;

export namespace AccountRecoverRestriction {
  export type Type = AccountRecoverRestriction;

  export function format() {
    return "It looks like someone else might be using your account. You need to verify that it's yours.";
  }

  export function create(username?: string): AccountRecoverRestriction {
    return Incident(name, {username}, format);
  }
}
