import toughCookie from "tough-cookie";

/**
 * Represents the OAuth token used for most calls to the Skype API.
 */
export interface SkypeToken {
  value: string;
  expirationDate: Date;
}

export namespace SkypeToken {
  /**
   * JSON-safe representation of `SkypeToken`, used for serialization.
   */
  export interface Json {
    value: string;
    expirationDate: string;
  }

  /**
   * Export a SkypeToken to a JSON-safe object.
   */
  export function toJson(token: SkypeToken): Json {
    return {
      value: token.value,
      expirationDate: token.expirationDate.toISOString(),
    };
  }

  /**
   * Import a SkypeToken from a JSON-safe object.
   */
  export function fromJson(token: Json): SkypeToken {
    return {
      value: token.value,
      expirationDate: new Date(token.expirationDate),
    };
  }
}

/**
 * Represents the OAuth registration token.
 * Here are some of the actions requiring a registration token:
 * - set status
 * - send message
 * - get conversations list
 */
export interface RegistrationToken {
  value: string;
  expirationDate: Date;
  endpointId: string;
  host: string;
  raw: string;
}

/**
 * Contains information that can be used to poll notifications and
 * maintain the session active longPollUrl & isActiveUrl
 */
/*
{
  "id": "endpoint id, same as RegistrationToken.endpointId, but without the curly braces",
  "endpointFeatures": "the registered feature, from registerEndpoint()",
  "subscriptions": [
    {
      "channelType": "HttpLongPoll",
      "interestedResources": [
        "/v1/users/ME/conversations/ALL/properties",
        "/v1/users/ME/conversations/ALL/messages",
        "/v1/threads/ALL"
      ],
      "longPollUrl": "poll notifications endpoint"
    }
  ],
  "isActiveUrl": "active session endpoint",
  "longPollActiveTimeoutSupport": false
}
 */
export interface RegistrationInfo {
  id: string;
  endpointFeatures: string;
  subscriptions: Subscriptions[];
  isActiveUrl: string;
  longPollActiveTimeoutSupport: string;
}

export interface Subscriptions {
  channelType: string;
  interestedResources: any;
  longPollUrl: string;
}

export namespace RegistrationToken {
  /**
   * JSON-safe representation of `RegistrationToken`, used for serialization.
   */
  export interface Json {
    value: string;
    expirationDate: string;
    endpointId: string;
    host: string;
    raw: string;
  }

  /**
   * Export a RegistrationToken to a JSON-safe object.
   */
  export function toJson(token: RegistrationToken): Json {
    return {
      value: token.value,
      expirationDate: token.expirationDate.toISOString(),
      endpointId: token.endpointId,
      host: token.host,
      raw: token.raw,
    };
  }

  /**
   * Import a RegistrationToken from a JSON-safe object.
   */
  export function fromJson(token: Json): RegistrationToken {
    return {
      value: token.value,
      expirationDate: new Date(token.expirationDate),
      endpointId: token.endpointId,
      host: token.host,
      raw: token.raw,
    };
  }
}

/**
 * API context (state).
 */
// TODO(demurgos): Rename to `State` or even `ApiState` so it's easier to understand the purpose of this interface.
export interface Context {
  username: string;
  cookies: toughCookie.Store;
  skypeToken: SkypeToken;
  registrationToken: RegistrationToken;
  proxy?: string;
  ackId?: number;
  etag?: string;
}

export namespace Context {
  /**
   * JSON-safe representation of `Context`.
   */
  export interface Json {
    username: string;
    cookies: toughCookie.CookieJar.Serialized;
    skypeToken: SkypeToken.Json;
    registrationToken: RegistrationToken.Json;
    ackId?: number;
    etag?: string;
  }

  export function toJson(context: Context): Json {
    return {
      username: context.username,
      cookies: new toughCookie.CookieJar(context.cookies).serializeSync(),
      skypeToken: SkypeToken.toJson(context.skypeToken),
      registrationToken: RegistrationToken.toJson(context.registrationToken),
      ackId: context.ackId,
      etag: context.etag,
    };
  }

  export function fromJson(context: Json): Context {
    const cookies: toughCookie.MemoryCookieStore = new toughCookie.MemoryCookieStore();
    // TODO: Send a PR to DefinitelyTyped to fix this
    type DeserializeSync = (cookies: toughCookie.CookieJar.Serialized, store: toughCookie.Store) => void;
    (toughCookie.CookieJar.deserializeSync as DeserializeSync)(context.cookies, cookies);

    return {
      username: context.username,
      cookies,
      skypeToken: SkypeToken.fromJson(context.skypeToken),
      registrationToken: RegistrationToken.fromJson(context.registrationToken),
      ackId: context.ackId,
      etag: context.etag,
    };
  }
}
