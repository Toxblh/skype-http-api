import { Context } from "../interfaces/api/context";
import * as io from "../interfaces/http-io";

export async function addBotAsContact(io: io.HttpIo,
                                      apiContext: Context,
                                      botId: string): Promise<boolean> {
  const requestOptions: io.PutOptions = {
    uri: `https://api.aps.skype.com/v1/relationship/me/${botId}`,
    cookies: apiContext.cookies,
    headers: {
      "X-Skypetoken": apiContext.skypeToken.value,
    },
    proxy: apiContext.proxy,
  };
  const res: io.Response = await io.put(requestOptions);

  if (res.statusCode !== 204) {
    console.log(`Unable to add BOT ${botId} as contact.
    Res Body:${res.body}  Res Code: ${res.statusCode}`);
  }
  return res.statusCode === 204;
}

export async function removeBotFromContacts(io: io.HttpIo,
                                            apiContext: Context,
                                            botId: string): Promise<boolean> {
  const requestOptions: io.DeleteOptions = {
    uri: `https://api.aps.skype.com/v1/relationship/me/${botId}`,
    cookies: apiContext.cookies,
    headers: {
      "X-Skypetoken": apiContext.skypeToken.value,
    },
    proxy: apiContext.proxy,
  };
  const res: io.Response = await io.del(requestOptions);

  if (res.statusCode !== 204) {
    console.log(`Unable to remove BOT ${botId} from contacts.
    Res Body:${res.body}  Res Code: ${res.statusCode}`);
  }
  return res.statusCode === 204;
}
