import { Incident } from "incident";
import * as api from "../interfaces/api/api";
import { Context } from "../interfaces/api/context";
import * as io from "../interfaces/http-io";
import * as messagesUri from "../messages-uri";
import { getCurrentTime } from "../utils";

interface EditMessageQuery {
  messagetype: string;
  content: string;
}

export async function sendDelete(
  io: io.HttpIo, apiContext: Context,
  conversationId: string,
  messageId: string,
): Promise<void> {
  const requestOptions: io.DeleteOptions = {
    url: messagesUri.message(apiContext.registrationToken.host, messagesUri.DEFAULT_USER, conversationId, messageId),
    cookies: apiContext.cookies,
    headers: {
      RegistrationToken: apiContext.registrationToken.raw,
    },
    proxy: apiContext.proxy,
  };
  const res: io.Response = await io.del(requestOptions);

  if (res.statusCode !== 200) {
    return Promise.reject(new Incident("send-delete", "Received wrong return code"));
  }
}
