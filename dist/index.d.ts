export declare type Dictionary<T> = {
    [key: string]: T;
};
export declare var keys: Dictionary<string>;
export declare function register(text: Dictionary<Dictionary<string>>): void;
