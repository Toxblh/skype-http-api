import { Context } from "../interfaces/api/context";
import * as io from "../interfaces/http-io";

interface RequestBody {
  value: boolean;
}

/*
 In order to use this feature you need to first identify the user's skype id, as seen by skype
 EX: 8:live:new_user or 8:old_user
 */

export async function addUserAsContact(io: io.HttpIo,
                                       apiContext: Context,
                                       userId: string): Promise<boolean> {
  const requestBody: RequestBody = {
    value: true,
  };

  const requestOptions: io.PutOptions = {
    uri: `https://edge.skype.com/pcs-df/contacts/v2/users/${encodeURIComponent(apiContext.username)
    }/contacts/${encodeURIComponent(userId)}/explicit`,
    cookies: apiContext.cookies,
    body: JSON.stringify(requestBody),
    headers: {
      "X-Skypetoken": apiContext.skypeToken.value,
    },
    proxy: apiContext.proxy,
  };
  const res: io.Response = await io.put(requestOptions);

  if (res.statusCode !== 200) {
    console.log(`Unable to add USER ${userId} as contact.
    Res Body:${res.body}  Res Code: ${res.statusCode}`);
  }
  return res.statusCode === 200;
}

export async function removeUserFromContacts(io: io.HttpIo,
                                             apiContext: Context,
                                             userId: string): Promise<boolean> {
  const requestBody: RequestBody = {
    value: false,
  };
  const requestOptions: io.PutOptions = {
    uri: `https://edge.skype.com/pcs-df/contacts/v2/users/${encodeURIComponent(apiContext.username)
    }/contacts/${encodeURIComponent(userId)}/explicit`,

    cookies: apiContext.cookies,
    body: JSON.stringify(requestBody),
    headers: {
      "X-Skypetoken": apiContext.skypeToken.value,
    },
    proxy: apiContext.proxy,
  };
  const res: io.Response = await io.put(requestOptions);

  if (res.statusCode !== 200) {
    console.log(`Unable to remove USER ${userId} from contacts.
    Res Body:${res.body}  Res Code: ${res.statusCode}`);
  }
  return res.statusCode === 200;
}
