interface IAsyncLocalStorage {
    clear(): Promise<void>;
    getItem(key: string): Promise<string>;
    removeItem(key: string): Promise<void>;
    setItem(key: string, value: string): Promise<void>;
}
export declare const AsyncLocalStorage: IAsyncLocalStorage;
export default AsyncLocalStorage;
