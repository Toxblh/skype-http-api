'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod
    var result = {}
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k]
    result['default'] = mod
    return result
  }
Object.defineProperty(exports, '__esModule', { value: true })
const cheerio_1 = __importDefault(require('cheerio'))
const events_1 = __importDefault(require('events'))
const incident_1 = require('incident')
const http_1 = require('../errors/http')
const messagesUri = __importStar(require('../messages-uri'))
// Perform one request every 1000 ms
const POLLING_DELAY = 1000
// Match a contact id:
// TODO: handle the "guest" prefix
const CONTACT_ID_PATTERN = /^(\d+):(.+)$/
// TODO(demurgos): Looks like there is a problem with the return type
function parseContactId(contactId) {
  const match = CONTACT_ID_PATTERN.exec(contactId)
  if (match === null) {
    throw new incident_1.Incident('parse-error', 'Unable to parse userId')
  }
  return {
    raw: contactId,
    prefix: parseInt(match[1], 10),
    username: match[2],
  }
}
exports.parseContactId = parseContactId
function formatRichTextResource(retObj, nativeResource) {
  const ret = retObj
  ret.content = nativeResource.content
  ret.clientId = nativeResource.clientmessageid
  return ret
}
exports.formatRichTextResource = formatRichTextResource
function formatTextResource(retObj, nativeResource) {
  const ret = retObj
  ret.content = nativeResource.content
  ret.clientId = nativeResource.clientmessageid
  return ret
}
exports.formatTextResource = formatTextResource
function formatControlClearTypingResource(retObj, nativeResource) {
  return retObj
}
exports.formatControlClearTypingResource = formatControlClearTypingResource
// Export for testing
function formatGenericMessageResource(nativeResource, type) {
  const parsedConversationUri = messagesUri.parseConversation(nativeResource.conversationLink)
  const parsedContactUri = messagesUri.parseContact(nativeResource.from)
  const parsedContactId = parseContactId(parsedContactUri.contact)
  return {
    type,
    id: nativeResource.id,
    composeTime: new Date(nativeResource.composetime),
    arrivalTime: new Date(nativeResource.originalarrivaltime),
    from: parsedContactId,
    conversation: parsedConversationUri.conversation,
    native: nativeResource,
  }
}
exports.formatGenericMessageResource = formatGenericMessageResource
// tslint:disable-next-line:max-line-length
function formatConversationUpdateResource(nativeResource) {
  const parsedConversationUri = messagesUri.parseConversation(nativeResource.lastMessage.conversationLink)
  const parsedContactUri = messagesUri.parseContact(nativeResource.lastMessage.from)
  const parsedContactId = parseContactId(parsedContactUri.contact)
  return {
    type: 'ConversationUpdate',
    id: nativeResource.id,
    clientId: nativeResource.lastMessage.clientmessageid,
    composeTime: new Date(nativeResource.lastMessage.composetime),
    arrivalTime: new Date(nativeResource.lastMessage.originalarrivaltime),
    from: parsedContactId,
    conversation: parsedConversationUri.conversation,
    native: nativeResource,
    content: nativeResource.lastMessage.content,
  }
}
exports.formatConversationUpdateResource = formatConversationUpdateResource
// tslint:disable-next-line:max-line-length
function formatControlTypingResource(retObj, nativeResource) {
  const ret = retObj
  return ret
}
exports.formatControlTypingResource = formatControlTypingResource
// tslint:disable-next-line:max-line-length
function formatSignalFlamingoResource(retObj, nativeResource) {
  const ret = retObj
  ret.skypeguid = nativeResource.skypeguid
  return ret
}
exports.formatSignalFlamingoResource = formatSignalFlamingoResource
function formatMessageResource(nativeResource) {
  switch (nativeResource.messagetype) {
    case 'RichText/UriObject':
      // tslint:disable-next-line:max-line-length
      return formatUriObjectResource(
        formatFileResource(
          formatGenericMessageResource(nativeResource, nativeResource.messagetype),
          nativeResource
        ),
        nativeResource
      )
    case 'RichText/Media_Video':
      // tslint:disable-next-line:max-line-length
      return formatMediaVideoResource(
        formatFileResource(
          formatGenericMessageResource(nativeResource, nativeResource.messagetype),
          nativeResource
        ),
        nativeResource
      )
    case 'RichText/Media_GenericFile':
      // tslint:disable-next-line:max-line-length
      return formatMediaGenericFileResource(
        formatFileResource(
          formatGenericMessageResource(nativeResource, nativeResource.messagetype),
          nativeResource
        ),
        nativeResource
      )
    case 'RichText/Location':
      // tslint:disable-next-line:max-line-length
      return formatLocationResource(
        formatGenericMessageResource(nativeResource, nativeResource.messagetype),
        nativeResource
      )
    case 'Event/Call':
      // tslint:disable-next-line:max-line-length
      return formatEventCallResource(
        formatGenericMessageResource(nativeResource, nativeResource.messagetype),
        nativeResource
      )
    case 'RichText':
      // tslint:disable-next-line:max-line-length
      return formatRichTextResource(
        formatGenericMessageResource(nativeResource, nativeResource.messagetype),
        nativeResource
      )
    case 'Text':
      // tslint:disable-next-line:max-line-length
      return formatTextResource(
        formatGenericMessageResource(nativeResource, nativeResource.messagetype),
        nativeResource
      )
    case 'Control/ClearTyping':
      // tslint:disable-next-line:max-line-length
      return formatControlClearTypingResource(
        formatGenericMessageResource(nativeResource, nativeResource.messagetype),
        nativeResource
      )
    case 'Control/Typing':
      // tslint:disable-next-line:max-line-length
      return formatControlTypingResource(
        formatGenericMessageResource(nativeResource, nativeResource.messagetype),
        nativeResource
      )
    case 'Signal/Flamingo': // incoming call request
      // tslint:disable-next-line:max-line-length
      return formatSignalFlamingoResource(
        formatGenericMessageResource(nativeResource, nativeResource.messagetype),
        nativeResource
      )
    default:
      // tslint:disable-next-line:max-line-length
      throw new Error(
        `Unknown ressource.messageType (${JSON.stringify(
          nativeResource.messagetype
        )}) for resource:\n${JSON.stringify(nativeResource, null, '\t')}`
      )
  }
}
function formatFileResource(retObj, native) {
  const ret = retObj
  const $ = cheerio_1.default.load(native.content)
  const obj = $('URIObject')
  ret.uri_type = obj.attr('type')
  ret.uri = obj.attr('uri')
  ret.uri_thumbnail = obj.attr('url_thumbnail')
  ret.uri_w_login = $(obj.find('a')).attr('href')
  const sizeString = $(obj.find('FileSize')).attr('v')
  if (sizeString !== undefined) {
    ret.file_size = parseInt(sizeString, 10)
  }
  ret.original_file_name = $(obj.find('OriginalName')).attr('v')
  return ret
}
// tslint:disable-next-line:max-line-length
function formatMediaGenericFileResource(retObj, native) {
  const ret = retObj
  return ret
}
// tslint:disable-next-line:max-line-length
function formatMediaVideoResource(retObj, native) {
  const ret = retObj
  return ret
}
// tslint:disable-next-line:max-line-length
function formatUriObjectResource(retObj, native) {
  const ret = retObj
  return ret
}
// tslint:disable-next-line:max-line-length
function formatLocationResource(retObj, native) {
  const ret = retObj
  const $ = cheerio_1.default.load(native.content)
  const obj = $('location')
  ret.latitude = parseInt(obj.attr('latitude'), 10)
  ret.longitude = parseInt(obj.attr('longitude'), 10)
  ret.altitude = parseInt(obj.attr('altitude'), 10)
  ret.speed = parseInt(obj.attr('speed'), 10)
  ret.course = parseInt(obj.attr('course'), 10)
  ret.address = obj.attr('address')
  ret.pointOfInterest = obj.attr('pointOfInterest')
  ret.map_url = $(obj.find('a')).attr('href')
  return ret
}
// tslint:disable-next-line:max-line-length
function formatEventCallResource(retObj, native) {
  const ret = retObj
  const $ = cheerio_1.default.load(native.content)
  const type = $('partlist').attr('type')
  if (type === 'started') {
    ret.event_type = type
  } else if (type === 'ended') {
    ret.event_type = type
  } else if (type === 'missed') {
    ret.event_type = type
  } else {
    throw new Error(`Unknown call state of: ${type}`)
  }
  let shortest = null
  let connected = false
  const participants = []
  const parts = $('part').toArray()
  for (const part of parts) {
    const pjs = $(part)
    const add = {
      displayName: pjs.find('name').text(),
      username: pjs.attr('identity'),
    }
    const duration = pjs.find('duration').text()
    if (duration !== undefined && duration !== '') {
      add.duration = parseInt(duration, 10)
      if (add.duration > 0) {
        connected = true
        if (shortest === null || add.duration < shortest) {
          shortest = add.duration
        }
      }
    }
    participants.push(add)
  }
  ret.participants = participants
  ret.call_connected = connected || participants.length > 1
  if (shortest !== null) {
    ret.duration = shortest
  }
  return ret
}
function formatEventMessage(native) {
  let resource
  switch (native.resourceType) {
    case 'UserPresence':
      resource = null
      break
    case 'EndpointPresence':
      resource = null
      break
    case 'ConversationUpdate':
      resource = formatConversationUpdateResource(native.resource)
      break
    case 'NewMessage':
      resource = formatMessageResource(native.resource)
      break
    default:
      // tslint:disable-next-line:max-line-length
      throw new Error(
        `Unknown EventMessage.resourceType (${JSON.stringify(
          native.resourceType
        )}) for Event:\n${JSON.stringify(native)}`
      )
  }
  return {
    id: native.id,
    type: native.type,
    resourceType: native.resourceType,
    time: new Date(native.time),
    resourceLink: native.resourceLink,
    resource,
  }
}
class MessagesPoller extends events_1.default.EventEmitter {
  constructor(io, apiContext) {
    super()
    this.io = io
    this.apiContext = apiContext
    this.intervalId = null
  }
  isActive() {
    return this.intervalId !== null
  }
  run() {
    if (this.isActive()) {
      return this
    }
    this.intervalId = setInterval(this.getMessages.bind(this), POLLING_DELAY)
    return this
  }
  stop() {
    if (!this.isActive()) {
      return this
    }
    clearInterval(this.intervalId)
    this.intervalId = null
    return this
  }
  /**
   * Get the new messages / events from the server.
   * This function always returns a successful promise once the messages are retrieved or an error happens.
   *
   * If any error happens, the message-poller will emit an `error` event with the error.
   */
  async getMessages() {
    try {
      const requestOptions = {
        // TODO: explicitly define user, endpoint and subscription
        uri: messagesUri.poll(this.apiContext.registrationToken.host),
        cookies: this.apiContext.cookies,
        headers: {
          RegistrationToken: this.apiContext.registrationToken.raw,
        },
      }
      const res = await this.io.post(requestOptions)
      if (res.statusCode !== 200) {
        const cause = http_1.UnexpectedHttpStatusError.create(res, new Set([200]), requestOptions)
        this.emit('error', incident_1.Incident(cause, 'poll', 'Unable to poll the messages'))
        return
      }
      const body = JSON.parse(res.body)
      if (body.eventMessages !== undefined) {
        for (const msg of body.eventMessages) {
          // tslint:disable-next-line:max-line-length
          // if (msg.resourceType != "UserPresence" && msg.resourceType != "EndpointPresence" && msg.resourceType != "ConversationUpdate")
          //  console.log("EVT: " + JSON.stringify(msg, null, "\t"));
          const formatted = formatEventMessage(msg)
          if (formatted.resource !== null) {
            this.emit('event-message', formatted)
          }
        }
      }
    } catch (err) {
      this.emit(
        'error',
        incident_1.Incident(err, 'poll', 'An error happened while processing the polled messages')
      )
    }
  }
}
exports.MessagesPoller = MessagesPoller
//# sourceMappingURL=messages-poller.js.map
