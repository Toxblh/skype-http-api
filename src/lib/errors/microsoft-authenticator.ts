import { Incident } from "incident";

export namespace MicrosoftAuthenticator {
  export type Name = "MicrosoftAuthenticator";
  export const name: Name = "MicrosoftAuthenticator";

  export interface Data {
  }

  export type Cause = undefined;
}

export type MicrosoftAuthenticator = Incident<MicrosoftAuthenticator.Data,
  MicrosoftAuthenticator.Name, MicrosoftAuthenticator.Cause>;

export namespace MicrosoftAuthenticator {
  export type Type = MicrosoftAuthenticator;

  export function format() {
    return "MicrosoftAuthenticator";
  }

  export function create(username?: string): MicrosoftAuthenticator {
    return Incident(name, {username}, format);
  }
}
