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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sfpowerkit = void 0;
const core_1 = require("@salesforce/core");
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs-extra"));
const sqlitekv_1 = __importDefault(require("./sqlitekv"));
const fileutils_1 = __importDefault(require("./fileutils"));
const sfp_logger_1 = __importDefault(require("@flxbl-io/sfp-logger"));
const node_cache_1 = __importDefault(require("node-cache"));
class Sfpowerkit {
    static enableColor() {
        chalk_1.default.level = 2;
    }
    static disableColor() {
        chalk_1.default.level = 0;
    }
    static resetCache() {
        const cachePath = fileutils_1.default.getLocalCachePath('sfpowerkit-cache.db');
        if (fs.existsSync(cachePath))
            fs.unlinkSync(cachePath);
    }
    static initCache() {
        try {
            //Set the cache path on init,
            //TODO: Move this to a temporary directory with randomization
            Sfpowerkit.cache = new sqlitekv_1.default(fileutils_1.default.getLocalCachePath('sfpowerkit-cache.db'));
            Sfpowerkit.cache.init();
        }
        catch (error) {
            //Fallback to NodeCache, as sqlite cache cant be lazily loaded
            //Retreive and Merge doesnt have workers so sqlite cant be loaded.. need further investigation
            Sfpowerkit.cache = new node_cache_1.default();
        }
    }
    static getFromCache(key) {
        return Sfpowerkit.cache.get(key);
    }
    static addToCache(key, value) {
        return Sfpowerkit.cache.set(key, value);
    }
    static setLogLevel(logLevel, isJsonFormatEnabled) {
        this.isJsonFormatEnabled = isJsonFormatEnabled ? true : false;
    }
    static setProjectDirectories(packagedirectories) {
        Sfpowerkit.projectDirectories = packagedirectories;
    }
    static async getProjectDirectories() {
        if (!Sfpowerkit.projectDirectories) {
            Sfpowerkit.projectDirectories = [];
            const dxProject = await core_1.SfProject.resolve();
            const project = await dxProject.retrieveSfProjectJson();
            const packages = (project.getPackageDirectoriesSync()) || [];
            packages.forEach((element) => {
                Sfpowerkit.projectDirectories.push(element.path);
                if (element.default) {
                    Sfpowerkit.defaultFolder = element.path;
                }
            });
        }
        return Sfpowerkit.projectDirectories;
    }
    static async getDefaultFolder() {
        if (!Sfpowerkit.defaultFolder) {
            await Sfpowerkit.getProjectDirectories();
        }
        return Sfpowerkit.defaultFolder;
    }
    static setDefaultFolder(defaultFolder) {
        Sfpowerkit.defaultFolder = defaultFolder;
    }
    static async getConfig() {
        if (!Sfpowerkit.pluginConfig) {
            const dxProject = await core_1.SfProject.resolve();
            const project = await dxProject.retrieveSfProjectJson();
            const plugins = project.get('plugins') || {};
            const sfpowerkitConfig = plugins['sfpowerkit'];
            Sfpowerkit.pluginConfig = sfpowerkitConfig || {};
        }
        return Sfpowerkit.pluginConfig;
    }
    static setapiversion(apiversion) {
        Sfpowerkit.sourceApiVersion = apiversion;
    }
    static async getApiVersion() {
        if (!Sfpowerkit.sourceApiVersion) {
            const dxProject = await core_1.SfProject.resolve();
            const project = await dxProject.retrieveSfProjectJson();
            Sfpowerkit.sourceApiVersion = project.get('sourceApiVersion');
        }
        return Sfpowerkit.sourceApiVersion;
    }
    /**
     * Print log only if the log level for this commamnd matches the log level for the message
     * @param message Message to print
     * @param messageLoglevel Log level for the message
     */
    static log(message, logLevel) {
        // TODO: Ensure usage of this logging mechanism is deprecated
        if (this.isJsonFormatEnabled)
            return;
        sfp_logger_1.default.log(message, logLevel);
    }
}
exports.Sfpowerkit = Sfpowerkit;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Zwb3dlcmtpdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9zZnBvd2Vya2l0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkNBQTZDO0FBQzdDLGtEQUEwQjtBQUMxQiw2Q0FBK0I7QUFDL0IsMERBQXdDO0FBQ3hDLDREQUFvQztBQUNwQyxzRUFBNkQ7QUFDN0QsNERBQW1DO0FBR25DLE1BQWEsVUFBVTtJQVNuQixNQUFNLENBQUMsV0FBVztRQUNkLGVBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ3BCLENBQUM7SUFFRCxNQUFNLENBQUMsWUFBWTtRQUNmLGVBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ3BCLENBQUM7SUFFTSxNQUFNLENBQUMsVUFBVTtRQUNwQixNQUFNLFNBQVMsR0FBRyxtQkFBUyxDQUFDLGlCQUFpQixDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDckUsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQztZQUN4QixFQUFFLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFTSxNQUFNLENBQUMsU0FBUztRQUNuQixJQUFJLENBQUM7WUFDRCw2QkFBNkI7WUFDN0IsNkRBQTZEO1lBQzdELFVBQVUsQ0FBQyxLQUFLLEdBQUcsSUFBSSxrQkFBYyxDQUFDLG1CQUFTLENBQUMsaUJBQWlCLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO1lBQzFGLFVBQVUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDNUIsQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDYiw4REFBOEQ7WUFDOUQsOEZBQThGO1lBQzlGLFVBQVUsQ0FBQyxLQUFLLEdBQUcsSUFBSSxvQkFBUyxFQUFFLENBQUM7UUFDdkMsQ0FBQztJQUNMLENBQUM7SUFFTSxNQUFNLENBQUMsWUFBWSxD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