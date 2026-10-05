"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLOR_KEY_VALUE = exports.COLOR_KEY_MESSAGE = exports.COLOR_TIME = exports.COLOR_SUCCESS = exports.COLOR_HEADER = exports.COLOR_DEBUG = exports.COLOR_TRACE = exports.COLOR_INFO = exports.COLOR_WARNING = exports.COLOR_ERROR = exports.FileLogger = exports.VoidLogger = exports.ConsoleLogger = exports.LoggerType = exports.LoggerLevel = void 0;
const fs = __importStar(require("fs-extra"));
const os_1 = require("os");
const chalk = require("chalk");
var LoggerLevel;
(function (LoggerLevel) {
    LoggerLevel[LoggerLevel["TRACE"] = 10] = "TRACE";
    LoggerLevel[LoggerLevel["DEBUG"] = 20] = "DEBUG";
    LoggerLevel[LoggerLevel["INFO"] = 30] = "INFO";
    LoggerLevel[LoggerLevel["WARN"] = 40] = "WARN";
    LoggerLevel[LoggerLevel["ERROR"] = 50] = "ERROR";
    LoggerLevel[LoggerLevel["FATAL"] = 60] = "FATAL";
    LoggerLevel[LoggerLevel["HIDE"] = 70] = "HIDE";
})(LoggerLevel || (exports.LoggerLevel = LoggerLevel = {}));
var LoggerType;
(function (LoggerType) {
    LoggerType[LoggerType["CONSOLE"] = 0] = "CONSOLE";
    LoggerType[LoggerType["FILE"] = 1] = "FILE";
    LoggerType[LoggerType["VOID"] = 2] = "VOID";
})(LoggerType || (exports.LoggerType = LoggerType = {}));
class ConsoleLogger {
    constructor() {
        this.logType = LoggerType.CONSOLE;
    }
    log(message, logLevel) {
        SFPLogger.log(message, logLevel);
    }
}
exports.ConsoleLogger = ConsoleLogger;
class VoidLogger {
    constructor() {
        this.logType = LoggerType.VOID;
    }
    log(message, logLevel) {
        // Do nothing
    }
}
exports.VoidLogger = VoidLogger;
class FileLogger {
    constructor(path) {
        this.path = path;
        this.logType = LoggerType.FILE;
    }
    log(message, logLevel) {
        message = message === null || message === void 0 ? void 0 : message.toString().replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
        fs.appendFileSync(this.path, message + os_1.EOL, 'utf8');
    }
}
exports.FileLogger = FileLogger;
exports.COLOR_ERROR = chalk.bold.red;
exports.COLOR_WARNING = chalk.keyword('orange');
exports.COLOR_INFO = chalk.white;
exports.COLOR_TRACE = chalk.gray;
exports.COLOR_DEBUG = chalk.blue;
exports.COLOR_HEADER = chalk.yellowBright.bold;
exports.COLOR_SUCCESS = chalk.green.bold;
exports.COLOR_TIME = chalk.magentaBright;
exports.COLOR_KEY_MESSAGE = chalk.magentaBright.bold;
exports.COLOR_KEY_VALUE = chalk.black.bold.bgGreenBright;
class SFPLogger {
    static enableColor() {
        chalk.level = 2;
    }
    static disableColor() {
        chalk.level = 0;
    }
    static log(message, logLevel = LoggerLevel.INFO, logger) {
        if (SFPLogger.isLogsDisabled)
            return;
        if (logLevel == null)
            logLevel = LoggerLevel.INFO;
        if (logLevel < this.logLevel)
            return;
        if (logger) {
            logger.log(message, logLevel);
        }
        else {
            SFPLogger.consoleLog(message, logLevel);
        }
    }
    static consoleLog(message, logLevel) {
        switch (logLevel) {
            case LoggerLevel.TRACE:
                console.log((0, exports.COLOR_TRACE)(message));
                break;
            case LoggerLevel.DEBUG:
                console.log((0, exports.COLOR_DEBUG)(message));
                break;
            case LoggerLevel.INFO:
                console.log(message);
                break;
            case LoggerLevel.WARN:
                console.log((0, exports.COLOR_WARNING)(message));
                break;
            case LoggerLevel.ERROR:
                console.log((0, exports.COLOR_ERROR)(message));
                break;
        }
    }
    static disableLogs() {
        SFPLogger.isLogsDisabled = true;
    }
    static printHeaderLine(header, color, logLevel, logger) {
        if (SFPLogger.isLogsDisabled)
            return;
        if (header == null)
            header = '';
        const lineLength = 90;
        const leftPadLength = Math.floor((lineLength - header.length) / 2);
        const rightPadLength = lineLength - leftPadLength - header.length;
        const line = '-'.repeat(leftPadLength) + `${header}` + '-'.repeat(rightPadLength);
        if (logger) {
            logger.log(color(line), logLevel);
        }
        else {
            console.log(color(line));
        }
    }
}
SFPLogger.logLevel = LoggerLevel.INFO;
SFPLogger.isLogsDisabled = false;
exports.default = SFPLogger;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU0ZQTG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1NGUExvZ2dlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDZDQUErQjtBQUMvQiwyQkFBeUI7QUFDekIsK0JBQWdDO0FBRWhDLElBQVksV0FRWDtBQVJELFdBQVksV0FBVztJQUNuQixnREFBVSxDQUFBO0lBQ1YsZ0RBQVUsQ0FBQTtJQUNWLDhDQUFTLENBQUE7SUFDVCw4Q0FBUyxDQUFBO0lBQ1QsZ0RBQVUsQ0FBQTtJQUNWLGdEQUFVLENBQUE7SUFDViw4Q0FBUyxDQUFBO0FBQ2IsQ0FBQyxFQVJXLFdBQVcsMkJBQVgsV0FBVyxRQVF0QjtBQUVELElBQVksVUFJWDtBQUpELFdBQVksVUFBVTtJQUNsQixpREFBVyxDQUFBO0lBQ1gsMkNBQVEsQ0FBQTtJQUNSLDJDQUFRLENBQUE7QUFDWixDQUFDLEVBSlcsVUFBVSwwQkFBVixVQUFVLFFBSXJCO0FBUUQsTUFBYSxhQUFhO0lBQTFCO1FBQ1csWUFBTyxHQUFlLFVBQVUsQ0FBQyxPQUFPLENBQUM7SUFLcEQsQ0FBQztJQUhHLEdBQUcsQ0FBQyxPQUFlLEVBQUUsUUFBcUI7UUFDdEMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDckMsQ0FBQztDQUNKO0FBTkQsc0NBTUM7QUFFRCxNQUFhLFVBQVU7SUFBdkI7UUFDVyxZQUFPLEdBQWUsVUFBVSxDQUFDLElBQUksQ0FBQztJQUtqRCxDQUFDO0lBSEcsR0FBRyxDQUFDLE9BQWUsRUFBRSxRQUFxQjtRQUN0QyxhQUFhO0lBQ2pCLENBQUM7Q0FDSjtBQU5ELGdDQU1DO0FBRUQsTUFBYSxVQUFVO0lBR25CLFlBQW1CLElBQVk7UUFBWixTQUFJLEdBQUosSUFBSSxDQUFRO1FBRnhCLFlBQU8sR0FBZSxVQUFVLENBQUMsSUFBSSxDQUFDO0lBRVgsQ0FBQztJQUVuQyxHQUFHLENBQUMs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