import { Incident } from "incident";

export namespace ProxyError {
  export type Name = "ProxyError";
  export const name: Name = "ProxyError";

  export interface Data {
    html: string;
  }

  export type Cause = undefined;
}

export type ProxyError = Incident<ProxyError.Data,
  ProxyError.Name, ProxyError.Cause>;

export namespace ProxyError {
  export type Type = ProxyError;

  export function format({html}: Data) {
    return "ProxyError" + ` HTML page: ${JSON.stringify(html)}`;
  }

  export function create(html: string): ProxyError {
    return Incident(name, {html}, format);
  }
}
