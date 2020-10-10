import fs from 'fs'
import path from 'path'
import readline from 'readline'
import { Api as SkypeApi } from '../lib/api'
import * as skypeHttp from '../lib/connect'
import { Credentials } from '../lib/interfaces/api/api'
import { Context } from '../lib/interfaces/api/context'
import * as events from '../lib/interfaces/api/events'
import * as resources from '../lib/interfaces/api/resources'
import { Contact } from '../lib/types/contact'
import meta from './meta.js'

/**
 * Command line interface prompt for the user credentials
 */
async function promptCredentials(): Promise<Credentials> {
  const cliInterface: readline.ReadLine = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const username: string = await new Promise<string>(
    (resolve: (res: string) => void, reject: (err: any) => void): void => {
      cliInterface.question('Username? ', resolve)
    }
  )

  const password: string = await new Promise<string>(
    (resolve: (res: string) => void, reject: (err: any) => void): void => {
      cliInterface.question('Password? ', resolve)
    }
  )

  const result: Promise<Credentials> = new Promise(
    (resolve: (res: Credentials) => void, reject: (err: Error) => void): void => {
      cliInterface.once('error', (err: Error): void => {
        reject(err)
      })
      cliInterface.once('close', (): void => {
        resolve({ username, password })
      })
    }
  )

  cliInterface.close()
  return result
}

async function runExample(): Promise<void> {
  const statePath: string = path.resolve(meta.dirname, 'api-state.json')
  let api: SkypeApi
  try {
    const stateContent: string = fs.readFileSync(statePath).toString('utf8')
    const apiContext: Context.Json = JSON.parse(stateContent)
    api = await skypeHttp.connect({ state: apiContext, verbose: true })
    await api.getContacts() // Try a request, to check that the state is correctly restored.
    console.log(`Restored state from ${statePath}`)
  } catch (err) {
    console.log('Unable to restore the state from file, performing login with credentials')
    const credentials: Credentials = await promptCredentials()
    api = await skypeHttp.connect({ credentials, verbose: true })
  }

  const apiState: Context.Json = api.getState()
  fs.writeFileSync(statePath, JSON.stringify(apiState), 'utf8')
  console.log(`Saved state in the file: ${statePath}`)

  // Log every event
  api.on('event', (ev: events.EventMessage) => {
    console.log(JSON.stringify(ev, null, 2))
  })

  // Log every error
  api.on('error', (err: Error) => {
    console.error('An error was detected:')
    console.error(err)
  })

  // tslint:disable-next-line:typedef
  const onMessage = (resource: resources.TextResource): void => {
    if (resource.from.username === api.context.username) {
      return
    }

    console.log('Received text:')
    console.log(resource.content)
    const response: string = `Hi! You said "${resource.content}". skype-http works!`
    console.log(`Responding to conversation ${resource.conversation}`)
    console.log(response)
    api.sendMessage({ textContent: response }, resource.conversation).catch(console.error)
  }

  api.on('Text', onMessage)
  api.on('RichText', onMessage)

  const contacts: Contact[] = await api.getContacts()
  console.log('Your contacts:')
  console.log(JSON.stringify(contacts, null, 2))

  console.log('Starting polling:')
  await api.listen()
  await api.setStatus('Online')
  console.log('Ready')

  // Check if the Skype Bot, and Skype Echo are already added as contacts
  console.log('Adding Skype bot as contact')
  const skypeTranslatorBot: string = '0d5d6cff-595d-49d7-9cf8-973173f5233b'
  const addBot: boolean = await api.addBotToContact(skypeTranslatorBot)
  if (addBot) {
    console.log('Removing Skype bot from contacts')
    await api.removeBotFromContacts(skypeTranslatorBot)
  }

  console.log('Adding Skype Echo as contact')
  const echoSoundTest: string = '8:echo123'
  const wasContactAdded: boolean = await api.addUserAsContact(echoSoundTest)
  if (wasContactAdded) {
    console.log('Removing Skype Echo from contacts')
    await api.removeUserFromContacts(echoSoundTest)
  }

  console.log('Searching Skype directory')
  const searchResults: String = await api.searchSkypeDirectory('testing')
  console.log(searchResults)
}

runExample().catch((err: Error): never => {
  console.error(err.stack)
  return process.exit(1) as never
})
