import * as dotenv from 'dotenv'
import { connect }  from '../lib/connect'

dotenv.config()

const username = process.env.SKYPE_LOGIN || ''
const password = process.env.SKYPE_PASSWORD || ''

const credentials = {
  username,
  password,
}

let api
let users
let conversations
let myId

async function initSkype() {
  api = await connect({ credentials })

  myId = api.context.username
  users = await api.getContacts()
  conversations = await api.getConversations()
}

initSkype()
