import { Incident } from 'incident'
import { UnexpectedHttpStatusError } from '../../errors/http'
import { Context } from '../../interfaces/api/context'
import * as io from '../../interfaces/http-io'
import { Contact } from '../../types/contact'
import { Url } from '../../types/url'
import * as contactsUrl from '../contacts-url'
import { GetUserResult } from './get-user'

export async function getContacts(
  httpIo: io.HttpIo,
  apiContext: Context,
  delta: boolean = false
): Promise<Contact[]> {
  // TODO: use the user contacts instead of just the user URL
  const url: Url = contactsUrl.formatUser(apiContext.username)
  const request: io.GetOptions = {
    url,
    queryString: { reason: 'default' },
    cookies: apiContext.cookies,
    headers: {
      'X-Skypetoken': apiContext.skypeToken.value,
    },
    proxy: apiContext.proxy,
  }
  if (delta) {
    request.queryString.delta = '1'
    if (apiContext.etag) {
      request.headers['If-None-Match'] = apiContext.etag
    }
  }
  const response: io.Response = await httpIo.get(request)
  if (response.statusCode !== 200) {
    UnexpectedHttpStatusError.create(response, new Set([200]), request)
  }
  apiContext.etag = response.headers.etag
  let parsed: any
  try {
    parsed = JSON.parse(response.body)
  } catch (err) {
    throw new Incident(err, 'UnexpectedResponseBody', { body: response.body })
  }

  let result: GetUserResult
  try {
    result = JSON.parse(response.body)
  } catch (err) {
    throw new Incident(err, 'UnexpectedResult', { body: parsed })
  }
  return result.contacts
}
