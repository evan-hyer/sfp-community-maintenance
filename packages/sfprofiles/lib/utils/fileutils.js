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
exports.PLUGIN_CACHE_FOLDER = void 0;
const sfp_logger_1 = __importStar(require("@flxbl-io/sfp-logger"));
const fs = __importStar(require("fs-extra"));
const path = require('path');
const _ = require('lodash');
const os = require('os');
const SEP = /\/|\\/;
exports.PLUGIN_CACHE_FOLDER = 'sfpowerkit';
class FileUtils {
    /**
     * Delete file or directories recursively from the project
     * @param deletedComponents Files or directories to delete
     */
    static deleteComponents(deletedComponents) {
        deletedComponents.forEach((component) => {
            if (fs.existsSync(component)) {
                if (fs.lstatSync(component).isDirectory()) {
                    FileUtils.deleteFolderRecursive(component);
                }
                else {
                    fs.unlinkSync(component);
                }
            }
        });
    }
    /**
     * Load all files from the given folder with the given extension
     * @param folder the folder from which files wille be loaded
     * @param extension File extension to load.
     */
    static getAllFilesSync(folder, extension = '.xml') {
        let result = [];
        let pathExists = fs.existsSync(folder);
        let folderName = path.basename(folder);
        if (!pathExists) {
            sfp_logger_1.default.log('Folder not exists: ' + folderName, sfp_logger_1.LoggerLevel.ERROR);
            return result;
        }
        let content = fs.readdirSync(folder);
        content.forEach((file) => {
            let curFile = path.join(folder, file);
            let stats = fs.statSync(curFile);
            if (stats.isFile()) {
                if (extension.indexOf(path.extname(curFile)) != -1 || extension === '') {
                    result.push(curFile);
                }
            }
            else if (stats.isDirectory()) {
                let files = this.getAllFilesSync(curFile, extension);
                result = _.concat(result, files);
            }
        });
        return result;
    }
    static getGlobalCacheDir() {
        let homedir = os.homedir();
        let configDir = homedir + path.sep + exports.PLUGIN_CACHE_FOLDER;
        if (!fs.existsSync(configDir)) {
            sfp_logger_1.default.log('Config folder does not exists, Creating Folder', sfp_logger_1.LoggerLevel.INFO);
            fs.mkdirSync(configDir);
        }
        return configDir;
    }
    /**
     * Get the cache path for the given cache file name
     * @param fileName
     */
    static getGlobalCachePath(fileName) {
        let homedir = os.homedir();
        let configDir = homedir + path.sep + exports.PLUGIN_CACHE_FOLDER;
        if (!fs.existsSync(configDir)) {
            sfp_logger_1.default.log('Config folder does not exists, Creating Folder', sfp_logger_1.LoggerLevel.INFO);
            fs.mkdirSync(configDir);
        }
        return configDir + path.sep + fileName;
    }
    /**
     * Get the cache path for local working directory
     * @param fileName
     */
    static getLocalCachePath(fileName) {
        let configDir = path.join(process.cwd(), '.sfdx', 'sfpowerkit');
        if (!fs.existsSync(configDir)) {
            sfp_logger_1.default.log('Config folder does not exists, Creating Folder', sfp_logger_1.LoggerLevel.INFO);
            fs.ensureDirSync(configDir);
        }
        return configDir + path.sep + fileName;
    }
    /**
     * Create a folder path recursively
     * @param targetDir
     * @param param1
     */
    static mkDirByPathSync(targetDir, { isRelativeToScript = false } = {}) {
        const sep = path.sep;
        const initDir = path.isAbsolute(targetDir) ? sep : '';
        const baseDir = isRelativeToScript ? __dirname : '.';
        targetDir.split(sep).reduce((parentDir, childDir) => {
            const curDir = path.resolve(baseDir, parentDir, childDir);
            try {
                fs.mkdirSync(curDir);
            }
            catch (err) {
                if (err.code !== 'EEXIST' && err.code !== 'EPERM' && err.code !== 'EISDIR') {
                    throw err;
                }
            }
            return curDir;
        }, initDir);
    }
    /**
     * Get the file name withoud extension
     * @param filePath file path
     * @param extension extension
     */
    static getFileNameWithoutExtension(filePath, extension) {
        let fileParts = filePath.split(SEP);
        let fileName = fileParts[fileParts.length - 1];
        if (extension) {
            fileName = fileName.substr(0, fileName.lastIndexOf(extension));
        }
        else {
            fileName = fileName.substr(0, fileName.indexOf('.'));
        }
        return fileName;
    }
    /**
     * Copu folder recursively
     * @param src source folder to copy
     * @param dest destination folder
     */
    static copyRecursiveSync(src, dest) {
        let exists = fs.existsSync(src);
        if (exists) {
            let stats = fs.statSync(src);
            let isDirectory = stats.isDirectory();
            if (isDirectory) {
                exists = fs.existsSync(dest);
                if (!exists) {
                    fs.mkdirSync(dest);
                }
                fs.readdirSync(src).forEach(function (childItemName) {
                    FileUtils.copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
                });
            }
            else {
                fs.copyFileSync(src, dest);
            }
        }
    }
    /**
     * Get path to a given folder base on the parent folder
     * @param src  Parent folder
     * @param foldername folder to build the path to
     */
    static getFolderPath(src, foldername) {
        let exists = fs.existsSync(src);
        let toReturn = '';
        if (exists) {
            let stats = fs.statSync(src);
            let isDirectory = stats.isDirectory();
            if (isDirectory) {
                let childs = fs.readdirSync(src);
                for (let i = 0; i < childs.length; i++) {
                    let childItemName = childs[i];
                    if (childItemName === foldername) {
                        toReturn = path.join(src, childItemName);
                    }
                    else {
                        let childStat = fs.statSync(path.join(src, childItemName));
                        if (childStat.isDirectory()) {
                            toReturn = FileUtils.getFolderPath(path.join(src, childItemName), foldername);
                        }
                    }
                    if (toReturn !== '') {
                        break;
                    }
                }
            }
        }
        return toReturn;
    }
    /**
     * Delete a folder and its content recursively
     * @param folder folder to delete
     */
    static deleteFolderRecursive(folder) {
        if (fs.existsSync(folder)) {
            fs.readdirSync(folder).forEach(function (file, index) {
                let curPath = path.join(folder, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                    // recurse
                    //console.log("Delete recursively");
                    FileUtils.deleteFolderRecursive(curPath);
                }
                else {
                    // delete file
                    //console.log("Delete file "+ curPath);
                    fs.unlinkSync(curPath);
                }
            });
            //console.log("delete folder "+ folder);
            fs.rmdirSync(folder);
        }
    }
    static makefolderid(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
}
exports.default = FileUtils;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZXV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWxzL2ZpbGV1dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLG1FQUE2RDtBQUM3RCw2Q0FBOEI7QUFDOUIsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzdCLE1BQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUM1QixNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFFekIsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDO0FBRVAsUUFBQSxtQkFBbUIsR0FBRyxZQUFZLENBQUM7QUFFaEQsTUFBcUIsU0FBUztJQUMxQjs7O09BR0c7SUFDSSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsaUJBQTJCO1FBQ3RELGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsRUFBRSxFQUFFO1lBQ3BDLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO2dCQUMzQixJQUFJLEVBQUUsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztvQkFDeEMsU0FBUyxDQUFDLHFCQUFxQixDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUMvQyxDQUFDO3FCQUFNLENBQUM7b0JBQ0osRUFBRSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDN0IsQ0FBQztZQUNMLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFDRDs7OztPQUlHO0lBQ0ksTUFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFjLEVBQUUsU0FBUyxHQUFHLE1BQU07UUFDNUQsSUFBSSxNQUFNLEdBQWEsRUFBRSxDQUFDO1FBQzFCLElBQUksVUFBVSxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdkMsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2QyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDZCxvQkFBUyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsR0FBRyxVQUFVLEVBQUUsd0JBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNyRSxPQUFPLE1BQU0sQ0FBQztRQUNsQixDQUFDO1FBQ0QsSUFBSSxPQUFPLEdBQWEsRUFBRSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMvQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDckIsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdEMsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNqQyxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO2dCQUNqQixJQUFJLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLFNBQVMsS0FBSyxFQUFFLEVBQUUsQ0FBQztvQkFDckUsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDekIsQ0FBQztZQUNMLENBQUM7aUJBQU0sSUFBSSxLQUFLLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztnQkFDN0IsSUFBSSxLQUFLLEdBQWEsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQy9ELE1BQU0sR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNyQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLE1BQU0sQ0FBQztJQUNsQixDQUFDO0lBRU0sTUFBTSxDQUFDLGlCQUFpQjtRQUMzQixJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDM0IsSUFBSSxTQUFTLEdBQUcsT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsMkJBQW1CLENBQUM7UUFDekQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztZQUM1QixvQkFBUyxDQUFDLEdBQUcsQ0FBQyxnREFBZ0QsRUFBRSx3QkFBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xGLEVBQUUsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDNUIsQ0FBQztRQUVELE9BQU8sU0FBUyxDQUFDO0lBQ3JCLENBQUM7SUFFRDs7O09BR0c7SUFDSSxNQUFNLENBQUMsa0JBQWtCLENBQUMsUUFBZ0I7UUFDN0MsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzNCLElBQUksU0FBUyxHQUFHLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLDJCQUFtQixDQUFDO1FBQ3pELElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7WUFDNUIsb0JBQVMsQ0FBQyxHQUFHLENBQUMsZ0RBQWdELEVBQUUsd0JBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsRixFQUFFLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzVCLENBQUM7UUFDRCxPQUFPLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLFFBQVEsQ0FBQztJQUMzQyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0ssTUFBTSxDQUFDLGlCQUFpQixDQUFDLFFBQWdCO1FBRTdDLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFDLE9BQU8sRUFBQyxZQUFZLENBQUMsQ0FBQztRQUM5RCxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO1lBQzVCLG9CQUFTLENBQUMsR0FBRyxDQUFDLGdEQUFnRCxFQUFFLHdCQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEYsRUFBRSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNoQyxDQUFDO1FBQ0QsT0FBTyxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxRQUFRLENBQUM7SUFDM0MsQ0FBQztJQUVEOzs7O09BSUc7SUFDSSxNQUFNLENBQUMsZUFBZSxDQUFDLFNBQWlCLEVBQUUsRUFBRSxrQkFBa0IsR0FBRyxLQUFLLEVBQUUsR0FBRyxFQUFFO1FBQ2hGLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDckIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDdEQsTUFBTSxPQUFPLEdBQUcsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO1FBRXJELFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxFQUFFO1lBQ2hELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUMxRCxJQUFJLENBQUM7Z0JBQ0QsRUFBRSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN6QixDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDWCxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssT0FBTyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFLENBQUM7b0JBQ3pFLE1BQU0sR0FBRyxDQUFDO2dCQUNkLENBQUM7WUFDTCxDQUFDO1lBQ0QsT0FBTyxNQUFNLENBQUM7UUFDbEIsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ2hCLENBQUM7SUFDRDs7OztPQUlHO0lBQ0ksTUFBTSxDQUFDLDJCQUEyQixDQUFDLFFBQWdCLEVBQUUsU0FBa0I7UUFDMUUsSUFBSSxTQUFTLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNwQyxJQUFJLFFBQVEsR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztRQUMvQyxJQUFJLFNBQVMsRUFBRSxDQUFDO1lBQ1osUUFBUSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNuRSxDQUFDO2FBQU0sQ0FBQztZQUNKLFFBQVEsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDekQsQ0FBQztRQUNELE9BQU8sUUFBUSxDQUFDO0lBQ3BCLENBQUM7SUFFRDs7OztPQUlHO0lBQ0ksTUFBTSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxJQUFJO1FBQ3JDLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEMsSUFBSSxNQUFNLEVBQUUsQ0FBQztZQUNULElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDN0IsSUFBSSxXQUFXLEdBQUcsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3RDLElBQUksV0FBVyxFQUFFLENBQUM7Z0JBQ2QsTUFBTSxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDVixFQUFFLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN2QixDQUFDO2dCQUNELEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVUsYUFBYTtvQkFDL0MsU0FBUyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLGFBQWEsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7Z0JBQy9GLENBQUMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLEVBQUUsQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQy9CLENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQztJQUNEOzs7O09BSUc7SUFDSSxNQUFNLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxVQUFVO1FBQ3ZDLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEMsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBQ2xCLElBQUksTUFBTSxFQUFFLENBQUM7WUFDVCxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzdCLElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUN0QyxJQUFJLFdBQVcsRUFBRSxDQUFDO2dCQUNkLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2pDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQ3JDLElBQUksYUFBYSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDOUIsSUFBSSxhQUFhLEtBQUssVUFBVSxFQUFFLENBQUM7d0JBQy9CLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxhQUFhLENBQUMsQ0FBQztvQkFDN0MsQ0FBQzt5QkFBTSxDQUFDO3dCQUNKLElBQUksU0FBUyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQzt3QkFDM0QsSUFBSSxTQUFTLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQzs0QkFDMUIsUUFBUSxHQUFHLFNBQVMsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsYUFBYSxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7d0JBQ2xGLENBQUM7b0JBQ0wsQ0FBQztvQkFDRCxJQUFJLFFBQVEsS0FBSyxFQUFFLEVBQUUsQ0FBQzt3QkFDbEIsTUFBTTtvQkFDVixDQUFDO2dCQUNMLENBQUM7WUFDTCxDQUFDO1FBQ0wsQ0FBQztRQUNELE9BQU8sUUFBUSxDQUFDO0lBQ3BCLENBQUM7SUFFRDs7O09BR0c7SUFDSSxNQUFNLENBQUMscUJBQXFCLENBQUMsTUFBTTtRQUN0QyxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztZQUN4QixFQUFFLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFVLElBQUksRUFBRSxLQUFLO2dCQUNoRCxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDdEMsSUFBSSxFQUFFLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7b0JBQ3RDLFVBQVU7b0JBQ1Ysb0NBQW9DO29CQUNwQyxTQUFTLENBQUMscUJBQXFCLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzdDLENBQUM7cUJBQU0sQ0FBQztvQkFDSixjQUFjO29CQUNkLHVDQUF1QztvQkFDdkMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDM0IsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1lBQ0gsd0NBQXdDO1lBQ3hDLEVBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDekIsQ0FBQztJQUNMLENBQUM7SUFDTSxNQUFNLENBQUMsWUFBWSxDQUFDLE1BQU07UUFDN0IsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO1FBQ2hCLE1BQU0sVUFBVSxHQUFHLGdFQUFnRSxDQUFDO1FBQ3BGLElBQUksZ0JBQWdCLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQztRQUN6QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDOUIsTUFBTSxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1FBQzlFLENBQUM7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNsQixDQUFDO0NBQ0o7QUFoTkQsNEJBZ05DIn0=