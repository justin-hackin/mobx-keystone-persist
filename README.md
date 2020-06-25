# mobx-keystone-persist

[![npm version](https://badge.fury.io/js/mobx-keystone-persist.svg)](https://badge.fury.io/js/mobx-keystone-persist)
[![typings](https://img.shields.io/npm/types/mobx-keystone-persist.svg)](https://github.com/Phault/mobx-keystone-persist/blob/master/src/index.ts)
[![build status](https://img.shields.io/travis/Phault/mobx-keystone-persist/master.svg)](https://travis-ci.org/Phault/mobx-keystone-persist)
[![code coverage](https://img.shields.io/codecov/c/gh/Phault/mobx-keystone-persist/master.svg)](https://codecov.io/gh/Phault/mobx-keystone-persist)

Persist and hydrate [mobx-keystone](https://github.com/xaviergonz/mobx-keystone) stores.

## Installation

`npm i -S mobx-keystone-persist`

## Usage

```javascript
import { model, Model } from 'mobx-keystone'
import localForage from 'localForage'
import { persist } from 'mobx-keystone-persist'

@model('myApp/SomeStore')
class SomeStore extends Model({
    name: 'John Doe',
    age: 32
}) { }

const someStore = new SomeStore({})

persist('some', someStore, {
  storage: localForage,  // or AsyncStorage in react-native.
                         // default: localStorage
  jsonify: false  // if you use AsyncStorage, this shoud be true
                  // default: true
  whitelist: ['name']  // only these keys will be persisted
}).then(() => console.log('someStore has been hydrated'))

```

### API

#### `persist(key, store, options)`

- arguments

  - **key** _string_ The key of your storage engine that you want to persist to.
  - **store** _[mobx-keystone](https://github.com/xaviergonz/mobx-keystone) store_ The store to be persisted.
  - **options** _object_ Additional configuration options.
    - **storage** _[localForage](https://github.com/localForage/localForage) / [AsyncStorage](https://github.com/react-native-community/async-storage) / [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)_
      Any Storage Engine that has a Promise-style API similar to [`localForage`](https://github.com/localForage/localForage).
      The default is [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage), which has a built-in adaptor to make it support Promises.
      For React Native, one may configure [`AsyncStorage`](https://github.com/react-native-community/async-storage) instead.
      <br>
      Any of [`redux-persist`'s Storage Engines](https://github.com/rt2zz/redux-persist#storage-engines) should also be compatible with `mobx-keystone-persist`.
    - **jsonify** _bool_ Enables serialization as JSON (default: `true`).
    - **whitelist** _Array\<string\>_ Only these keys will be persisted (defaults to all keys).
    - **blacklist** _Array\<string\>_ These keys will not be persisted (defaults to all keys).

- returns a void Promise

### Node and Server-Side Rendering (SSR) Usage

Node environments are supported so long as you configure a Storage Engine that supports Node, such as [`redux-persist-node-storage`](https://github.com/pellejacobs/redux-persist-node-storage), [`redux-persist-cookie-storage`](https://github.com/abersager/redux-persist-cookie-storage), etc.
This allows you to hydrate your store server-side.

For SSR though, you may not want to hydrate your store server-side, so in that case you can call `persist` conditionally:

```javascript
if (typeof window !== 'undefined') { // window is undefined in Node
  persist(...)
}
```

With this conditional check, your store will only be hydrated client-side.

## How it works

Basically just a small wrapper around mobx-keystone's [`getSnapshot` and `applySnapshot`](https://mobx-keystone.js.org/snapshots).
The source code is currently shorter than this README, so [take a look under the hood](https://github.com/Phault/mobx-keystone-persist/tree/master/src)! :)

## Credits

A fork of [mst-persist](https://github.com/agilgur5/mst-persist) modified to use mobx-keystone instead of mobx-state-tree. I've barely had to touch the code due to how similar the libraries are, so credits goes to the original author [Anton Gilgur](https://github.com/agilgur5).

Inspiration for parts of the original code and API came from [`redux-persist`](https://github.com/rt2zz/redux-persist), [`mobx-persist`](https://github.com/pinqy520/mobx-persist), and [this MST persist PoC gist](https://gist.github.com/benjick/c48dd2db575e79c7b0b1043de4556ebc)
