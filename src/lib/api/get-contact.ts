import { Incident } from 'incident'
import * as apiUri from '../api-uri'
import { Contact } from '../interfaces/api/contact'
import { Context } from '../interfaces/api/context'
import * as io from '../interfaces/http-io'
import { formatSearchContact } from '../utils/formatters'

export const VIRTUAL_CONTACTS: Set<string> = new Set(['concierge', 'echo123'])

export async function getContact(io: io.HttpIo, apiContext: Context, contactId: string): Promise<Contact> {
  if (VIRTUAL_CONTACTS.has(contactId)) {
    // tslint:disable-next-line:max-line-length
    throw new Error(
      `${JSON.stringify(contactId)} is not a real contact, you cannot get data for ${JSON.stringify(
        contactId
      )}`
    )
  }
  const requestOptions: io.PostOptions = {
    url: apiUri.userProfiles(),
    cookies: apiContext.cookies,
    body: 'usernames[]=' + encodeURIComponent(contactId),
    headers: {
      'X-Skypetoken': apiContext.skypeToken.value,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    proxy: apiContext.proxy,
  }
  const res: io.Response = await io.post(requestOptions)
  if (res.statusCode !== 200) {
    return Promise.reject(new Incident('net', 'Unable to fetch contact'))
  }
  const bodyObj: any = JSON.parse(res.body)[0]
  if (!bodyObj || bodyObj.status) {
    return Promise.reject(new Incident('net', 'Contact not found'))
  }
  const body: Contact = formatSearchContact(bodyObj)
  return body
}
