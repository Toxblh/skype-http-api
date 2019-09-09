import { Incident } from "incident";

export namespace AccountNotFound {
  export type Name = "AccountNotFound";
  export const name: Name = "AccountNotFound";

  export interface Data {
  }

  export type Cause = undefined;
}

export type AccountNotFound = Incident<AccountNotFound.Data,
  AccountNotFound.Name, AccountNotFound.Cause>;

export namespace AccountNotFound {
  export type Type = AccountNotFound;

  export function format() {
    return "AccountNotFound";
  }

  export function create(username?: string): AccountNotFound {
    return Incident(name, {username}, format);
  }
}
