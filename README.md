# Skype-Http

[![npm](https://img.shields.io/npm/v/skype-http-api.svg?maxAge=2592000)](https://www.npmjs.com/package/skype-http-api)
[![GitHub repository](https://img.shields.io/badge/Github-Toxblh%2Fskype--http--api-blue.svg)](https://github.com/Toxblh/skype-http-api)
[![Codecov](https://codecov.io/gh/Toxblh/skype-http-api/branch/master/graph/badge.svg)](https://codecov.io/gh/Toxblh/skype-http-api)
[![Build status](https://img.shields.io/travis/Toxblh/skype-http-api/master.svg?maxAge=2592000)](https://travis-ci.org/Toxblh/skype-http-api)
[![Greenkeeper badge](https://badges.greenkeeper.io/Toxblh/skype-http-api.svg)](https://greenkeeper.io/)

Unofficial Skype API for Node.js via HTTP.
This relies on the Skype Web Application and requires the credentials of the account you want to use: use it with care.

## Installation

- Stable version:

  ```shell
  npm install --save skype-http-api
  ```

Import for Typescript or Javascript ES6:

```typescript
import * as skypeHttp from 'skype-http-api'
```

Import for Javascript ES5:

```javascript
var skypeHttp = require('skype-http-api')
```

## Quick start

The code below sends `Hello, World!` to all of `bob`'s contacts. If bob's skype account was an MSA account(rather than older skype login) he would login with "bob@bobsdomain.com".

```typescript
import { Api, connect } from 'skype-http-api'

async function run() {
  const api: Api = await connect({
    credentials: { username: 'bob', password: 'hunter2' },
  })
  for (const contact of await api.getContacts()) {
    await api.sendMessage({ textContent: 'Hello, World!' }, contact.mri)
  }
}

run()
```

## Running example

The demo will prompt you your username and password: you should use your Skype account or MSA.

```shell
git clone https://github.com/Toxblh/skype-http-api
cd skype-http-api
# Ensure that you have the latest versions of the global dependencies
sudo npm install -g gulp-cli
npm install
npm start
```

This will perform a verbose connection (it should log the acquisition of various tokens), display the list of contacts,
set the status to `"Online"` and start to respond to messages.

Fork repo https://github.com/ocilo/skype-http
