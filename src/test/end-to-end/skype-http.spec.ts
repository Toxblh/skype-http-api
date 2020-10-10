import { Api } from '../../lib/api'
import * as SkypeHttp from '../../lib/connect'
import { Credentials } from '../../lib/interfaces/api/api'
import { testConfig } from '../test-config'

const mainAccount: Credentials = testConfig.credentials

describe('SkypeHttp', function () {
  // this.timeout(10 * 60 * 1000) // 10 minutes

  it('should connect to the main account through authentication', async function () {
    const api: Api = await SkypeHttp.connect({
      credentials: mainAccount,
      verbose: testConfig.verbose,
    })
    expect(api.context.username).toEqual(mainAccount.username)
  })
})
