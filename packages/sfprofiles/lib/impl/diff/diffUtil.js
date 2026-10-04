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
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const _ = __importStar(require("lodash"));
const metadataFiles_1 = __importDefault(require("../metadata/metadataFiles"));
const metadataInfo_1 = require("../metadata/metadataInfo");
const metadataInfo_2 = require("../metadata/metadataInfo");
const sfp_logger_1 = __importStar(require("@flxbl-io/sfp-logger"));
const simple_git_1 = require("simple-git");
const SEP = /\/|\\/;
const git = (0, simple_git_1.simpleGit)();
class DiffUtil {
    static async isFormulaField(diffFile) {
        let content = await git.show(['--raw', diffFile.revisionFrom]);
        let result = content.includes('<formula>');
        return result;
    }
    static async fetchFileListRevisionTo(revisionTo) {
        sfp_logger_1.default.log('Fetching file list from target revision ' + revisionTo, sfp_logger_1.LoggerLevel.INFO);
        DiffUtil.gitTreeRevisionTo = [];
        let revisionTree = await git.raw(['ls-tree', '-r', revisionTo]);
        const sepRegex = /\n|\r/;
        let lines = revisionTree.split(sepRegex);
        for (let i = 0; i < lines.length; i++) {
            if (lines[i] === '')
                continue;
            let fields = lines[i].split(/\t/);
            let pathStr = fields[1];
            let revisionSha = fields[0].split(/\s/)[2];
            let oneFIle = {
                revision: revisionSha,
                path: path.join('.', pathStr),
            };
            DiffUtil.gitTreeRevisionTo.push(oneFIle);
        }
        return DiffUtil.gitTreeRevisionTo;
    }
    static async getRelativeFiles(filePath) {
        let relativeFiles = [];
        let filePathParts = filePath.split(SEP);
        const statResourcesRegExp = new RegExp(metadataInfo_2.METADATA_INFO.StaticResource.directoryName);
        const experienceBundleRegExp = new RegExp(metadataInfo_2.METADATA_INFO.ExperienceBundle.directoryName);
        const auraRegExp = new RegExp(metadataInfo_2.METADATA_INFO.AuraDefinitionBundle.directoryName);
        const lwcRegExp = new RegExp(metadataInfo_2.METADATA_INFO.LightningComponentBundle.directoryName);
        if (filePath.endsWith('Translation-meta.xml') && filePath.indexOf('globalValueSet') < 0) {
            let parentFolder = filePathParts[filePathParts.length - 2];
            let objectTranslation = parentFolder + metadataInfo_2.METADATA_INFO.CustomObjectTranslation.sourceExtension;
            DiffUtil.gitTreeRevisionTo.forEach((file) => {
                //copy objectTranslation if fieldTranslation changes
                if (file.path === filePath || file.path.endsWith(objectTranslation)) {
                    relativeFiles.push(file);
                }
            });
        }
        else if (statResourcesRegExp.test(filePath) ||
            experienceBundleRegExp.test(filePath) ||
            auraRegExp.test(filePath) ||
            lwcRegExp.test(filePath)) {
            // handle static recources
            let baseFile = '';
            for (let i = 0; i < filePathParts.length; i++) {
                baseFile = path.join(baseFile, filePathParts[i]);
                if (filePathParts[i] === metadataInfo_2.METADATA_INFO.StaticResource.directoryName ||
                    filePathParts[i] === metadataInfo_2.METADATA_INFO.ExperienceBundle.directoryName ||
                    filePathParts[i] === metadataInfo_2.METADATA_INFO.AuraDefinitionBundle.directoryName ||
                    filePathParts[i] === metadataInfo_2.METADATA_INFO.LightningComponentBundle.directoryName) {
                    let fileOrDirname = filePathParts[i + 1];
                    if (metadataInfo_1.SOURCE_EXTENSION_REGEX.test(fileOrDirname)) {
                        fileOrDirname = fileOrDirname.replace(metadataInfo_1.SOURCE_EXTENSION_REGEX, '');
                    }
                    else {
                        let extension = path.parse(fileOrDirname).ext;
                        fileOrDirname = fileOrDirname.replace(extension, '');
                    }
                    baseFile = path.join(baseFile, fileOrDirname);
                    break;
                }
            }
            DiffUtil.gitTreeRevisionTo.forEach((file) => {
                let fileToCompare = file.path;
                if (fileToCompare.startsWith(baseFile)) {
                    relativeFiles.push(file);
                }
            });
        }
        else {
            let baseFile = filePath;
            if (metadataInfo_1.SOURCE_EXTENSION_REGEX.test(filePath)) {
                baseFile = filePath.replace(metadataInfo_1.SOURCE_EXTENSION_REGEX, '');
            }
            else {
                let extension = path.parse(filePath).ext;
                baseFile = filePath.replace(extension, '');
            }
            DiffUtil.gitTreeRevisionTo.forEach((file) => {
                let fileToCompare = file.path;
                if (metadataInfo_1.SOURCE_EXTENSION_REGEX.test(fileToCompare)) {
                    fileToCompare = fileToCompare.replace(metadataInfo_1.SOURCE_EXTENSION_REGEX, '');
                }
                else {
                    let extension = path.parse(fileToCompare).ext;
                    fileToCompare = fileToCompare.replace(extension, '');
                }
                if (baseFile === fileToCompare) {
                    relativeFiles.push(file);
                }
            });
        }
        return relativeFiles;
    }
    static async copyFile(filePath, outputFolder) {
        sfp_logger_1.default.log(`Copying file ${filePath} from git to ${outputFolder}`, sfp_logger_1.LoggerLevel.INFO);
        if (fs.existsSync(path.join(outputFolder, filePath))) {
            sfp_logger_1.default.log(`File ${filePath}  already in output folder. `, sfp_logger_1.LoggerLevel.TRACE);
            return;
        }
        let gitFiles = await DiffUtil.getRelativeFiles(filePath);
        let copyOutputFolder = outputFolder;
        for (let i = 0; i < gitFiles.length; i++) {
            outputFolder = copyOutputFolder;
            let gitFile = gitFiles[i];
            sfp_logger_1.default.log(`Associated file ${i}: ${gitFile.path}  Revision: ${gitFile.revision}`, sfp_logger_1.LoggerLevel.TRACE);
            let outputPath = path.join(outputFolder, gitFile.path);
            let filePathParts = gitFile.path.split(SEP);
            if (fs.existsSync(outputFolder) == false) {
                fs.mkdirSync(outputFolder);
            }
            // Create folder structure
            for (let i = 0; i < filePathParts.length - 1; i++) {
                let folder = filePathParts[i].replace('"', '');
                outputFolder = path.join(outputFolder, folder);
                if (fs.existsSync(outputFolder) == false) {
                    fs.mkdirSync(outputFolder);
                }
            }
            let fileContent = await git.binaryCatFile(['-p', gitFile.revision]);
            fs.writeFileSync(outputPath, fileContent);
        }
    }
    static async parseContent(fileContents) {
        const statusRegEx = /\sA\t|\sM\t|\sD\t/;
        const renamedRegEx = /\sR[0-9]{3}\t|\sC[0-9]{3}\t/;
        const tabRegEx = /\t/;
        const deletedFileRegEx = new RegExp(/\sD\t/);
        const lineBreakRegEx = /\r?\n|\r|( $)/;
        let metadataFiles = new metadataFiles_1.default();
        let diffFile = {
            deleted: [],
            addedEdited: [],
        };
        for (let i = 0; i < fileContents.length; i++) {
            if (statusRegEx.test(fileContents[i])) {
                let lineParts = fileContents[i].split(statusRegEx);
                let finalPath = path.join('.', lineParts[1].replace(lineBreakRegEx, ''));
                finalPath = finalPath.trim();
                finalPath = finalPath.replace('\\303\\251', 'é');
                if (!(await metadataFiles.isInModuleFolder(finalPath))) {
                    continue;
                }
                if (!metadataFiles.accepts(finalPath)) {
                    continue;
                }
                let revisionPart = lineParts[0].split(/\t|\s/);
                if (deletedFileRegEx.test(fileContents[i])) {
                    //Deleted
                    diffFile.deleted.push({
                        revisionFrom: revisionPart[2].substring(0, 9),
                        revisionTo: revisionPart[3].substring(0, 9),
                        path: finalPath,
                    });
                }
                else {
                    // Added or edited
                    diffFile.addedEdited.push({
                        revisionFrom: revisionPart[2].substring(0, 9),
                        revisionTo: revisionPart[3].substring(0, 9),
                        path: finalPath,
                    });
                }
            }
            else if (renamedRegEx.test(fileContents[i])) {
                let lineParts = fileContents[i].split(renamedRegEx);
                let paths = lineParts[1].trim().split(tabRegEx);
                let finalPath = path.join('.', paths[1].trim());
                finalPath = finalPath.replace('\\303\\251', 'é');
                let revisionPart = lineParts[0].split(/\t|\s/);
                if (!(await metadataFiles.isInModuleFolder(finalPath))) {
                    continue;
                }
                if (!metadataFiles.accepts(paths[0].trim())) {
                    continue;
                }
                diffFile.addedEdited.push({
                    revisionFrom: '0000000',
                    revisionTo: revisionPart[3],
                    renamedPath: path.join('.', paths[0].trim()),
                    path: finalPath,
                });
                //allow deletion of renamed components
                diffFile.deleted.push({
                    revisionFrom: revisionPart[2],
                    revisionTo: '0000000',
                    path: paths[0].trim(),
                });
            }
        }
        return diffFile;
    }
    static getChangedOrAdded(list1, list2, key) {
        let result = {
            addedEdited: [],
            deleted: [],
        };
        //Ensure array
        if (!_.isNil(list1) && !Array.isArray(list1)) {
            list1 = [list1];
        }
        if (!_.isNil(list2) && !Array.isArray(list2)) {
            list2 = [list2];
        }
        if (_.isNil(list1) && !_.isNil(list2) && list2.length > 0) {
            result.addedEdited.push(...list2);
        }
        if (_.isNil(list2) && !_.isNil(list1) && list1.length > 0) {
            result.deleted.push(...list1);
        }
        if (!_.isNil(list1) && !_.isNil(list2)) {
            list1.forEach((elem1) => {
                let found = false;
                for (let i = 0; i < list2.length; i++) {
                    let elem2 = list2[i];
                    if (elem1[key] === elem2[key]) {
                        //check if edited
                        if (!_.isEqual(elem1, elem2)) {
                            result.addedEdited.push(elem2);
                        }
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    result.deleted.push(elem1);
                }
            });
            //Check for added elements
            let addedElement = _.differenceWith(list2, list1, function (element1, element2) {
                return element1[key] === element2[key];
            });
            if (!_.isNil(addedElement)) {
                result.addedEdited.push(...addedElement);
            }
        }
        return result;
    }
    static addMemberToPackage(packageObj, name, member) {
        let typeIsPresent = false;
        for (let i = 0; i < packageObj.length; i++) {
            if (packageObj[i].name === name) {
                typeIsPresent = true;
                if (!packageObj[i].members.includes(member)) {
                    packageObj[i].members.push(member);
                }
                break;
            }
        }
        let typeNode;
        if (typeIsPresent === false) {
            typeNode = {
                name: name,
                members: [member],
            };
            packageObj.push(typeNode);
        }
        return packageObj;
    }
}
exports.default = DiffUtil;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZlV0aWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvaW1wbC9kaWZmL2RpZmZVdGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBNkI7QUFDN0IsNkNBQStCO0FBQy9CLDBDQUE0QjtBQUU1QixpRkFBeUQ7QUFDekQsOERBQXFFO0FBQ3JFLDhEQUE0RDtBQUM1RCxtRUFBNkQ7QUFDN0QsNERBQWtEO0FBQ2xELE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQztBQWNwQixNQUFNLEdBQUcsR0FBYyxJQUFBLG9CQUFTLEdBQUUsQ0FBQztBQUVuQyxNQUFxQixRQUFRO0lBS2xCLE1BQU0sQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQXdCO1FBQ3ZELElBQUksT0FBTyxHQUFHLE1BQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztRQUMvRCxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzNDLE9BQU8sTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFFTSxNQUFNLENBQUMsS0FBSyxDQUFDLHVCQUF1QixDQUFDLFVBQWtCO1FBQzFELG9CQUFTLENBQUMsR0FBRyxDQUFDLDBDQUEwQyxHQUFHLFVBQVUsRUFBRSx3QkFBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pGLFFBQVEsQ0FBQyxpQkFBaUIsR0FBRyxFQUFFLENBQUM7UUFDaEMsSUFBSSxZQUFZLEdBQUcsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ2hFLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQztRQUN6QixJQUFJLEtBQUssR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FB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
