import { LoggerLevel } from '@flxbl-io/sfp-logger';
export declare class Sfpowerkit {
    private static defaultFolder;
    private static projectDirectories;
    private static pluginConfig;
    static isJsonFormatEnabled: boolean;
    private static sourceApiVersion;
    private static cache;
    static enableColor(): void;
    static disableColor(): void;
    static resetCache(): void;
    static initCache(): void;
    static getFromCache(key: string): any;
    static addToCache(key: string, value: any): any;
    static setLogLevel(logLevel: string, isJsonFormatEnabled: boolean): void;
    static setProjectDirectories(packagedirectories: string[]): void;
    static getProjectDirectories(): Promise<string[]>;
    static getDefaultFolder(): Promise<string>;
    static setDefaultFolder(defaultFolder: string): void;
    static getConfig(): Promise<any>;
    static setapiversion(apiversion: any): void;
    static getApiVersion(): Promise<any>;
    /**
     * Print log only if the log level for this commamnd matches the log level for the message
     * @param message Message to print
     * @param messageLoglevel Log level for the message
     */
    static log(message: any, logLevel: LoggerLevel): void;
}
//# sourceMappingURL=sfpowerkit.d.ts.map