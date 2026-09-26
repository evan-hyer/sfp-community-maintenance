import chalk = require('chalk');
export declare enum LoggerLevel {
    TRACE = 10,
    DEBUG = 20,
    INFO = 30,
    WARN = 40,
    ERROR = 50,
    FATAL = 60,
    HIDE = 70
}
export declare enum LoggerType {
    CONSOLE = 0,
    FILE = 1,
    VOID = 2
}
export interface Logger {
    logType: LoggerType | string;
    path?: string;
    log(message: string, logLevel: LoggerLevel): void;
}
export declare class ConsoleLogger implements Logger {
    logType: LoggerType;
    log(message: string, logLevel: LoggerLevel): void;
}
export declare class VoidLogger implements Logger {
    logType: LoggerType;
    log(message: string, logLevel: LoggerLevel): void;
}
export declare class FileLogger implements Logger {
    path: string;
    logType: LoggerType;
    constructor(path: string);
    log(message: string, logLevel: LoggerLevel): void;
}
export declare const COLOR_ERROR: chalk.Chalk;
export declare const COLOR_WARNING: chalk.Chalk;
export declare const COLOR_INFO: chalk.Chalk;
export declare const COLOR_TRACE: chalk.Chalk;
export declare const COLOR_DEBUG: chalk.Chalk;
export declare const COLOR_HEADER: chalk.Chalk;
export declare const COLOR_SUCCESS: chalk.Chalk;
export declare const COLOR_TIME: chalk.Chalk;
export declare const COLOR_KEY_MESSAGE: chalk.Chalk;
export declare const COLOR_KEY_VALUE: chalk.Chalk;
export default class SFPLogger {
    static logLevel: LoggerLevel;
    static isLogsDisabled: boolean;
    static enableColor(): void;
    static disableColor(): void;
    static log(message: string, logLevel?: LoggerLevel, logger?: Logger): void;
    private static consoleLog;
    static disableLogs(): void;
    static printHeaderLine(header: string, color: chalk.Chalk, logLevel: LoggerLevel, logger?: Logger): void;
}
//# sourceMappingURL=SFPLogger.d.ts.map