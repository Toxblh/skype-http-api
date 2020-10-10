import { Incident } from 'incident'
import toughCookie from 'tough-cookie'
import { getSelfProfile } from './api/get-self-profile'
import * as Consts from './consts'
import { registerEndpoint } from './helpers/register-endpoint'
import { Credentials } from './interfaces/api/api'
import {
  Context as ApiContext,
  // RegistrationInfo,
  RegistrationToken,
  SkypeToken,
} from './interfaces/api/context'
import * as io from './interfaces/http-io'
import * as messagesUri from './messages-uri'
import * as microsoftAccount from './providers/microsoft-account'
import { ApiProfile } from './types/api-profile'

interface IoOptions {
  io: io.HttpIo
  cookies: toughCookie.Store
}

export interface LoginOptions {
  io: io.HttpIo
  credentials: Credentials
  verbose?: boolean
  proxy?: string
}

/**
 * Builds an Api context trough a new authentication.
 * This involves the requests:
 * GET <loginUrl> to scrap the LoginKeys (pie & etm)
 * POST <loginUrl> to get the SkypeToken from the credentials and LoginKeys
 * GET <selfProfileUrl> to get the userId
 * POST <registrationUrl> to get RegistrationToken from the SkypeToken
 *   Eventually, follow a redirection to use the assigned host
 * POST <subscription> to gain access to resources with the RegistrationToken
 *
 * @param options
 * @returns A new API context with the tokens for the provided user
 */
export async function login(options: LoginOptions): Promise<ApiContext> {
  const cookies: toughCookie.MemoryCookieStore = new toughCookie.MemoryCookieStore()
  const ioOptions: IoOptions = { io: options.io, cookies }

  const skypeToken: SkypeToken = await microsoftAccount.login({
    credentials: {
      login: options.credentials.username,
      password: options.credentials.password,
    },
    httpIo: options.io,
    cookies,
    proxy: options.proxy,
  })
  if (options.verbose) {
    console.log('Acquired SkypeToken')
  }

  const profile: ApiProfile = await getSelfProfile(options.io, cookies, skypeToken, options.proxy)
  const username: string = profile.username

  if (options.verbose) {
    console.log('Acquired username')
  }

  const registrationToken: RegistrationToken = await registerEndpoint(
    ioOptions.io,
    ioOptions.cookies,
    skypeToken,
    Consts.SKYPEWEB_DEFAULT_MESSAGES_HOST,
    undefined,
    options.proxy
  )
  if (options.verbose) {
    console.log('Acquired RegistrationToken')
  }

  await subscribeToResources(ioOptions, registrationToken, options.proxy)
  if (options.verbose) {
    console.log('Subscribed to resources')
  }

  await createPresenceDocs(ioOptions, registrationToken, options.proxy)
  if (options.verbose) {
    console.log('Created presence docs')
  }

  return {
    username,
    skypeToken,
    cookies,
    registrationToken,
    proxy: options.proxy,
  }
}

// tslint:disable-next-line:max-line-length
async function subscribeToResources(
  ioOptions: IoOptions,
  registrationToken: RegistrationToken,
  proxy?: string
): Promise<void> {
  // TODO(demurgos): typedef
  // tslint:disable-next-line:typedef
  const requestDocument = {
    interestedResources: [
      '/v1/threads/ALL',
      '/v1/users/ME/conversations/ALL/properties',
      '/v1/users/ME/conversations/ALL/messages',
    ],
    template: 'raw',
    conversationType: 2047,
    channelType: 'HttpLongPoll', // TODO: use websockets ?
  }
  /* all resources found in skype web code
      interestedResources: [
      "/v1/threads/ALL",
      "/v1/users/ME/contacts/ALL",
      "/v1/users/ME/conversations/ALL/messages",
      "/v1/users/ME/conversations/ALL/properties",
      "/v1/users/ME/endpoints/SELF/signals",
      "/v1/users/ME/conversations/ALL/properties?view=consumptionHorizon",
    ],
   */

  const requestOptions: io.PostOptions = {
    url: messagesUri.subscriptions(registrationToken.host),
    cookies: ioOptions.cookies,
    body: JSON.stringify(requestDocument),
    proxy,
    headers: {
      RegistrationToken: registrationToken.raw,
    },
  }

  const res: io.Response = await ioOptions.io.post(requestOptions)
  if (res.statusCode !== 201) {
    return Promise.reject(
      new Incident('net', `Unable to subscribe to resources: statusCode: ${res.statusCode} body: ${res.body}`)
    )
  }

  // Example response:
  // {
  //   "statusCode": 201,
  //   "body": "{}",
  //   "headers": {
  //     "cache-control": "no-store, must-revalidate, no-cache",
  //       "pragma": "no-cache",
  //       "content-length": "2",
  //       "content-type": "application/json; charset=utf-8",
  //       "location": "https://db5-client-s.gateway.messenger.live.com/v1/users/ME/endpoints/SELF/subscriptions/0",
  //       "x-content-type-options": "nosniff",
  //       "contextid": "tcid=3434983151221922702,server=DB5SCH101121535",
  //       "date": "Sat, 14 May 2016 16:41:17 GMT",
  //       "connection": "close"
  //   }
  // }
}

// tslint:disable-next-line:max-line-length
async function createPresenceDocs(
  ioOptions: IoOptions,
  registrationToken: RegistrationToken,
  proxy?: string
): Promise<any> {
  // this is the exact json that is needed to register endpoint for setting of status.
  // demurgos: If I remember well enough, it's order dependant.
  // TODO: typedef
  // tslint:disable-next-line:typedef
  const requestBody = {
    id: 'messagingService',
    privateInfo: {
      epname: registrationToken.endpointId.replace('{', '').replace('}', ''), // Name of the endpoint (normally the name of the host)
    },
    publicInfo: {
      capabilities: 'Audio|Video',
      type: 2,
      // tslint:disable-next-line:max-line-length
      skypeNameVersion: `${Consts.SKYPEWEB_CLIENTINFO_VERSION}/${Consts.SKYPEWEB_CLIENTINFO_NAME}`, // 1418/8.50.76.23/SkypeX
      nodeInfo: 'xx',
      version: '15',
    },
  }

  const url: string = messagesUri.endpointMessagingService(
    registrationToken.host,
    messagesUri.DEFAULT_USER,
    registrationToken.endpointId
  )

  const requestOptions: io.PutOptions = {
    url,
    cookies: ioOptions.cookies,
    body: JSON.stringify(requestBody),
    proxy,
    headers: {
      RegistrationToken: registrationToken.raw,
    },
  }

  const res: io.Response = await ioOptions.io.put(requestOptions)

  if (res.statusCode !== 200) {
    return Promise.reject(new Incident('net', 'Unable to create presence endpoint'))
  }
}
