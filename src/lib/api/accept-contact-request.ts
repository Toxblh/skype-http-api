import { Incident } from 'incident'
import * as apiUri from '../api-uri'
import { Context } from '../interfaces/api/context'
import * as io from '../interfaces/http-io'

export async function acceptContactRequest(
  io: io.HttpIo,
  apiContext: Context,
  contactUsername: string
): Promise<void> {
  const requestOptions: io.PutOptions = {
    url: apiUri.authRequestAccept(apiContext.username, contactUsername),
    cookies: apiContext.cookies,
    headers: {
      'X-Skypetoken': apiContext.skypeToken.value,
    },
    proxy: apiContext.proxy,
  }
  const res: io.Response = await io.put(requestOptions)
  if (res.statusCode !== 200) {
    return Promise.reject(new Incident('net', 'Failed to accept contact'))
  }
}
