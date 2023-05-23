import { Migrator, MigrationManifest } from "./types";
export declare function createMigrate(migrations: MigrationManifest, options?: {
    debug: boolean;
}): Migrator;
