export declare type VersionCode = number;
export declare type AnySnapshot = Record<string, any>;
export declare type PersistedState = {
    version: VersionCode;
    snapshot: AnySnapshot;
};
export declare type Migrator = (state: Readonly<PersistedState>, version: VersionCode) => Promise<PersistedState>;
export declare type MigrationManifest = Record<VersionCode, Migration>;
export declare type Migration = (snapshot: Readonly<AnySnapshot>) => AnySnapshot | Promise<AnySnapshot>;
