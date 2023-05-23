import { AnySnapshot } from "./types";
export declare function isString(value: any): value is string;
export declare function isSnapshot(value: any): value is AnySnapshot;
export declare function isPromise(maybePromise: any): maybePromise is PromiseLike<any>;
