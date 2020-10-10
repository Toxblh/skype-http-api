import { Incident } from 'incident'
import { Context } from '../interfaces/api/context'
import * as io from '../interfaces/http-io'
import { Join } from '../interfaces/native-api/conversation'

interface RequestBody {
  baseDomain: 'https://join.skype.com/launch/' | string
  threadId: string
}

export async function getJoinUrl(
  io: io.HttpIo,
  apiContext: Context,
  conversationId: string
): Promise<string> {
  const requestBody: RequestBody = {
    baseDomain: 'https://join.skype.com/launch/',
    threadId: conversationId,
  }

  const url: string = 'https://api.scheduler.skype.com/threads'

  const requestOptions: io.PostOptions = {
    url,
    cookies: apiContext.cookies,
    body: JSON.stringify(requestBody),
    headers: {
      'X-Skypetoken': apiContext.skypeToken.value,
      'Content-Type': 'application/json',
    },
    proxy: apiContext.proxy,
  }

  const res: io.Response = await io.post(requestOptions)
  if (res.statusCode !== 200) {
    return Promise.reject(new Incident('get-join-url', 'Received wrong return code'))
  }
  const body: Join = JSON.parse(res.body)

  return body.JoinUrl
}
