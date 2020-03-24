import cheerio from "cheerio";
import _events from "events";
import { Incident } from "incident";
import { UnexpectedHttpStatusError } from "../errors";
import { readSetRegistrationTokenHeader } from "../helpers/register-endpoint";
import { ParsedConversationId } from "../interfaces/api/api";
import { Context as ApiContext } from "../interfaces/api/context";
import * as events from "../interfaces/api/events";
import * as resources from "../interfaces/api/resources";
import * as httpIo from "../interfaces/http-io";
import * as nativeEvents from "../interfaces/native-api/events";
import * as nativeMessageResources from "../interfaces/native-api/message-resources";
import * as nativeResources from "../interfaces/native-api/resources";
import * as messagesUri from "../messages-uri";

let lastMsgId: number = 0; // this is used to make the next poll request
// let notifUri: string;

// Match a contact id:
// TODO: handle the "guest" prefix
const CONTACT_ID_PATTERN: RegExp = /^(\d+):(.+)$/;

// TODO(demurgos): Looks like there is a problem with the return type
export function parseContactId(contactId: string): ParsedConversationId {
  const match: RegExpExecArray | null = CONTACT_ID_PATTERN.exec(contactId);
  if (match === null) {
    throw new Incident("parse-error", "Unable to parse userId");
  }
  return {
    raw: contactId,
    prefix: parseInt(match[1], 10),
    username: match[2],
  };
}

export function formatRichTextResource(
  retObj: resources.Resource,
  nativeResource: nativeMessageResources.RichText,
): resources.RichTextResource {
  const ret: resources.RichTextResource = retObj as resources.RichTextResource;
  ret.content = nativeResource.content;
  ret.clientId = nativeResource.clientmessageid;
  return ret;
}

export function formatTextResource(
  retObj: resources.Resource,
  nativeResource: nativeMessageResources.Text,
): resources.TextResource {
  const ret: resources.TextResource = retObj as resources.TextResource;
  ret.content = nativeResource.content;
  ret.clientId = nativeResource.clientmessageid;
  ret.properties = nativeResource.properties;
  const propsObj: any = nativeResource.properties;
  ret.callLog = propsObj ? JSON.parse(propsObj["call-log"]) : {};
  return ret;
}

export function formatControlClearTypingResource(
  retObj: resources.Resource,
  nativeResource: nativeMessageResources.ControlClearTyping,
): resources.ControlClearTypingResource {
  return retObj as resources.ControlClearTypingResource;
}

// Export for testing
export function formatGenericMessageResource(
  nativeResource: nativeResources.MessageResource,
  type: resources.ResourceType,
) {
  const parsedConversationUri: messagesUri.ConversationUri = messagesUri
    .parseConversation(nativeResource.conversationLink);
  const parsedContactUri: messagesUri.ContactUri = messagesUri.parseContact(nativeResource.from);
  const parsedContactId: ParsedConversationId = parseContactId(parsedContactUri.contact);
  return {
    type,
    id: nativeResource.id,
    composeTime: new Date(nativeResource.composetime),
    arrivalTime: new Date(nativeResource.originalarrivaltime),
    from: parsedContactId,
    conversation: parsedConversationUri.conversation,
    native: nativeResource,
  };
}

// tslint:disable-next-line:max-line-length
export function formatConversationUpdateResource(nativeResource: nativeResources.ConversationUpdate)
  : resources.ConversationUpdateResource {

  // dummy links needed in order to avoid errors caused when users aren't yet connected
  const parsedConversationUri: messagesUri.ConversationUri = messagesUri.parseConversation(
    (
      nativeResource.lastMessage.conversationLink !== undefined ?
        nativeResource.lastMessage.conversationLink :
        "https://client-s.gateway.messenger.live.com/v1/users/ME/conversations/8:dummy_user"),
  );

  const parsedContactUri: messagesUri.ContactUri = messagesUri.parseContact((
    nativeResource.lastMessage.from !== undefined ?
      nativeResource.lastMessage.from :
      "https://client-s.gateway.messenger.live.com/v1/users/ME/contacts/8:dummy_user"),
    );

  const parsedContactId: ParsedConversationId = parseContactId(parsedContactUri.contact);
  return {
    type: "ConversationUpdate",
    id: nativeResource.id,
    clientId: nativeResource.lastMessage.clientmessageid,
    composeTime: new Date(nativeResource.lastMessage.composetime),
    arrivalTime: new Date(nativeResource.lastMessage.originalarrivaltime),
    from: parsedContactId,
    conversation: parsedConversationUri.conversation,
    native: nativeResource,
    content: nativeResource.lastMessage.content,
  };
}

export function formatCustomUserPropertiesResource(nativeResource: nativeResources.CustomUserPropertiesResource)
  : resources.CustomUserPropertiesResource {
  return {
    type: "CustomUserProperties",
    id: nativeResource.id,
    composeTime: new Date(),
    arrivalTime: new Date(),
    conversation: "",
    from: {raw: "", prefix: 0, username: ""},
    native: nativeResource,
    time: nativeResource.time,
    resourceLink: nativeResource.resourceLink,
    resource: nativeResource.resource,
  };
}

// tslint:disable-next-line:max-line-length
export function formatControlTypingResource(
  retObj: resources.Resource,
  nativeResource: nativeMessageResources.ControlTyping,
): resources.ControlTypingResource {
  const ret: resources.ControlTypingResource = retObj as resources.ControlTypingResource;
  return ret;
}

// tslint:disable-next-line:max-line-length
export function formatSignalFlamingoResource(
  retObj: resources.Resource,
  nativeResource: nativeMessageResources.SignalFlamingo,
): resources.SignalFlamingoResource {
  const ret: resources.SignalFlamingoResource = retObj as resources.SignalFlamingoResource;
  ret.skypeguid = nativeResource.skypeguid;
  return ret;
}

// tslint:disable-next-line:max-line-length
export function formatMemberConsumptionHorizonUpdateResource(
  retObj: resources.Resource,
  nativeResource: nativeMessageResources.MemberConsumptionHorizonUpdate,
): resources.MemberConsumptionHorizonUpdateResource {
  const ret: resources.MemberConsumptionHorizonUpdateResource
    = retObj as resources.MemberConsumptionHorizonUpdateResource;
  return ret;
}

function formatMessageResource(nativeResource: nativeResources.MessageResource): resources.Resource {
  switch (nativeResource.messagetype) {
    case "RichText/UriObject":
      // tslint:disable-next-line:max-line-length
      // return formatUriObjectResource(formatFileResource(formatGenericMessageResource(nativeResource, nativeResource.messagetype), <nativeMessageResources.UriObject> nativeResource), <nativeMessageResources.UriObject> nativeResource);
    case "RichText/Media_Video":
      // tslint:disable-next-line:max-line-length
      return formatMediaVideoResource(formatFileResource(formatGenericMessageResource(nativeResource, nativeResource.messagetype), <nativeMessageResources.MediaVideo> nativeResource), <nativeMessageResources.MediaVideo> nativeResource);
    case "RichText/Media_AudioMsg":
      // tslint:disable-next-line:max-line-length
      return formatMediaAudioResource(formatFileResource(formatGenericMessageResource(nativeResource, nativeResource.messagetype), <nativeMessageResources.MediaAudio> nativeResource), <nativeMessageResources.MediaAudio> nativeResource);
    case "RichText/Media_GenericFile":
      // tslint:disable-next-line:max-line-length
      return formatMediaGenericFileResource(formatFileResource(formatGenericMessageResource(nativeResource, nativeResource.messagetype), <nativeMessageResources.MediaGenericFile> nativeResource), <nativeMessageResources.MediaGenericFile> nativeResource);
    case "RichText/Location":
      // tslint:disable-next-line:max-line-length
      return formatLocationResource(formatGenericMessageResource(nativeResource, nativeResource.messagetype), <nativeMessageResources.LocationObject> nativeResource);
    case "Event/Call":
      // tslint:disable-next-line:max-line-length
      return formatEventCallResource(formatGenericMessageResource(nativeResource, nativeResource.messagetype), <nativeMessageResources.EventCall> nativeResource);
    case "RichText":
      // tslint:disable-next-line:max-line-length
      return formatRichTextResource(formatGenericMessageResource(nativeResource, nativeResource.messagetype), <nativeMessageResources.RichText> nativeResource);
    case "Text":
      // tslint:disable-next-line:max-line-length
      return formatTextResource(formatGenericMessageResource(nativeResource, nativeResource.messagetype), <nativeMessageResources.Text> nativeResource);
    case "Control/ClearTyping":
      // tslint:disable-next-line:max-line-length
      return formatControlClearTypingResource(formatGenericMessageResource(nativeResource, nativeResource.messagetype), <nativeMessageResources.ControlClearTyping> nativeResource);
    case "Control/Typing":
      // tslint:disable-next-line:max-line-length
      return formatControlTypingResource(formatGenericMessageResource(nativeResource, nativeResource.messagetype), <nativeMessageResources.ControlTyping> nativeResource);
    case "Signal/Flamingo": // incoming call request
      // tslint:disable-next-line:max-line-length
      return formatSignalFlamingoResource(formatGenericMessageResource(nativeResource, nativeResource.messagetype), <nativeMessageResources.SignalFlamingo> nativeResource);
    case "ThreadActivity/MemberConsumptionHorizonUpdate":
      // tslint:disable-next-line:max-line-length
      return formatMemberConsumptionHorizonUpdateResource(formatGenericMessageResource(nativeResource, nativeResource.messagetype), <nativeMessageResources.MemberConsumptionHorizonUpdate> nativeResource);
    default:
      // tslint:disable-next-line:max-line-length
      // throw new Error(`Unknown ressource.messageType (${JSON.stringify(nativeResource.messagetype)}) for resource:\n${JSON.stringify(nativeResource, null, "\t")}`);
      // log disabled due to flood
      return {
        type: "Ignored",
        id: "Ignored",
        composeTime: new Date(),
        arrivalTime: new Date(),
        from: {
          raw: "Ignored",
          prefix: 1,
          username: "Ignored",
        },
        conversation: "Ignored",
      };
  }
}

type NativeFileResouce =
  nativeMessageResources.MediaGenericFile
  | nativeMessageResources.UriObject
  | nativeMessageResources.MediaVideo
  | nativeMessageResources.MediaAudio;

function formatFileResource(retObj: resources.Resource, native: NativeFileResouce): resources.FileResource {
  const ret: resources.FileResource = retObj as resources.FileResource;
  const $: CheerioStatic = cheerio.load(native.content || "");
  const obj: Cheerio = $("URIObject");
  ret.uri_type = obj.attr("type");
  ret.uri = obj.attr("uri");
  ret.uri_thumbnail = obj.attr("url_thumbnail");
  ret.uri_w_login = $(obj.find("a")).attr("href");
  const sizeString: string | undefined = $(obj.find("FileSize")).attr("v");
  if (sizeString !== undefined) {
    ret.file_size = parseInt(sizeString, 10);
  }
  ret.original_file_name = $(obj.find("OriginalName")).attr("v");
  return ret;
}

// tslint:disable-next-line:max-line-length
function formatMediaGenericFileResource(
  retObj: resources.FileResource,
  native: nativeMessageResources.MediaGenericFile,
): resources.RichTextMediaGenericFileResource {
  const ret: resources.RichTextMediaGenericFileResource = retObj as resources.RichTextMediaGenericFileResource;
  return ret;
}

// tslint:disable-next-line:max-line-length
function formatMediaVideoResource(
  retObj: resources.FileResource,
  native: nativeMessageResources.MediaVideo,
): resources.RichTextMediaGenericFileResource {
  const ret: resources.RichTextMediaGenericFileResource = retObj as resources.RichTextMediaGenericFileResource;
  return ret;
}

function formatMediaAudioResource(
  retObj: resources.FileResource,
  _native: nativeMessageResources.MediaAudio,
): resources.RichTextMediaGenericFileResource {
  const ret: resources.RichTextMediaGenericFileResource = retObj as resources.RichTextMediaGenericFileResource;
  return ret;
}

// tslint:disable-next-line:max-line-length
function formatUriObjectResource(
  retObj: resources.FileResource,
  native: nativeMessageResources.UriObject,
): resources.RichTextUriObjectResource {
  const ret: resources.RichTextUriObjectResource = retObj as resources.RichTextUriObjectResource;
  return ret;
}

// tslint:disable-next-line:max-line-length
function formatLocationResource(
  retObj: resources.Resource,
  native: nativeMessageResources.LocationObject,
): resources.RichTextLocationResource {
  const ret: resources.RichTextLocationResource = retObj as resources.RichTextLocationResource;
  const $: CheerioStatic = cheerio.load(native.content);
  const obj: Cheerio = $("location");
  ret.latitude = parseInt(obj.attr("latitude"), 10);
  ret.longitude = parseInt(obj.attr("longitude"), 10);
  ret.altitude = parseInt(obj.attr("altitude"), 10);
  ret.speed = parseInt(obj.attr("speed"), 10);
  ret.course = parseInt(obj.attr("course"), 10);
  ret.address = obj.attr("address");
  ret.pointOfInterest = obj.attr("pointOfInterest");
  ret.map_url = $(obj.find("a")).attr("href");
  return ret;
}

// tslint:disable-next-line:max-line-length
function formatEventCallResource(
  retObj: resources.Resource,
  native: nativeMessageResources.EventCall,
): resources.EventCallResource {
  const ret: resources.EventCallResource = retObj as resources.EventCallResource;
  const $: CheerioStatic = cheerio.load(native.content);
  const type: string = $("partlist").attr("type");
  switch (type) {
    case "started":
    case "ended":
    case "missed":
      ret.event_type = type;
      break;
    default:
      throw new Error(`Unknown call state of: ${type}`);
  }
  let shortest: number | null = null;
  let connected: boolean = false;
  const participants: resources.CallParticipant[] = [];
  const parts: CheerioElement[] = $("part").toArray();
  for (const part of parts) {
    const pjs: Cheerio = $(part);
    const add: resources.CallParticipant = {displayName: pjs.find("name").text(), username: pjs.attr("identity")};
    const duration: string | undefined = pjs.find("duration").text();
    if (duration !== undefined && duration !== "") {
      add.duration = parseInt(duration, 10);
      if (add.duration > 0) {
        connected = true;
        if (shortest === null || add.duration < shortest) {
          shortest = add.duration;
        }
      }
    }
    participants.push(add);
  }
  ret.participants = participants;
  ret.call_connected = connected || participants.length > 1;
  if (shortest !== null) {
    ret.duration = shortest;
  }
  return ret;
}

function formatEventMessage(native: nativeEvents.EventMessage): events.EventMessage {
  let resource: resources.Resource | null;
  switch (native.resourceType) {
    case "UserPresence":
      resource = null;
      break;
    case "EndpointPresence":
      resource = null;
      break;
    case "ConversationUpdate":
      resource = formatConversationUpdateResource(native.resource as nativeResources.ConversationUpdate);
      break;
    case "MessageUpdate":
      resource = null;
      break;
    case "NewMessage":
      resource = formatMessageResource(<nativeResources.MessageResource> native.resource);
      break;
    case "CustomUserProperties":
      resource = formatCustomUserPropertiesResource(native.resource as nativeResources.CustomUserPropertiesResource);
      break;
    default:
      // tslint:disable-next-line:max-line-length
      // throw new Error(`Unknown EventMessage.resourceType (${JSON.stringify(native.resourceType)}) for Event:\n${JSON.stringify(native)}`);
      resource = null;
      // log disabled due to flood
      break;
  }

  return {
    id: native.id,
    type: native.type,
    resourceType: native.resourceType,
    time: new Date(native.time),
    resourceLink: native.resourceLink,
    resource,
  };
}

export class MessagesPoller extends _events.EventEmitter {
  io: httpIo.HttpIo;
  apiContext: ApiContext;
  activeState: boolean | false;
  notificationUri: string | undefined;

  constructor(io: httpIo.HttpIo, apiContext: ApiContext) {
    super();

    this.io = io;
    this.apiContext = apiContext;
    this.activeState = false;
    this.notificationUri = undefined;
  }

  isActive(): boolean {
    return this.activeState;
  }

  run(): this {
    if (this.isActive()) {
      return this;
    }
    this.activeState = true;
    // moved from setInterval to setTimeout as the request
    // may resolve in ±1minute if no new messages / notifications are available
    this.getMessagesLoop();
    this.getNotificationsLoop(); // using this may result in double notifications
    return this;
  }

  stop(): this {
    if (!this.isActive()) {
      return this;
    }
    this.activeState = false;
    // 1 more response will still be returned after stopping the listener
    return this;
  }

  protected async getMessagesLoop() {
    if (this.isActive()) {
      // console.log(new Date() +"~~~~~~~~~~~~~~~~~~~~~~~getMessagesLoop  START ~~~~~~~~~~~~~~~~~~~~~~~~~~");
      await this.getMessages();
      // console.log(new Date() +"~~~~~~~~~~~~~~~~~~~~~~~getMessagesLoop  END   ~~~~~~~~~~~~~~~~~~~~~~~~~~");
      this.getMessagesLoop();
    }
  }

  protected async getNotificationsLoop() {
    if (this.isActive()) {
      // console.log(new Date() +"~~~~~~~~~~~~~~~~~~~~~~~getNotificationsRecursive  START ~~~~~~~~~~~~~~~~~~~~~~~~~~");
      await this.getNotifications();
      // console.log(new Date() +"~~~~~~~~~~~~~~~~~~~~~~~getNotificationsRecursive  END   ~~~~~~~~~~~~~~~~~~~~~~~~~~");
      this.getNotificationsLoop();
    }
  }

  /**
   * Get the new messages / events from the server.
   * This function always returns a successful promise once the messages are retrieved or an error happens.
   *
   * If any error happens, the message-poller will emit an `error` event with the error.
   */
  protected async getMessages(): Promise<void> {
    try {
      const uri: string = messagesUri.poll(this.apiContext.registrationToken.host);
      const requestOptions: httpIo.PostOptions = {
        // TODO: explicitly define user, endpoint and subscription
        uri,
        cookies: this.apiContext.cookies,
        headers: {
          RegistrationToken: this.apiContext.registrationToken.raw,
        },
        proxy: this.apiContext.proxy,
      };
      const res: httpIo.Response = await this.io.post(requestOptions);

      if (res.headers["set-registrationtoken"]) {
        const registrationTokenHeader: string = res.headers["set-registrationtoken"];

        console.log("Updating registrationtoken -> getMessages() -> "
          + res.headers["set-registrationtoken"]); // for debug, will remove

        this.apiContext.registrationToken = readSetRegistrationTokenHeader(
          this.apiContext.registrationToken.host, registrationTokenHeader);
      }

      if (res.statusCode !== 200) {
        const cause: UnexpectedHttpStatusError = UnexpectedHttpStatusError.create(res, new Set([200]), requestOptions);
        this.emit("error", Incident(cause, "poll", "Unable to poll the messages"));
        return;
      }

      const body: { eventMessages?: nativeEvents.EventMessage[] } = JSON.parse(res.body);

      if (body.eventMessages !== undefined) {
        for (const msg of body.eventMessages) {
          const formatted: events.EventMessage = formatEventMessage(msg);
          if (formatted.resource !== null) {
            this.emit("event-message", formatted);
          }
        }
      }
    } catch (err) {
      this.emit("error", Incident(err, "poll", "An error happened while processing the polled messages"));
    }
  }

  /**
   * Get the new messages / notifications from the server, this is used to get messages that are not
   * returned by the old poll endpoint (ex. end call when initiator is on mobile).
   * This function always returns a successful promise once the messages are retrieved or an error happens.
   *
   * If any error happens, the message-poller will emit an `error` event with the error.
   */
  protected async getNotifications(): Promise<void> {
    try {
      const requestOptions: httpIo.GetOptions = {
        uri: this.notificationUri ? this.notificationUri : await messagesUri.notifications(this.io, this.apiContext),
        cookies: this.apiContext.cookies,
        headers: {
          Authentication: "skypetoken=" + this.apiContext.skypeToken.value,
        },
        proxy: this.apiContext.proxy,
      };
      const res: httpIo.Response = await this.io.get(requestOptions);

      if (res.headers["set-registrationtoken"]) {
        const registrationTokenHeader: string = res.headers["set-registrationtoken"];

        console.log("Updating registrationtoken -> getNotifications() -> "
          + res.headers["set-registrationtoken"]); // for debug, will remove

        this.apiContext.registrationToken = readSetRegistrationTokenHeader(
          this.apiContext.registrationToken.host, registrationTokenHeader);
      }

      if (res.statusCode !== 200) {
        const cause: UnexpectedHttpStatusError = UnexpectedHttpStatusError.create(res, new Set([200]), requestOptions);
        this.emit("error", Incident(cause, "poll", "Unable to poll the notifications"));
        return;
      }

      const body: { eventMessages?: nativeEvents.EventMessage[]; next?: string } = JSON.parse(res.body);
      if (body.next) {
        // added before parsing messages in case parsing messages fails
        this.notificationUri = body.next + "&pageSize=20";
      }
      if (body.eventMessages !== undefined) {
        for (const msg of body.eventMessages) {
          lastMsgId = msg.id;
          const formatted: events.EventMessage = formatEventMessage(msg);
          if (formatted.resource !== null) {
            this.emit("event-message", formatted);
          }
        }
      }

    } catch (err) {
      this.emit("error", Incident(err, "poll", "An error happened while processing the polled notifications"));
    }
  }
}
