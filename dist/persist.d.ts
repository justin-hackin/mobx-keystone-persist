import { Migrator, VersionCode } from "./types";
export interface IArgs {
    (name: string, store: any, options?: IOptions): Promise<void>;
}
export interface IOptions {
    version?: VersionCode;
    storage?: any;
    jsonify?: boolean;
    readonly whitelist?: Array<string>;
    readonly blacklist?: Array<string>;
    migrate?: Migrator;
    throttle?: number;
}
export declare const persist: IArgs;
