import path from 'path'
import url from 'url'
import { SKYPEWEB_API_SKYPE_HOST, SKYPEWEB_CONTACTS_HOST } from './consts'

export const DEFAULT_USER: string = 'self'

function joinPath(parts: string[]): string {
  return path.posix.join.apply(null, parts)
}

// The following functions build an array of parts to build the path

// /users
function buildUsers(): string[] {
  return ['users']
}

function buildBatch(): string[] {
  return buildUsers().concat('batch')
}

// /users/:user
function buildUser(username: string): string[] {
  return buildUsers().concat(username)
}

// /users/:user/contacts
function buildContacts(username: string): string[] {
  return buildUser(username).concat('contacts')
}

// /users/:user/invites
function buildInvites(username: string): string[] {
  return buildUser(username).concat('invites')
}

// /users/:user/contacts/auth-request/:contact
function buildAuthRequest(username: string, contact: string): string[] {
  return buildContacts(username).concat('auth-request', contact)
}

// /users/:user/invites/:contact
function buildInviteRequest(username: string, contact: string): string[] {
  return buildInvites(username).concat(contact)
}

// /users/:user/contacts/auth-request/:contact/accept
// function buildAuthRequestAccept(username: string, contact: string): string[] {
//   return buildAuthRequest(username, contact).concat('accept')
// }

// /users/:user/contacts/auth-request/:contact/decline
function buildAuthRequestDecline(username: string, contact: string): string[] {
  return buildAuthRequest(username, contact).concat('decline')
}

function buildInviteRequestAccept(username: string, contact: string): string[] {
  return buildInviteRequest(username, contact).concat('accept')
}

// /users/:user/displayname
function buildDisplayName(username: string): string[] {
  return buildUser(username).concat('displayname')
}

// /users/:user/profile
function buildProfile(username: string): string[] {
  return buildUser(username).concat('profile')
}

// agentProvisioningService: { host: "https://api.aps.skype.com/v1/" },
// stratusService: {
//   avatarUrl: "users/${contactId}/profile/avatar?cacheHeaders=1",
//     avatarUpdateUrl: "users/${contactId}/profile/avatar",
//     blockContactEndpoint: "users/self/contacts/${contactId}/block",
//     contactRequestEndpoint: "users/self/contacts/auth-request",
//     contactRequestTimeInterval: 60000,
//     contactsEndpoint: "users/self/authorized-contacts",
//     directorySearchEndpointSkypeOnly: "search/users/any?keyWord=${keyword}&contactTypes[]=skype",
//     directorySearchEndpoint: "search/users/any?keyWord=${keyword}",
//     directorySearchByIdEndpoint: "search/users?skypename=${skypeName}",
//     firstContactRequestDelay: 10000,
//     host: "https://api.skype.com/",
//     myContactsEndpoint: "users/self/contacts?hideDetails=true",
//     profileEndpoint: "users/self/profile",
//     profilesEndpoint: "users/self/contacts/profiles",
//     batchProfilesEndpoint: "users/batch/profiles",
//     userInfoEndpoint: "users/self",
//     unblockContactEndpoint: "users/self/contacts/${contactId}/unblock",
//     deleteContactEndpoint: "users/self/contacts/${contactId}",
//     retry: n
// },

// /users/:user/profile/avatar?cacheHeaders=1
// function buildAvatar(username: string): string[] {
//   return buildProfile(username).concat('avatar?cacheHeaders=1')
// }

// /users/:user/profile/avatar
// function buildUpdatedAvatar(username: string): string[] {
//   return buildProfile(username).concat('avatar')
// }

function buildProfiles(): string[] {
  return buildBatch().concat('profiles')
}

function getOrigin(): string {
  return 'https://' + SKYPEWEB_API_SKYPE_HOST
}

function getContact(): string {
  return `https://${SKYPEWEB_CONTACTS_HOST}`
}

function get(p: string) {
  return url.resolve(getOrigin(), p)
}

function getC(p: string) {
  return url.resolve(getContact(), p)
}

export function displayName(username: string): string {
  return get(joinPath(buildDisplayName(username)))
}

export function userProfile(user: string): string {
  return get(joinPath(buildProfile(user)))
}

export function userProfiles(): string {
  return get(joinPath(buildProfiles()))
}

export function authRequestAccept(username: string, contact: string): string {
  return getC(joinPath(buildInviteRequestAccept(username, contact)))
}

export function authRequestDecline(username: string, contact: string): string {
  return get(joinPath(buildAuthRequestDecline(username, contact)))
}
