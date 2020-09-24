import { Incident } from "incident";
import path from "path";
import url from "url";

export const DEFAULT_USER: string = "ME";
export const DEFAULT_ENDPOINT: string = "SELF";

import { updateRegistrationInfo } from "./helpers/register-endpoint";
import { RegistrationInfo } from "./interfaces/api/context";
import * as httpIo from "./interfaces/http-io";

const CONVERSATION_PATTERN: RegExp = /^\/v1\/users\/([^/]+)\/conversations\/([^/]+)$/;
const CONTACT_PATTERN: RegExp = /^\/v1\/users\/([^/]+)\/contacts\/([^/]+)$/;
const MESSAGES_PATTERN: RegExp = /^\/v1\/users\/([^/]+)\/conversations\/([^/]+)\/messages$/;
const MESSAGE_PATTERN: RegExp = /^\/v1\/users\/([^/]+)\/conversations\/([^/]+)\/messages\/([^/]+)$/;

function joinPath(parts: string[]): string {
  return path.posix.join.apply(null, parts.map(encodeURIComponent));
}

// The following functions build an array of parts to build the path

// /v1
function buildV1(): string[] {
  return ["v1"];
}

// /v1/threads
function buildThreads(): string[] {
  return buildV1().concat("threads");
}

// /v1/threads/{thread}
function buildThread(thread: string): string[] {
  return buildThreads().concat(thread);
}

// /v1/threads/{thread}/properties
function buildProperties(thread: string): string[] {
  return buildThread(thread).concat("properties");
}

// /v1/threads/{thread}/members
function buildMembers(thread: string): string[] {
  return buildThread(thread).concat("members");
}

// /v1/threads/{thread}/members/{member}
function buildMember(thread: string, member: string): string[] {
  return buildMembers(thread).concat(member);
}

// /v1/users
function buildUsers(): string[] {
  return buildV1().concat("users");
}

// /v1/users/{user}
function buildUser(user: string): string[] {
  return buildUsers().concat(user);
}

// /v1/users/{user}/endpoints
function buildEndpoints(user: string): string[] {
  return buildUser(user).concat("endpoints");
}

// /v1/users/{user}/endpoints/{endpoint}
function buildEndpoint(user: string, endpoint: string): string[] {
  return buildEndpoints(user).concat(endpoint);
}

// /v1/users/{user}/endpoints/{endpoint}/subscriptions
function buildSubscriptions(user: string, endpoint: string): string[] {
  return buildEndpoint(user, endpoint).concat("subscriptions");
}

// /v1/users/{user}/endpoints/{endpoint}/subscriptions/{subscription}
function buildSubscription(user: string, endpoint: string, subscription: number): string[] {
  return buildSubscriptions(user, endpoint).concat(String(subscription));
}

// /v1/users/{user}/endpoints/{endpoint}/subscriptions/{subscription}/poll
function buildPoll(user: string, endpoint: string, subscription: number): string[] {
  return buildSubscription(user, endpoint, subscription).concat("poll");
}

// /v1/users/{user}/endpoints/{endpoint}/presenceDocs
function buildEndpointPresenceDocs(user: string, endpoint: string): string[] {
  return buildEndpoint(user, endpoint).concat("presenceDocs");
}

// /v1/users/{user}/endpoints/{endpoint}/presenceDocs/endpointMessagingService
function buildEndpointMessagingService(user: string, endpoint: string): string[] {
  return buildEndpointPresenceDocs(user, endpoint).concat("endpointMessagingService");
}

// /v1/users/{user}/conversations
function buildConversations(user: string): string[] {
  return buildUser(user).concat("conversations");
}

// /v1/users/{user}/conversations/{conversation}
function buildConversation(user: string, conversation: string): string[] {
  return buildConversations(user).concat(conversation);
}

// /v1/users/{user}/conversations/{conversation}/messages
function buildMessages(user: string, conversation: string): string[] {
  return buildConversation(user, conversation).concat("messages");
}

// /v1/users/{user}/presenceDocs
function buildUserPresenceDocs(user: string): string[] {
  return buildUser(user).concat("presenceDocs");
}

// /v1/users/{user}/presenceDocs/endpointMessagingService
function buildUserMessagingService(user: string): string[] {
  return buildUserPresenceDocs(user).concat("endpointMessagingService");
}

// /v1/objects
function buildObjects(): string[] {
  return buildV1().concat("objects");
}

// /v1/objects/{objectId}
function buildObject(objectId: string) {
  return buildObjects().concat(objectId);
}

// /v1/objects/{objectId}/content/{content}
function buildObjectContent(objectId: string, content: string) {
  return buildObject(objectId).concat("content").concat(content);
}

// /v1/objects/{objectId}/view/{content}
function buildObjectView(objectId: string, view: string) {
  return buildObject(objectId).concat("view").concat(view);
}

/**
 * Returns an URI origin like: "https://host.com"
 * If host is `null`, returns an empty string
 */
function getOrigin(host: string): string {
  return host === null ? "" : "https://" + host;
}

function get(host: string, p: string) {
  return url.resolve(getOrigin(host), p);
}

export function threads(host: string): string {
  return get(host, joinPath(buildThreads()));
}

export function thread(host: string, threadId: string): string {
  return get(host, joinPath(buildThread(threadId)));
}

export function member(host: string, threadId: string, member: string): string {
  return get(host, joinPath(buildMember(threadId, member)));
}

export function properties(host: string, threadId: string): string {
  return get(host, joinPath(buildProperties(threadId)));
}

export function users(host: string): string {
  return get(host, joinPath(buildUsers()));
}

export function user(host: string, userId: string = DEFAULT_USER): string {
  return get(host, joinPath(buildUser(userId)));
}

/**
 * Build the URI for the endpoints of a user.
 *
 * Template: `https://{host}/v1/users/{userId}/endpoints`
 *
 * @param host Hostname of the messages server.
 * @param userId Id of the user. Default: `"ME"`.
 * @return Formatted URI.
 */
export function endpoints(host: string, userId: string = DEFAULT_USER): string {
  return get(host, joinPath(buildEndpoints(userId)));
}

export function endpoint(host: string, userId: string = DEFAULT_USER,
                         endpointId: string = DEFAULT_ENDPOINT): string {
  return get(host, joinPath(buildEndpoint(userId, endpointId)));
}

// Reevaluate this
// export function poll(apiContext: any, userId: string = DEFAULT_USER,
//                      subscriptionId: number = 0): string {
//   return get(apiContext.registrationToken.host,
//     joinPath(buildPoll(userId,
//       encodeURIComponent(apiContext.registrationToken.endpointId),
//       subscriptionId)));
//
// }

export function poll(host: string, userId: string = DEFAULT_USER,
                     endpointId: string = DEFAULT_ENDPOINT, subscriptionId: number = 0): string {
  return get(host, joinPath(buildPoll(userId, endpointId, subscriptionId)));
}

/**
 * Build the URI for polling notifications
 * Uri example: https://eus.notifications.skype.com/users/8:{skypeId}
 * /endpoints/{endpointId}/events/poll?cursor=1563307584&sca=2&pageSize=20
 *
 * @param io
 * @param apiContext
 * @return  notifications URI
 */
export async function notifications(io: httpIo.HttpIo, apiContext: any): Promise<string> {
  const updatedRegistrationInfo: RegistrationInfo =  await updateRegistrationInfo(
    io,
    apiContext.cookies,
    apiContext.skypeToken,
    apiContext.registrationToken,
    apiContext.proxy,
  );
  return updatedRegistrationInfo.subscriptions[0].longPollUrl;
}

/**
 * Returns https://{host}/v1/users/{userId}/endpoints/{endpointId}/subscriptions
 * @param host
 * @param userId
 * @param endpointId
 */
export function subscriptions(host: string, userId: string = DEFAULT_USER,
                              endpointId: string = DEFAULT_ENDPOINT): string {
  return get(host, joinPath(buildSubscriptions(userId, endpointId)));
}

export function conversations(host: string, user: string): string {
  return get(host, joinPath(buildConversations(user)));
}

export function conversation(host: string, user: string, conversationId: string): string {
  return get(host, joinPath(buildConversation(user, conversationId)));
}

/**
 * Returns https://{host}/v1/users/{user}/conversations/{conversationId}/messages
 * @param host
 * @param user
 * @param conversationId
 */
export function messages(host: string, user: string, conversationId: string): string {
  return get(host, joinPath(buildMessages(user, conversationId)));
}

export function message(host: string, user: string, conversationId: string, messageId: string): string {
  return get(host, joinPath(buildMessages(user, conversationId).concat(messageId)));
}

export function objects(host: string): string {
  return get(host, joinPath(buildObjects()));
}

export function object(host: string, objectId: string): string {
  return get(host, joinPath(buildObject(objectId)));
}

export function objectContent(host: string, objectId: string, content: string): string {
  return get(host, joinPath(buildObjectContent(objectId, content)));
}

export function objectView(host: string, objectId: string, view: string): string {
  return get(host, joinPath(buildObjectView(objectId, view)));
}

export function userMessagingService(host: string, user: string = DEFAULT_USER): string {
  return get(host, joinPath(buildUserMessagingService(user)));
}

export function endpointMessagingService(host: string, user: string = DEFAULT_USER,
                                         endpoint: string = DEFAULT_ENDPOINT): string {
  return get(host, joinPath(buildEndpointMessagingService(user, endpoint)));
}

export interface MessageUri {
  host: string;
  user: string;
  conversation: string;
  message: string;
}

export function parseMessage(uri: string): MessageUri {
  const parsed: url.Url = url.parse(uri);
  if (parsed.host === undefined || parsed.pathname === undefined) {
    throw new Incident("parse-error", "Expected URI to have a host and path");
  }
  const match: RegExpExecArray | null = MESSAGE_PATTERN.exec(parsed.pathname || "");
  if (match === null) {
    throw new Incident("parse-error", "Expected URI to be a message uri");
  }
  return {
    host: parsed.host || "",
    user: match[1],
    conversation: match[2],
    message: match[3],
  };
}

export interface ContactUri {
  host: string;
  user: string;
  contact: string;
}

export function parseContact(uri: string): ContactUri {
  const parsed: url.Url = url.parse(uri);
  if (parsed.host === undefined || parsed.pathname === undefined) {
    throw new Incident("parse-error", "Expected URI to have a host and path");
  }
  const match: RegExpExecArray | null = CONTACT_PATTERN.exec(parsed.pathname || "");
  if (match === null) {
    throw new Incident("parse-error", "Expected URI to be a conversation uri");
  }
  return {
    host: parsed.host || "",
    user: match[1],
    contact: match[2],
  };
}

export interface ConversationUri {
  host: string;
  user: string;
  conversation: string;
}

export function parseConversation(uri: string): ConversationUri {
  const parsed: url.Url = url.parse(uri);
  if (parsed.host === undefined || parsed.pathname === undefined) {
    throw new Incident("parse-error", "Expected URI to have a host and path");
  }
  const match: RegExpExecArray | null = CONVERSATION_PATTERN.exec(parsed.pathname || "");
  if (match === null) {
    throw new Incident("parse-error", "Expected URI to be a conversation uri");
  }
  return {
    host: parsed.host || "",
    user: match[1],
    conversation: match[2],
  };
}
