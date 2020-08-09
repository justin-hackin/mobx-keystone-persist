# Migration Example

### Example with createMigrate
```ts
import { createMigrate, persist, MigrationManifest } from 'mobx-keystone-persist'

const migrations: MigrationManifest = {
  0: snapshot => {
    // migration clear out device state
    return {
      ...snapshot,
      device: undefined   
    }
  },
  1: snapshot => {
    // migration to keep only device state
    return {
      device: snapshot.device
    }
  }
}

persist('store', someStore, {
  version: 1,
  migrate: createMigrate(migrations)
}).then(() => console.log('someStore has been hydrated'))
```

### Alternative (advanced)
The migrate method can be any function with which returns a promise of a new persisted state. This method is always called when loading persisted state, so make sure to handle versioning yourself.

Note that a persisted state wraps a snapshot and contains the version code for that snapshot. Look at the source code for createMigrate for inspiration.

```ts
persist('store', someStore, {
  version: 1,
  migrate: async (state, currentVersion) => {
    console.log('Migration Running!')

    return {
      version: currentVersion,
      snapshot: {
        ...state.snapshot,
        // alter the snapshot somehow
      }
    }
  }
})
```