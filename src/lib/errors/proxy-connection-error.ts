import { Incident } from "incident";

export namespace ProxyConnectionError {
  export type Name = "ProxyConnectionError";
  export const name: Name = "ProxyConnectionError";

  export interface Data {
  }

  export type Cause = undefined;
}

/* tslint:disable-next-line:max-line-length */
export type ProxyConnectionError = Incident<ProxyConnectionError.Data,
  ProxyConnectionError.Name, ProxyConnectionError.Cause>;

export namespace ProxyConnectionError {
  export type Type = ProxyConnectionError;

  export function format() {
    return "Error encountered when connecting via proxy";
  }

  export function create(username?: string): ProxyConnectionError {
    return Incident(name, {username}, format);
  }
}
