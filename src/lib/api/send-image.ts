import * as fs from "async-file";
import { Incident } from "incident";
import * as api from "../interfaces/api/api";
import { Context } from "../interfaces/api/context";
import * as io from "../interfaces/http-io";
import * as messagesUri from "../messages-uri";
import { getCurrentTime } from "../utils";
import escapeHtml from "escape-html";

interface SendMessageResponse {
  OriginalArrivalTime: number;
}

interface SendMessageQuery {
  clientmessageid: string;
  content: string;
  messagetype: string;
  contenttype: string;
}

export async function sendImage(
  io: io.HttpIo, apiContext: Context,
  img: api.NewMediaMessage,
  conversationId: string,
): Promise<api.SendMessageResult> {
  const bodyNewObject: any = {
    type: "pish/image",
    permissions: {[conversationId]: ["read"]},
  };
  const bodyNewObjectStr: string = JSON.stringify(bodyNewObject);
  const requestOptionsNewObject: io.PostOptions = {
    uri: messagesUri.objects("api.asm.skype.com"),
    cookies: apiContext.cookies,
    body: bodyNewObjectStr,
    headers: {
      "Authorization": `skype_token ${apiContext.skypeToken.value}`,
      "Content-Type": "application/json",
      "Content-Length": bodyNewObjectStr.length.toString(10),
      "X-Client-Version": "0/0.0.0.0",
    },
    proxy: apiContext.proxy,
  };
  const resNewObject: io.Response = await io.post(requestOptionsNewObject);

  if (resNewObject.statusCode !== 201) {
    return Promise.reject(new Incident("send-image", "Received wrong return code"));
  }
  const objectId: string = JSON.parse(resNewObject.body).id;

  let file: Buffer;
  if (typeof img.file === "string") {
    file = await fs.readFile(img.file);
  } else {
    file = img.file;
  }
  const requestOptionsPutObject: io.PutOptions = {
    uri: messagesUri.objectContent("api.asm.skype.com", objectId, "imgpsh"),
    cookies: apiContext.cookies,
    body: file,
    headers: {
      "Authorization": `skype_token ${apiContext.skypeToken.value}`,
      "Content-Type": "multipart/form-data",
      "Content-Length": file.byteLength.toString(10),
    },
    proxy: apiContext.proxy,
  };
  const resObject: io.Response = await io.put(requestOptionsPutObject);

  if (resObject.statusCode !== 201) {
    return Promise.reject(new Incident("send-image", "Received wrong return code"));
  }

  const pictureUri: string = messagesUri.object("api.asm.skype.com", objectId);
  const pictureThumbnailUri: string = messagesUri.objectView("api.asm.skype.com", objectId, "imgt1");
  const shareUri = `https://login.skype.com/login/soo?go=xmmfallback?pic=${objectId}`;

  let extraURIObject = "";
  if (img.width) {
    extraURIObject += ` width="${img.width}"`;
  }
  if (img.height) {
    extraURIObject += ` width="${img.height}"`;
  }
  const query: SendMessageQuery = {
    clientmessageid: String(getCurrentTime() + Math.floor(10000 * Math.random())),
    content: `
      <URIObject type="Picture.1" uri="${escapeHtml(pictureUri)}" url_thumbnail="${escapeHtml(pictureThumbnailUri)}"${extraURIObject}>
        To view this shared photo, go to: <a href="${escapeHtml(shareUri)}">${escapeHtml(shareUri)}</a>
        <OriginalName v="${img.name}"></OriginalName>
        <FileSize v="${file.length}"></FileSize>
        <meta type="photo" originalName="${img.name}"></meta>
      </URIObject>
    `,
    messagetype: "RichText/UriObject",
    contenttype: "text",
  };
  const requestOptions: io.PostOptions = {
    uri: messagesUri.messages(apiContext.registrationToken.host, messagesUri.DEFAULT_USER, conversationId),
    cookies: apiContext.cookies,
    body: JSON.stringify(query),
    headers: {
      RegistrationToken: apiContext.registrationToken.raw,
    },
    proxy: apiContext.proxy,
  };
  const res: io.Response = await io.post(requestOptions);

  if (res.statusCode !== 201) {
    return Promise.reject(new Incident("send-message", "Received wrong return code"));
  }
  const parsed: messagesUri.MessageUri = messagesUri.parseMessage(res.headers["location"]);
  const body: SendMessageResponse = JSON.parse(res.body);
  return {
    clientMessageId: query.clientmessageid,
    arrivalTime: body.OriginalArrivalTime,
    textContent: query.content,
    MessageId: parsed.message,
  };
}
