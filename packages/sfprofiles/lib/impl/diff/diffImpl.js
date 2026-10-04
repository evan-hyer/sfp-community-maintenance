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
/* eslint-disable @typescript-eslint/no-array-constructor */
const metadataFiles_1 = __importDefault(require("../metadata/metadataFiles"));
const xml2js = __importStar(require("xml2js"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const rimraf = __importStar(require("rimraf"));
const metadataInfo_1 = require("../metadata/metadataInfo");
const fileutils_1 = __importDefault(require("../../utils/fileutils"));
const _ = __importStar(require("lodash"));
const profileDiff_1 = __importDefault(require("./profileDiff"));
const permsetDiff_1 = __importDefault(require("./permsetDiff"));
const workflowDiff_1 = __importDefault(require("./workflowDiff"));
const sharingRuleDiff_1 = __importDefault(require("./sharingRuleDiff"));
const customLabelsDiff_1 = __importDefault(require("./customLabelsDiff"));
const diffUtil_1 = __importDefault(require("./diffUtil"));
const sfpowerkit_1 = require("../../utils/sfpowerkit");
const sfp_logger_1 = __importStar(require("@flxbl-io/sfp-logger"));
const dxProjectManifestUtils_1 = require("../../utils/dxProjectManifestUtils");
const simple_git_1 = require("simple-git");
const core_1 = require("@salesforce/core");
core_1.Messages.importMessagesDirectory(__dirname);
const messages = core_1.Messages.loadMessages('sfpowerkit', 'project_diff');
const deleteNotSupported = ['RecordType'];
const git = (0, simple_git_1.simpleGit)();
const unsplitedMetadataExtensions = metadataInfo_1.UNSPLITED_METADATA.map((elem) => {
    return elem.sourceExtension;
});
const permissionExtensions = metadataInfo_1.PROFILE_PERMISSIONSET_EXTENSION.map((elem) => {
    return elem.sourceExtension;
});
const SEP = /\/|\\/;
class DiffImpl {
    constructor(revisionFrom, revisionTo, isDestructive, pathToIgnore) {
        this.revisionFrom = revisionFrom;
        this.revisionTo = revisionTo;
        this.isDestructive = isDestructive;
        this.pathToIgnore = pathToIgnore;
        if (this.revisionTo == null || this.revisionTo.trim() === '') {
            this.revisionTo = 'HEAD';
        }
        if (this.revisionFrom == null) {
            this.revisionFrom = '';
        }
        this.destructivePackageObjPost = new Array();
        this.destructivePackageObjPre = new Array();
        this.resultOutput = [];
    }
    async build(outputFolder, packagedirectories, apiversion) {
        rimraf.sync(outputFolder);
        if (packagedirectories) {
            sfpowerkit_1.Sfpowerkit.setProjectDirectories(packagedirectories);
        }
        if (apiversion) {
            sfpowerkit_1.Sfpowerkit.setapiversion(apiversion);
        }
        //const sepRegex=/\t| |\n/;
        const sepRegex = /\n|\r/;
        let data = '';
        //check if same commit
        const commitFrom = await git.raw(['rev-list', '-n', '1', this.revisionFrom]);
        const commitTo = await git.raw(['rev-list', '-n', '1', this.revisionTo]);
        if (commitFrom === commitTo) {
            throw new Error(messages.getMessage('sameCommitErrorMessage'));
        }
        //Make it relative to make the command works from a project created as a subfolder in a repository
        git.addConfig('core.quotepath', 'false');
        data = await git.diff(["--no-renames", '--raw', this.revisionFrom, this.revisionTo, '--relative']);
        sfp_logger_1.default.log(`Input Param: From: ${this.revisionFrom}  To: ${this.revisionTo} `, sfp_logger_1.LoggerLevel.INFO);
        sfp_logger_1.default.log(`SHA Found From: ${commitFrom} To:  ${commitTo} `, sfp_logger_1.LoggerLevel.INFO);
        sfp_logger_1.default.log(data, sfp_logger_1.LoggerLevel.TRACE);
        let content = data.split(sepRegex);
        let diffFile = await diffUtil_1.default.parseContent(content);
        await diffUtil_1.default.fetchFileListRevisionTo(this.revisionTo);
        let filesToCopy = diffFile.addedEdited;
        let deletedFiles = diffFile.deleted;
        deletedFiles = deletedFiles.filter((deleted) => {
            let found = false;
            let deletedMetadata = metadataFiles_1.default.getFullApiNameWithExtension(deleted.path);
            for (let i = 0; i < filesToCopy.length; i++) {
                let addedOrEdited = metadataFiles_1.default.getFullApiNameWithExtension(filesToCopy[i].path);
                if (deletedMetadata === addedOrEdited) {
                    found = true;
                    break;
                }
            }
            return !found;
        });
        if (fs.existsSync(outputFolder) == false) {
            fs.mkdirSync(outputFolder);
        }
        sfp_logger_1.default.log('Files to be copied', sfp_logger_1.LoggerLevel.DEBUG);
        filesToCopy.forEach((element) => {
            sfp_logger_1.default.log(element, sfp_logger_1.LoggerLevel.DEBUG);
        });
        if (filesToCopy && filesToCopy.length > 0) {
            for (let i = 0; i < filesToCopy.length; i++) {
                let filePath = filesToCopy[i].path;
                try {
                    if (DiffImpl.checkForIngore(this.pathToIgnore, filePath)) {
                        let matcher = filePath.match(metadataInfo_1.SOURCE_EXTENSION_REGEX);
                        let extension = '';
                        if (matcher) {
                            extension = matcher[0];
                        }
                        else {
                            extension = path.parse(filePath).ext;
                        }
                        if (unsplitedMetadataExtensions.includes(extension)) {
                            //handle unsplited files
                            await this.handleUnsplittedMetadata(filesToCopy[i], outputFolder);
                        }
                        else {
                            await diffUtil_1.default.copyFile(filePath, outputFolder);
                            sfp_logger_1.default.log(`Copied file ${filePath} to ${outputFolder}`, sfp_logger_1.LoggerLevel.DEBUG);
                        }
                    }
                }
                catch (ex) {
                    this.resultOutput.push({
                        action: 'ERROR',
                        componentName: '',
                        metadataType: '',
                        message: ex.message,
                        path: filePath,
                    });
                }
            }
        }
        if (this.isDestructive) {
            sfp_logger_1.default.log('Creating Destructive Manifest..', sfp_logger_1.LoggerLevel.INFO);
            await this.createDestructiveChanges(deletedFiles, outputFolder);
        }
        sfp_logger_1.default.log(`Generating output summary`, sfp_logger_1.LoggerLevel.INFO);
        this.buildOutput(outputFolder);
        if (this.resultOutput.length > 0) {
            try {
                await diffUtil_1.default.copyFile('.forceignore', outputFolder);
            }
            catch (e) {
                sfp_logger_1.default.log(`.forceignore not found, skipping..`, sfp_logger_1.LoggerLevel.INFO);
            }
            try {
                //check if package path is provided
                if (packagedirectories) {
                    let sourceApiVersion = await sfpowerkit_1.Sfpowerkit.getApiVersion();
                    let packageDirectorieslist = [];
                    packagedirectories.forEach((path) => {
                        packageDirectorieslist.push({
                            path: path,
                        });
                    });
                    packageDirectorieslist[0].default = true;
                    let sfdx_project = {
                        packageDirectories: packageDirectorieslist,
                        namespace: '',
                        sourceApiVersion: sourceApiVersion,
                    };
                    fs.outputFileSync(`${outputFolder}/sfdx-project.json`, JSON.stringify(sfdx_project));
                }
                else {
                    //Copy project manifest
                    await diffUtil_1.default.copyFile('sfdx-project.json', outputFolder);
                }
                //Remove Project Directories that doesnt  have any components in ths diff  Fix #178
                let dxProjectManifestUtils = new dxProjectManifestUtils_1.DXProjectManifestUtils(outputFolder);
                dxProjectManifestUtils.removePackagesNotInDirectory();
            }
            catch (e) {
                sfp_logger_1.default.log(`sfdx-project.json not found, skipping..`, sfp_logger_1.LoggerLevel.INFO);
            }
        }
        return this.resultOutput;
    }
    static checkForIngore(pathToIgnore, filePath) {
        pathToIgnore = pathToIgnore || [];
        if (pathToIgnore.length === 0) {
            return true;
        }
        let returnVal = true;
        pathToIgnore.forEach((ignore) => {
            if (path.resolve(ignore) === path.resolve(filePath) ||
                path.resolve(filePath).includes(path.resolve(ignore))) {
                returnVal = false;
            }
        });
        return returnVal;
    }
    buildOutput(outputFolder) {
        let metadataFiles = new metadataFiles_1.default();
        metadataFiles.loadComponents(outputFolder, false);
        let keys = Object.keys(metadataInfo_1.METADATA_INFO);
        let excludedFiles = _.difference(unsplitedMetadataExtensions, permissionExtensions);
        keys.forEach((key) => {
            if (metadataInfo_1.METADATA_INFO[key].files && metadataInfo_1.METADATA_INFO[key].files.length > 0) {
                metadataInfo_1.METADATA_INFO[key].files.forEach((filePath) => {
                    let matcher = filePath.match(metadataInfo_1.SOURCE_EXTENSION_REGEX);
                    let extension = '';
                    if (matcher) {
                        extension = matcher[0];
                    }
                    else {
                        extension = path.parse(filePath).ext;
                    }
                    if (!excludedFiles.includes(extension)) {
                        let name = fileutils_1.default.getFileNameWithoutExtension(filePath, metadataInfo_1.METADATA_INFO[key].sourceExtension);
                        if (metadataInfo_1.METADATA_INFO[key].isChildComponent) {
                            let fileParts = filePath.split(SEP);
                            let parentName = fileParts[fileParts.length - 3];
                            name = parentName + '.' + name;
                        }
                        this.resultOutput.push({
                            action: 'Deploy',
                            metadataType: metadataInfo_1.METADATA_INFO[key].xmlName,
                            componentName: name,
                            message: '',
                            path: filePath,
                        });
                    }
                });
            }
        });
        return this.resultOutput;
    }
    async handleUnsplittedMetadata(diffFile, outputFolder) {
        let content1 = '';
        let content2 = '';
        try {
            if (diffFile.revisionFrom !== '0000000') {
                content1 = await git.show(['--raw', diffFile.revisionFrom]);
            }
        }
        catch (e) { }
        try {
            if (diffFile.revisionTo !== '0000000') {
                content2 = await git.show(['--raw', diffFile.revisionTo]);
            }
        }
        catch (e) { }
        fileutils_1.default.mkDirByPathSync(path.join(outputFolder, path.parse(diffFile.path).dir));
        if (diffFile.path.endsWith(metadataInfo_1.METADATA_INFO.Workflow.sourceExtension)) {
            //Workflow
            let baseName = path.parse(diffFile.path).base;
            let objectName = baseName.split('.')[0];
            await workflowDiff_1.default.generateWorkflowXml(content1, content2, path.join(outputFolder, diffFile.path), objectName, this.destructivePackageObjPost, this.resultOutput, this.isDestructive);
        }
        if (diffFile.path.endsWith(metadataInfo_1.METADATA_INFO.SharingRules.sourceExtension)) {
            let baseName = path.parse(diffFile.path).base;
            let objectName = baseName.split('.')[0];
            await sharingRuleDiff_1.default.generateSharingRulesXml(content1, content2, path.join(outputFolder, diffFile.path), objectName, this.destructivePackageObjPost, this.resultOutput, this.isDestructive);
        }
        if (diffFile.path.endsWith(metadataInfo_1.METADATA_INFO.CustomLabels.sourceExtension)) {
            await customLabelsDiff_1.default.generateCustomLabelsXml(content1, content2, path.join(outputFolder, diffFile.path), this.destructivePackageObjPost, this.resultOutput, this.isDestructive);
        }
        if (diffFile.path.endsWith(metadataInfo_1.METADATA_INFO.Profile.sourceExtension)) {
            //Deploy only what changed
            if (content1 === '') {
                await diffUtil_1.default.copyFile(diffFile.path, outputFolder);
                sfp_logger_1.default.log(`Copied file ${diffFile.path} to ${outputFolder}`, sfp_logger_1.LoggerLevel.DEBUG);
            }
            else if (content2 === '') {
                //The profile is deleted or marked as renamed.
                //Delete the renamed one
                let profileType = _.find(this.destructivePackageObjPost, function (metaType) {
                    return metaType.name === metadataInfo_1.METADATA_INFO.Profile.xmlName;
                });
                if (profileType === undefined) {
                    profileType = {
                        name: metadataInfo_1.METADATA_INFO.Profile.xmlName,
                        members: [],
                    };
                    this.destructivePackageObjPost.push(profileType);
                }
                let baseName = path.parse(diffFile.path).base;
                let profileName = baseName.split('.')[0];
                profileType.members.push(profileName);
            }
            else {
                await profileDiff_1.default.generateProfileXml(content1, content2, path.join(outputFolder, diffFile.path));
            }
        }
        if (diffFile.path.endsWith(metadataInfo_1.METADATA_INFO.PermissionSet.sourceExtension)) {
            let sourceApiVersion = await sfpowerkit_1.Sfpowerkit.getApiVersion();
            if (content1 === '') {
                await diffUtil_1.default.copyFile(diffFile.path, outputFolder);
                sfp_logger_1.default.log(`Copied file ${diffFile.path} to ${outputFolder}`, sfp_logger_1.LoggerLevel.DEBUG);
            }
            else if (sourceApiVersion <= 39.0) {
                // in API 39 and erliar PermissionSet deployment are merged. deploy only what changed
                if (content2 === '') {
                    //Deleted permissionSet
                    let permsetType = _.find(this.destructivePackageObjPost, function (metaType) {
                        return metaType.name === metadataInfo_1.METADATA_INFO.PermissionSet.xmlName;
                    });
                    if (permsetType === undefined) {
                        permsetType = {
                            name: metadataInfo_1.METADATA_INFO.PermissionSet.xmlName,
                            members: [],
                        };
                        this.destructivePackageObjPost.push(permsetType);
                    }
                    let baseName = path.parse(diffFile.path).base;
                    let permsetName = baseName.split('.')[0];
                    permsetType.members.push(permsetName);
                }
                else {
                    await permsetDiff_1.default.generatePermissionsetXml(content1, content2, path.join(outputFolder, diffFile.path));
                }
            }
            else {
                //PermissionSet deployment override in the target org
                //So deploy the whole file
                await diffUtil_1.default.copyFile(diffFile.path, outputFolder);
                sfp_logger_1.default.log(`Copied file ${diffFile.path} to ${outputFolder}`, sfp_logger_1.LoggerLevel.DEBUG);
            }
        }
    }
    async createDestructiveChanges(filePaths, outputFolder) {
        if (_.isNil(this.destructivePackageObjPost)) {
            this.destructivePackageObjPost = new Array();
        }
        else {
            this.destructivePackageObjPost = this.destructivePackageObjPost.filter((metaType) => {
                return !_.isNil(metaType.members) && metaType.members.length > 0;
            });
        }
        this.destructivePackageObjPre = new Array();
        //returns root, dir, base and name
        for (let i = 0; i < filePaths.length; i++) {
            let filePath = filePaths[i].path;
            try {
                let matcher = filePath.match(metadataInfo_1.SOURCE_EXTENSION_REGEX);
                let extension = '';
                if (matcher) {
                    extension = matcher[0];
                }
                else {
                    extension = path.parse(filePath).ext;
                }
                if (unsplitedMetadataExtensions.includes(extension)) {
                    //handle unsplited files
                    await this.handleUnsplittedMetadata(filePaths[i], outputFolder);
                    continue;
                }
                let parsedPath = path.parse(filePath);
                let filename = parsedPath.base;
                let name = metadataInfo_1.MetadataInfo.getMetadataName(filePath);
                if (name) {
                    if (!metadataFiles_1.default.isCustomMetadata(filePath, name)) {
                        // avoid to generate destructive for Standard Components
                        //Support on Custom Fields and Custom Objects for now
                        this.resultOutput.push({
                            action: 'Skip',
                            componentName: metadataFiles_1.default.getMemberNameFromFilepath(filePath, name),
                            metadataType: 'StandardField/CustomMetadata',
                            message: '',
                            path: '--',
                        });
                        continue;
                    }
                    let member = metadataFiles_1.default.getMemberNameFromFilepath(filePath, name);
                    if (name === metadataInfo_1.METADATA_INFO.CustomField.xmlName) {
                        let isFormular = await diffUtil_1.default.isFormulaField(filePaths[i]);
                        if (isFormular) {
                            this.destructivePackageObjPre = this.buildDestructiveTypeObj(this.destructivePackageObjPre, name, member);
                            sfp_logger_1.default.log(`${filePath} ${metadataFiles_1.default.isCustomMetadata(filePath, name)}`, sfp_logger_1.LoggerLevel.DEBUG);
                            this.resultOutput.push({
                                action: 'Delete',
                                componentName: member,
                                metadataType: name,
                                message: '',
                                path: 'Manual Intervention Required',
                            });
                        }
                        else {
                            this.destructivePackageObjPost = this.buildDestructiveTypeObj(this.destructivePackageObjPost, name, member);
                        }
                        sfp_logger_1.default.log(`${filePath} ${metadataFiles_1.default.isCustomMetadata(filePath, name)}`, sfp_logger_1.LoggerLevel.DEBUG);
                        this.resultOutput.push({
                            action: 'Delete',
                            componentName: member,
                            metadataType: name,
                            message: '',
                            path: 'destructiveChanges.xml',
                        });
                    }
                    else {
                        if (!deleteNotSupported.includes(name)) {
                            this.destructivePackageObjPost = this.buildDestructiveTypeObj(this.destructivePackageObjPost, name, member);
                            this.resultOutput.push({
                                action: 'Delete',
                                componentName: member,
                                metadataType: name,
                                message: '',
                                path: 'destructiveChanges.xml',
                            });
                        }
                        else {
                            //add the component in the manual action list
                            // TODO
                        }
                    }
                }
            }
            catch (ex) {
                this.resultOutput.push({
                    action: 'ERROR',
                    componentName: '',
                    metadataType: '',
                    message: ex.message,
                    path: filePath,
                });
            }
        }
        // this.writeDestructivechanges(
        //   this.destructivePackageObjPre,
        //   outputFolder,
        //   "destructiveChangesPre.xml"
        // );
        this.writeDestructivechanges(this.destructivePackageObjPost, outputFolder, 'destructiveChanges.xml');
    }
    writeDestructivechanges(destrucObj, outputFolder, fileName) {
        //ensure unique component per type
        for (let i = 0; i < destrucObj.length; i++) {
            destrucObj[i].members = _.uniq(destrucObj[i].members);
        }
        destrucObj = destrucObj.filter((metaType) => {
            return metaType.members && metaType.members.length > 0;
        });
        if (destrucObj.length > 0) {
            let dest = {
                Package: {
                    $: {
                        xmlns: 'htt@impl/metadata',
                    },
                    types: destrucObj,
                },
            };
            let destructivePackageName = fileName;
            let filepath = path.join(outputFolder, destructivePackageName);
            let builder = new xml2js.Builder();
            let xml = builder.buildObject(dest);
            fs.writeFileSync(filepath, xml);
        }
    }
    buildDestructiveTypeObj(destructiveObj, name, member) {
        let typeIsPresent = false;
        for (let i = 0; i < destructiveObj.length; i++) {
            if (destructiveObj[i].name === name) {
                typeIsPresent = true;
                destructiveObj[i].members.push(member);
                break;
            }
        }
        let typeNode;
        if (typeIsPresent === false) {
            typeNode = {
                name: name,
                members: [member],
            };
            destructiveObj.push(typeNode);
        }
        return destructiveObj;
    }
}
exports.default = DiffImpl;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlmZkltcGwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvaW1wbC9kaWZmL2RpZmZJbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw0REFBNEQ7QUFDNUQsaUZBQXlEO0FBRXpELCtDQUFpQztBQUNqQywyQ0FBNkI7QUFDN0IsNkNBQStCO0FBQy9CLCtDQUFpQztBQUNqQyw4REFNcUM7QUFDckMsaUVBQXlDO0FBQ3pDLDBDQUE0QjtBQUM1QixnRUFBd0M7QUFDeEMsZ0VBQXdDO0FBQ3hDLGtFQUEwQztBQUMxQyx3RUFBZ0Q7QUFDaEQsMEVBQWtEO0FBQ2xELDBEQUFnRTtBQUNoRSxrREFBK0M7QUFDL0MsbUVBQTZEO0FBQzdELDBFQUF1RTtBQUN2RSw0REFBbUM7QUFDbkMsMkNBQTRDO0FBRTVDLGVBQVEsQ0FBQyx1QkFBdUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUM1QyxNQUFNLFFBQVEsR0FBRyxlQUFRLENBQUMsWUFBWSxDQUFDLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztBQUVyRSxNQUFNLGtCQUFrQixHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7QUFFMUMsTUFBTSxHQUFHLEdBQUcsSUFBQSxvQkFBUyxHQUFFLENBQUM7QUFFeEIsTUFBTSwyQkFBMkIsR0FBRyxpQ0FBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtJQUNoRSxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7QUFDaEMsQ0FBQyxDQUFDLENBQUM7QUFDSCxNQUFNLG9CQUFvQixHQUFHLDhDQUErQixDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFO0lBQ3RFLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQztBQUNoQyxDQUFDLENBQUMsQ0FBQztBQUVILE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQztBQUVwQixNQUFxQixRQUFRO0lBVXpCLFlBQ1ksWUFBcUIs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
