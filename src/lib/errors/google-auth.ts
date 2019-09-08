import { Incident } from "incident";

export namespace GoogleAuthRequired {
  export type Name = "GoogleAuthRequired";
  export const name: Name = "GoogleAuthRequired";

  export interface Data {
  }

  export type Cause = undefined;
}

export type GoogleAuthRequired = Incident<GoogleAuthRequired.Data,
  GoogleAuthRequired.Name, GoogleAuthRequired.Cause>;

export namespace GoogleAuthRequired {
  export type Type = GoogleAuthRequired;

  export function format() {
    return "GoogleAuthRequired";
  }

  export function create(username?: string): GoogleAuthRequired {
    return Incident(name, {username}, format);
  }
}
