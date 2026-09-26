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
const metadataInfo_1 = require("./metadataInfo");
const fileutils_1 = __importDefault(require("../../utils/fileutils"));
const lodash_1 = __importDefault(require("lodash"));
const ignore_1 = __importDefault(require("ignore"));
const fs = __importStar(require("fs-extra"));
const sfpowerkit_1 = require("../../utils/sfpowerkit");
const sfp_logger_1 = __importStar(require("@flxbl-io/sfp-logger"));
const glob_1 = require("glob");
const SEP = /\/|\\/;
class MetadataFiles {
    constructor() {
        if (fs.existsSync('.forceignore')) {
            this.forceignore = (0, ignore_1.default)().add(fs.readFileSync('.forceignore', 'utf8').toString());
        }
        else {
            this.forceignore = (0, ignore_1.default)();
        }
    }
    static getFullApiName(fileName) {
        let fullName = '';
        let metadateType = metadataInfo_1.MetadataInfo.getMetadataName(fileName);
        let splitFilepath = fileName.split(SEP);
        let isObjectChild = metadataInfo_1.METADATA_INFO.CustomObject.childXmlNames.includes(metadateType);
        if (isObjectChild) {
            let objectName = splitFilepath[splitFilepath.length - 3];
            let fieldName = splitFilepath[splitFilepath.length - 1].split('.')[0];
            fullName = objectName.concat('.' + fieldName);
        }
        else {
            fullName = splitFilepath[splitFilepath.length - 1].split('.')[0];
        }
        return fullName;
    }
    static getFullApiNameWithExtension(fileName) {
        let fullName = '';
        let metadateType = metadataInfo_1.MetadataInfo.getMetadataName(fileName);
        let splitFilepath = fileName.split(SEP);
        let isObjectChild = metadataInfo_1.METADATA_INFO.CustomObject.childXmlNames.includes(metadateType);
        if (isObjectChild) {
            let objectName = splitFilepath[splitFilepath.length - 3];
            let fieldName = splitFilepath[splitFilepath.length - 1];
            fullName = objectName.concat('.' + fieldName);
        }
        else {
            fullName = splitFilepath[splitFilepath.length - 1];
        }
        return fullName;
    }
    static isCustomMetadata(filepath, name) {
        let result = true;
        let splitFilepath = filepath.split(SEP);
        let componentName = splitFilepath[splitFilepath.length - 1];
        componentName = componentName.substring(0, componentName.indexOf('.'));
        if (name === metadataInfo_1.METADATA_INFO.CustomField.xmlName || name === metadataInfo_1.METADATA_INFO.CustomObject.xmlName) {
            //Custom Field or Custom Object
            result = componentName.endsWith('__c') || componentName.endsWith('__mdt');
        }
        return result;
    }
    static getMemberNameFromFilepath(filepath, name) {
        let member;
        let splitFilepath = filepath.split(SEP);
        let lastIndex = splitFilepath.length - 1;
        let isObjectChild = metadataInfo_1.METADATA_INFO.CustomObject.childXmlNames.includes(name);
        let metadataDescribe = metadataInfo_1.METADATA_INFO[name];
        if (isObjectChild) {
            let objectName = splitFilepath[lastIndex - 2];
            let fieldName = splitFilepath[lastIndex].split('.')[0];
            member = objectName.concat('.' + fieldName);
        }
        else if (metadataDescribe.inFolder) {
            let baseName = metadataDescribe.directoryName;
            let baseIndex = filepath.indexOf(baseName) + baseName.length;
            let cmpPath = filepath.substring(baseIndex + 1); // add 1 to remove the path seperator
            cmpPath = cmpPath.substring(0, cmpPath.indexOf('.'));
            member = cmpPath.replace(SEP, '/');
        }
        else {
            if (metadataInfo_1.SOURCE_EXTENSION_REGEX.test(splitFilepath[lastIndex])) {
                member = splitFilepath[lastIndex].replace(metadataInfo_1.SOURCE_EXTENSION_REGEX, '');
            }
            else {
                const auraRegExp = new RegExp('aura');
                const lwcRegExp = new RegExp('lwc');
                const staticResourceRegExp = new RegExp('staticresources');
                const experienceBundleRegExp = new RegExp('experiences');
                if (auraRegExp.test(filepath) || lwcRegExp.test(filepath)) {
                    member = splitFilepath[lastIndex - 1];
                }
                else if (staticResourceRegExp.test(filepath)) {
                    //Return the fileName
                    let baseName = 'staticresources';
                    let baseIndex = filepath.indexOf(baseName) + baseName.length;
                    let cmpPath = filepath.substring(baseIndex + 1); // add 1 to remove the path seperator
                    member = cmpPath.split(SEP)[0];
                    let extension = path.parse(member).ext;
                    member = member.replace(new RegExp(extension + '$'), '');
                }
                else if (experienceBundleRegExp.test(filepath)) {
                    //Return the fileName
                    let baseName = 'experiences';
                    let baseIndex = filepath.indexOf(baseName) + baseName.length;
                    let cmpPath = filepath.substring(baseIndex + 1); // add 1 to remove the path seperator
                    member = cmpPath.split(SEP)[0];
                    let extension = path.parse(member).ext;
                    member = member.replace(new RegExp(extension + '$'), '');
                }
                else {
                    let extension = path.parse(splitFilepath[lastIndex]).ext;
                    member = splitFilepath[lastIndex].replace(new RegExp(extension + '$'), '');
                }
            }
        }
        return member;
    }
    loadComponents(srcFolder, checkIgnore = true) {
        let metadataFiles = fileutils_1.default.getAllFilesSync(srcFolder);
        let keys = Object.keys(metadataInfo_1.METADATA_INFO);
        if (Array.isArray(metadataFiles) && metadataFiles.length > 0) {
            metadataFiles.forEach((metadataFile) => {
                let found = false;
                for (let i = 0; i < keys.length; i++) {
                    let match = false;
                    if (metadataFile.endsWith(metadataInfo_1.METADATA_INFO[keys[i]].sourceExtension)) {
                        match = true;
                    }
                    else if (metadataInfo_1.METADATA_INFO[keys[i]].inFolder &&
                        metadataFile.endsWith(metadataInfo_1.METADATA_INFO[keys[i]].folderExtension)) {
                        match = true;
                    }
                    if (match) {
                        if (lodash_1.default.isNil(metadataInfo_1.METADATA_INFO[keys[i]].files)) {
                            metadataInfo_1.METADATA_INFO[keys[i]].files = [];
                            metadataInfo_1.METADATA_INFO[keys[i]].components = [];
                        }
                        if (!checkIgnore || (checkIgnore && this.accepts(metadataFile))) {
                            metadataInfo_1.METADATA_INFO[keys[i]].files.push(metadataFile);
                            let name = fileutils_1.default.getFileNameWithoutExtension(metadataFile, metadataInfo_1.METADATA_INFO[keys[i]].sourceExtension);
                            if (metadataInfo_1.METADATA_INFO[keys[i]].isChildComponent) {
                                let fileParts = metadataFile.split(SEP);
                                let parentName = fileParts[fileParts.length - 3];
                                if (keys[i] === 'CustomField' && parentName === 'Activity') {
                                    //Add Activity fiels on Task and Event for reconcile
                                    metadataInfo_1.METADATA_INFO[keys[i]].components.push('Task.' + name);
                                    metadataInfo_1.METADATA_INFO[keys[i]].components.push('Event.' + name);
                                }
                                name = parentName + '.' + name;
                            }
                            metadataInfo_1.METADATA_INFO[keys[i]].components.push(name);
                        }
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    const auraRegExp = new RegExp('aura');
                    if (auraRegExp.test(metadataFile) && metadataInfo_1.SOURCE_EXTENSION_REGEX.test(metadataFile)) {
                        if (lodash_1.default.isNil(metadataInfo_1.METADATA_INFO.AuraDefinitionBundle.files)) {
                            metadataInfo_1.METADATA_INFO.AuraDefinitionBundle.files = [];
                            metadataInfo_1.METADATA_INFO.AuraDefinitionBundle.components = [];
                        }
                        if (!checkIgnore || (checkIgnore && this.accepts(metadataFile))) {
                            metadataInfo_1.METADATA_INFO.AuraDefinitionBundle.files.push(metadataFile);
                            let name = fileutils_1.default.getFileNameWithoutExtension(metadataFile);
                            metadataInfo_1.METADATA_INFO.AuraDefinitionBundle.components.push(name);
                        }
                    }
                }
            });
        }
        else {
            keys.forEach((key) => {
                if (lodash_1.default.isNil(metadataInfo_1.METADATA_INFO[key].files)) {
                    metadataInfo_1.METADATA_INFO[key].files = [];
                    metadataInfo_1.METADATA_INFO[key].components = [];
                }
            });
        }
    }
    //Check if a component is accepted by forceignore.
    accepts(filePath) {
        return !this.forceignore.ignores(path.relative(process.cwd(), filePath));
    }
    async isInModuleFolder(filePath) {
        const packageDirectories = await sfpowerkit_1.Sfpowerkit.getProjectDirectories();
        if (!packageDirectories || packageDirectories.length == 0) {
            return false;
        }
        const moduleFolder = packageDirectories.find((packageFolder) => {
            let packageFolderNormalized = path.relative('', packageFolder);
            packageFolderNormalized = packageFolderNormalized + path.sep;
            return filePath.startsWith(packageFolderNormalized);
        });
        return moduleFolder !== undefined;
    }
    /**
     * Copy a file to an outpu directory. If the filePath is a Metadata file Path,
     * All the metadata requirement are also copied. For example MyApexClass.cls-meta.xml will also copy MyApexClass.cls.
     * Enforcing the .forceignore to ignire file ignored in the project.
     * @param filePath
     * @param outputFolder
     */
    static copyFile(filePath, outputFolder) {
        sfp_logger_1.default.log(`Copying file ${filePath} from file system to ${outputFolder}`, sfp_logger_1.LoggerLevel.DEBUG);
        const LWC_IGNORE_FILES = ['jsconfig.json', '.eslintrc.json'];
        const pairStatResources = metadataInfo_1.METADATA_INFO.StaticResource.directoryName;
        const pairStatResourcesRegExp = new RegExp(pairStatResources);
        const pairAuaraRegExp = new RegExp(metadataInfo_1.METADATA_INFO.AuraDefinitionBundle.directoryName);
        let copyOutputFolder = outputFolder;
        if (!fs.existsSync(filePath)) {
            return;
        }
        let exists = fs.existsSync(path.join(outputFolder, filePath));
        if (exists) {
            return;
        }
        if (filePath.startsWith('.')) {
            let parts = path.parse(filePath);
            if (parts.dir === '') {
                fs.copyFileSync(filePath, path.join(outputFolder, filePath));
                return;
            }
        }
        let fileName = path.parse(filePath).base;
        //exclude lwc ignored files
        if (LWC_IGNORE_FILES.includes(fileName)) {
            return;
        }
        let filePathParts = filePath.split(SEP);
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
        // Copy all file with same base name
        let associatedFilePattern = '';
        if (metadataInfo_1.SOURCE_EXTENSION_REGEX.test(filePath)) {
            associatedFilePattern = filePath.replace(metadataInfo_1.SOURCE_EXTENSION_REGEX, '.*');
        }
        else {
            let extension = path.parse(filePath).ext;
            associatedFilePattern = filePath.replace(extension, '.*');
        }
        let files = (0, glob_1.globSync)(associatedFilePattern);
        for (let i = 0; i < files.length; i++) {
            if (fs.lstatSync(files[i]).isDirectory() == false) {
                let oneFilePath = path.join('.', files[i]);
                let oneFilePathParts = oneFilePath.split(SEP);
                fileName = oneFilePathParts[oneFilePathParts.length - 1];
                let outputPath = path.join(outputFolder, fileName);
                fs.copyFileSync(files[i], outputPath);
            }
        }
        // Hadle ObjectTranslations
        // If a file fieldTranslation is copied, make sure the ObjectTranslation File is also copied
        if (filePath.endsWith('Translation-meta.xml') && filePath.indexOf('globalValueSet') < 0) {
            let parentFolder = filePathParts[filePathParts.length - 2];
            let objectTranslation = parentFolder + metadataInfo_1.METADATA_INFO.CustomObjectTranslation.sourceExtension;
            let outputPath = path.join(outputFolder, objectTranslation);
            let sourceFile = filePath.replace(fileName, objectTranslation);
            if (fs.existsSync(sourceFile) == true) {
                fs.copyFileSync(sourceFile, outputPath);
            }
        }
        //FOR STATIC RESOURCES - WHERE THE CORRESPONDING DIRECTORY + THE ROOT META FILE HAS TO BE INCLUDED
        if (pairStatResourcesRegExp.test(filePath)) {
            outputFolder = path.join('.', copyOutputFolder);
            let srcFolder = '.';
            let staticRecourceRoot = '';
            let resourceFile = '';
            for (let i = 0; i < filePathParts.length; i++) {
                outputFolder = path.join(outputFolder, filePathParts[i]);
                srcFolder = path.join(srcFolder, filePathParts[i]);
                if (filePathParts[i] === metadataInfo_1.METADATA_INFO.StaticResource.directoryName) {
                    let fileOrDirname = filePathParts[i + 1];
                    let fileOrDirnameParts = fileOrDirname.split('.');
                    srcFolder = path.join(srcFolder, fileOrDirnameParts[0]);
                    outputFolder = path.join(outputFolder, fileOrDirnameParts[0]);
                    resourceFile = srcFolder + metadataInfo_1.METADATA_INFO.StaticResource.sourceExtension;
                    metadataInfo_1.METADATA_INFO.StaticResource.sourceExtension;
                    staticRecourceRoot = outputFolder + metadataInfo_1.METADATA_INFO.StaticResource.sourceExtension;
                    if (fs.existsSync(srcFolder)) {
                        if (fs.existsSync(outputFolder) == false) {
                            fs.mkdirSync(outputFolder);
                        }
                    }
                    break;
                }
            }
            if (fs.existsSync(srcFolder)) {
                fileutils_1.default.copyRecursiveSync(srcFolder, outputFolder);
            }
            if (fs.existsSync(resourceFile)) {
                fs.copyFileSync(resourceFile, staticRecourceRoot);
            }
        }
        //FOR AURA components and LWC components
        if (pairAuaraRegExp.test(filePath)) {
            outputFolder = path.join('.', copyOutputFolder);
            let srcFolder = '.';
            for (let i = 0; i < filePathParts.length; i++) {
                outputFolder = path.join(outputFolder, filePathParts[i]);
                srcFolder = path.join(srcFolder, filePathParts[i]);
                if (filePathParts[i] === 'aura' || filePathParts[i] === 'lwc') {
                    let fileOrDirname = filePathParts[i + 1];
                    let fileOrDirnameParts = fileOrDirname.split('.');
                    srcFolder = path.join(srcFolder, fileOrDirnameParts[0]);
                    outputFolder = path.join(outputFolder, fileOrDirnameParts[0]);
                    if (fs.existsSync(srcFolder)) {
                        if (fs.existsSync(outputFolder) == false) {
                            fs.mkdirSync(outputFolder);
                        }
                    }
                    break;
                }
            }
            if (fs.existsSync(srcFolder)) {
                fileutils_1.default.copyRecursiveSync(srcFolder, outputFolder);
            }
        }
    }
}
MetadataFiles.sourceOnly = false;
exports.default = MetadataFiles;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YWRhdGFGaWxlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9pbXBsL21ldGFkYXRhL21ldGFkYXRhRmlsZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJDQUE2QjtBQUM3QixpREFBdUc7QUFDdkcsZ0VBQXdDO0FBQ3hDLG9EQUF1QjtBQUN2QixvREFBNEI7QUFDNUIsNkNBQStCO0FBQy9CLGlEQUE4QztBQUM5QyxtRUFBNkQ7QUFDN0QsK0JBQWdDO0FBRWhDLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQztBQUVwQixNQUFxQixhQUFhO0lBRzlCO1FBQ0ksSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUM7WUFDaEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFBLGdCQUFNLEdBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUN4RixDQUFDO2FBQU0sQ0FBQztZQUNKLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBQSxnQkFBTSxHQUFFLENBQUM7UUFDaEMsQ0FBQztJQUNMLENBQUM7SUFDRCxNQUFNLENBQUMsY0FBYyxDQUFDLFFBQWdCO1FBQ2xDLElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUNsQixJQUFJLFlBQVksR0FBRywyQkFBWSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMxRCxJQUFJLGFBQWEsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3hDLElBQUksYUFBYSxHQUFHLDRCQUFhLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDcEYsSUFBSSxhQUFhLEVBQUUsQ0FBQztZQUNoQixJQUFJLFVBQVUsR0FBRyxhQUFhLENB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