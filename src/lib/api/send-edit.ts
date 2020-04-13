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

export async function sendEdit(
  io: io.HttpIo, apiContext: Context,
  message: api.NewMessage,
  conversationId: string,
  messageId: string,
): Promise<void> {
  const query: EditMessageQuery = {
    messagetype: "RichText",
    content: String(message.textContent),
  };
  const requestOptions: io.PutOptions = {
    url: messagesUri.message(apiContext.registrationToken.host, messagesUri.DEFAULT_USER, conversationId, messageId),
    cookies: apiContext.cookies,
    body: JSON.stringify(query),
    headers: {
      RegistrationToken: apiContext.registrationToken.raw,
    },
    proxy: apiContext.proxy,
  };
  const res: io.Response = await io.put(requestOptions);

  if (res.statusCode !== 200) {
    return Promise.reject(new Incident("send-edit", "Received wrong return code"));
  }
}
