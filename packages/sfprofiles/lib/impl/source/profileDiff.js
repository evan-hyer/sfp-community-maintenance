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
const retrieveMetadata_1 = require("../../utils/retrieveMetadata");
const core_1 = require("@salesforce/core");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const metadataInfo_1 = require("../metadata/metadataInfo");
const profileRetriever_1 = __importDefault(require("../metadata/retriever/profileRetriever"));
const profileWriter_1 = __importDefault(require("../metadata/writer/profileWriter"));
const sfpowerkit_1 = require("../../utils/sfpowerkit");
const metadataFiles_1 = __importDefault(require("../metadata/metadataFiles"));
const sfp_logger_1 = __importStar(require("@flxbl-io/sfp-logger"));
const diff_match_patch_1 = require("diff-match-patch");
const fileutils_1 = __importDefault(require("../../utils/fileutils"));
const rimraf_1 = require("rimraf");
// import { ProgressBar } from '../../../ui/progressBar';
// const dmp = new diff_match_patch();
// https://github.com/google/diff-match-patch/wiki/Line-or-Word-Diffs#line-mode
function diff_lineMode(text1, text2) {
    const dmp = new diff_match_patch_1.diff_match_patch();
    const a = dmp.diff_linesToChars_(text1, text2);
    const lineText1 = a.chars1;
    const lineText2 = a.chars2;
    const lineArray = a.lineArray;
    const diffs = dmp.diff_main(lineText1, lineText2, false);
    dmp.diff_charsToLines_(diffs, lineArray);
    return diffs;
}
const CRLF_REGEX = /\r\n/;
const LF_REGEX = /\n/;
class ProfileDiffImpl {
    constructor(profileList, sourceOrgStr, targetOrg, outputFolder) {
        this.profileList = profileList;
        this.sourceOrgStr = sourceOrgStr;
        this.targetOrg = targetOrg;
        this.outputFolder = outputFolder;
        this.sourceOrg = null;
        this.output = [];
        this.sourceLabel = 'Local';
        this.targetLabel = 'Remote';
        this.targetLabel = this.targetOrg.getConnection().getUsername();
    }
    async diff() {
        sfp_logger_1.default.log('Profile diff start. ', sfp_logger_1.LoggerLevel.INFO);
        if (this.outputFolder) {
            rimraf_1.sync(this.outputFolder);
        }
        let profileSource = null;
        //let profileXmlMapPromise: Promise<string[]> = null;
        if (this.sourceOrgStr) {
            sfp_logger_1.default.log('Creating source org ', sfp_logger_1.LoggerLevel.INFO);
            this.sourceOrg = await core_1.Org.create({
                aliasOrUsername: this.sourceOrgStr,
                isDevHub: false,
            });
        }
        if ((!this.profileList || this.profileList.length === 0) && this.sourceOrgStr) {
            this.sourceLabel = this.sourceOrg.getConnection().getUsername();
            sfp_logger_1.default.log('No profile provided, loading all profiles from source org. ', sfp_logger_1.LoggerLevel.INFO);
            const conn = this.sourceOrg.getConnection();
            let profileNamesPromise = (0, retrieveMetadata_1.retrieveMetadata)([{ type: 'Profile', folder: null }], conn);
            profileSource = profileNamesPromise.then((profileNames) => {
                return this.retrieveProfiles(profileNames, this.sourceOrg);
            });
        }
        else {
            sfp_logger_1.default.log('Reading profiles from file system. ', sfp_logger_1.LoggerLevel.INFO);
            const srcFolders = await sfpowerkit_1.Sfpowerkit.getProjectDirectories();
            const metadataFiles = new metadataFiles_1.default();
            sfp_logger_1.default.log('Source Folders are', sfp_logger_1.LoggerLevel.DEBUG);
            for (let i = 0; i < srcFolders.length; i++) {
                const srcFolder = srcFolders[i];
                const normalizedPath = path.join(process.cwd(), srcFolder);
                metadataFiles.loadComponents(normalizedPath);
            }
            if (!this.profileList || this.profileList.length === 0) {
                this.profileList = metadataInfo_1.METADATA_INFO.Profile.files;
            }
            else {
                this.profileList = this.profileList.map((profilename) => {
                    const foundFile = metadataInfo_1.METADATA_INFO.Profile.files.find((file) => {
                        const apiName = metadataFiles_1.default.getFullApiName(file);
                        return apiName === profilename;
                    });
                    if (!foundFile) {
                        sfp_logger_1.default.log('No profile found with name  ' + profilename, sfp_logger_1.LoggerLevel.INFO);
                    }
                    return foundFile;
                });
                this.profileList = this.profileList.filter((file) => {
                    return file !== undefined;
                });
            }
            if (!this.profileList || this.profileList.length === 0) {
                sfp_logger_1.default.log('No profile to process ', sfp_logger_1.LoggerLevel.INFO);
                return null;
            }
            if (!this.outputFolder) {
                this.outputFolder = path.dirname(this.profileList[0]);
            }
            const profilesMap = [];
            // const progressBar: ProgressBar = new ProgressBar();
            sfp_logger_1.default.log(`Reading ${this.profileList.length} Profiles from File System `, sfp_logger_1.LoggerLevel.INFO);
            // progressBar.start(this.profileList.length);
            for (let i = 0; i < this.profileList.length; i++) {
                const profilepath = this.profileList[i];
                sfp_logger_1.default.log('Reading profile from path ' + profilepath, sfp_logger_1.LoggerLevel.DEBUG);
                const profileXml = fs.readFileSync(profilepath);
                const profileName = path.basename(profilepath, metadataInfo_1.METADATA_INFO.Profile.sourceExtension);
                profilesMap.push({
                    [profileName]: profileXml.toString(),
                });
                // progressBar.increment(1);
                sfp_logger_1.default.log(`Profile ${profileName} read (${profilesMap.length} of ${this.profileList.length})`, sfp_logger_1.LoggerLevel.TRACE);
            }
            profileSource = new Promise((resolve, _reject) => {
                resolve(profilesMap);
            });
            // progressBar.stop();
            sfp_logger_1.default.log(`Finished reading profiles from filesystem`);
        }
        if (!fs.existsSync(this.outputFolder)) {
            sfp_logger_1.default.log('Creattin output diff ' + this.outputFolder);
            fileutils_1.default.mkDirByPathSync(this.outputFolder);
        }
        //REtrieve profiles from target
        return profileSource.then((profilesSourceMap) => {
            const profileNames = [];
            profilesSourceMap.forEach((profileXml) => {
                profileNames.push(...Object.keys(profileXml));
            });
            const targetConn = this.targetOrg.getConnection();
            let profileNamesPromise = (0, retrieveMetadata_1.retrieveMetadata)([{ type: 'Profile', folder: null }], targetConn);
            const profileTarget = profileNamesPromise
                .then((targetProfileNames) => {
                let profileToRetrieveinTarget = profileNames.filter((oneProfile) => {
                    return targetProfileNames.includes(oneProfile);
                });
                return this.retrieveProfiles(profileToRetrieveinTarget, this.targetOrg);
            })
                .catch((error) => {
                console.log(error.message);
                return [];
            });
            return profileTarget
                .then((profilesTargetMap) => {
                // SFPLogger.log('Handling diff ', LoggerLevel.INFO);
                sfp_logger_1.default.log(`Beginning diff of ${profilesSourceMap.length} profiles.`, sfp_logger_1.LoggerLevel.INFO);
                for (let i = 0; i < profilesSourceMap.length; i++) {
                    let sourceProfileXml = profilesSourceMap[i];
                    let sourceKeys = Object.keys(sourceProfileXml);
                    let sourceProfileName = sourceKeys[0];
                    let targetProfileXml = profilesTargetMap.find((targetProfile) => {
                        let targetKeys = Object.keys(targetProfile);
                        let targetProfileName = targetKeys[0];
                        return targetProfileName === sourceProfileName;
                    });
                    sfp_logger_1.default.log('Processing profile ' + sourceProfileName, sfp_logger_1.LoggerLevel.DEBUG);
                    let sourceContent = sourceProfileXml[sourceProfileName];
                    let targetContent = '';
                    if (targetProfileXml) {
                        targetContent = targetProfileXml[sourceProfileName];
                    }
                    let filePath = this.outputFolder + path.sep + sourceProfileName + metadataInfo_1.METADATA_INFO.Profile.sourceExtension;
                    sfp_logger_1.default.log('Processing diff for profile ' + sourceProfileName, sfp_logger_1.LoggerLevel.DEBUG);
                    this.processDiff(filePath, sourceContent, targetContent);
                    sfp_logger_1.default.log(`Processed profile ${i} of ${profilesSourceMap.length}`, sfp_logger_1.LoggerLevel.INFO);
                }
                /*
      profilesSourceMap.forEach(sourceProfileXml => {

      });
      */
                // progressBar.stop();
                sfp_logger_1.default.log(`Completed diff of ${profilesSourceMap.length} profiles`, sfp_logger_1.LoggerLevel.INFO);
                return this.output;
            })
                .catch((error) => {
                sfp_logger_1.default.log(error.message);
            });
        });
    }
    async retrieveProfiles(profileNames, retrieveOrg) {
        let i, j, chunk = 10, temparray;
        let profileRetriever = new profileRetriever_1.default(retrieveOrg);
        let retrievePromises = [];
        let connection = retrieveOrg.getConnection();
        sfp_logger_1.default.log(`Retrieving ${profileNames.length} Profiles From ${connection.getUsername()}`, sfp_logger_1.LoggerLevel.INFO);
        // progressBar.start(profileNames.length);
        for (i = 0, j = profileNames.length; i < j; i += chunk) {
            temparray = profileNames.slice(i, i + chunk);
            let metadataListPromise = profileRetriever.loadProfiles(temparray);
            retrievePromises.push(metadataListPromise
                .then((metadataList) => {
                let profileWriter = new profileWriter_1.default();
                let profilesXmls = [];
                for (let count = 0; count < metadataList.length; count++) {
                    //console.log(metadataList[count]);
                    let profileObj = metadataList[count];
                    let profileXml = profileWriter.toXml(profileObj);
                    profilesXmls.push({
                        [profileObj.fullName]: profileXml,
                    });
                    sfp_logger_1.default.log(`Profile ${profileObj.fullName} retrieved (${profilesXmls.length} of ${profileNames.length})`, sfp_logger_1.LoggerLevel.INFO);
                }
                return profilesXmls;
            })
                .catch((error) => {
                console.error(error.message);
                sfp_logger_1.default.log(`An error occurred when retrieving profiles. Details: ${error.message}`, sfp_logger_1.LoggerLevel.ERROR);
                return [];
            }));
        }
        return Promise.all(retrievePromises)
            .then((metadataList) => {
            let profiles = [];
            metadataList.forEach((elem) => {
                profiles.push(...elem);
            });
            sfp_logger_1.default.log(`Successfully retrieved ${profiles.length} profiles.`, sfp_logger_1.LoggerLevel.INFO);
            return profiles;
        })
            .catch((error) => {
            sfp_logger_1.default.log(`An error occurred when retrieving profiles. Details: ${error.message}`, sfp_logger_1.LoggerLevel.ERROR);
            return [];
        });
    }
    processDiff(filePath, contentSource, contentTarget) {
        let lineEnd = '\n';
        let content = '';
        let changedLocaly = false;
        let changedRemote = false;
        let conflict = false;
        //Normalise line ending on windows
        let matcherLocal = contentSource.match(CRLF_REGEX);
        let matcherFetched = contentTarget.match(CRLF_REGEX);
        if (matcherLocal && !matcherFetched) {
            lineEnd = matcherLocal[0];
            contentTarget = contentTarget.split(LF_REGEX).join(lineEnd);
        }
        if (!contentSource.endsWith(lineEnd) && contentTarget.endsWith(lineEnd)) {
            contentTarget = contentTarget.substr(0, contentTarget.lastIndexOf(lineEnd));
        }
        if (contentSource.endsWith(lineEnd) && !contentTarget.endsWith(lineEnd)) {
            contentTarget = contentTarget + lineEnd;
        }
        sfp_logger_1.default.log('Running diff', sfp_logger_1.LoggerLevel.DEBUG);
        //let diffResult = jsdiff.diffLines(contentSource, contentTarget);
        const diffResult = diff_lineMode(contentSource, contentTarget);
        sfp_logger_1.default.log('Diff run completed. Processing result', sfp_logger_1.LoggerLevel.DEBUG);
        for (let i = 0; i < diffResult.length; i++) {
            let result = diffResult[i];
            let index = i;
            let originalArray = diffResult;
            let nextIndex = index + 1;
            let nextElem = undefined;
            if (originalArray.length >= nextIndex) {
                nextElem = originalArray[nextIndex];
            }
            let value = result[1];
            let status = result[0];
            if (status === -1) {
                if (!value.endsWith(lineEnd)) {
                    value = value + lineEnd;
                }
                if (nextElem !== undefined) {
                    if (nextElem[0] === 0) {
                        content =
                            content +
                                `<<<<<<< ${this.sourceLabel}:${filePath}\n${value}=======\n>>>>>>> ${this.targetLabel}:${filePath}\n`;
                        changedLocaly = true;
                    }
                    else if (nextElem[0] === 1) {
                        content = content + `<<<<<<< ${this.sourceLabel}:${filePath}\n${value}=======\n`;
                        conflict = true;
                    }
                }
                else {
                    content =
                        content +
                            `<<<<<<< ${this.sourceLabel}:${filePath}\n${value}=======\n>>>>>>> ${this.targetLabel}:${filePath}\n`;
                    changedLocaly = true;
                }
            }
            else if (status === 1) {
                if (conflict) {
                    content = content + `${value}>>>>>>> ${this.targetLabel}:${filePath}\n`;
                    conflict = true;
                }
                else {
                    content =
                        content +
                            `<<<<<<< ${this.sourceLabel}:${filePath}\n=======\n${value}>>>>>>> ${this.targetLabel}:${filePath}\n`;
                    changedRemote = true;
                }
            }
            else {
                content = content + value;
            }
        }
        sfp_logger_1.default.log('Result processed', sfp_logger_1.LoggerLevel.DEBUG);
        fs.writeFileSync(filePath, content);
        let status = 'No Change';
        if (conflict || (changedLocaly && changedRemote)) {
            status = 'Conflict';
        }
        else if (changedRemote) {
            status = 'Remote Change';
        }
        else if (changedLocaly) {
            status = 'Local Change';
        }
        let metaType = metadataInfo_1.MetadataInfo.getMetadataName(filePath, false);
        let member = metadataFiles_1.default.getMemberNameFromFilepath(filePath, metaType);
        if (conflict || changedLocaly || changedRemote) {
            this.output.push({
                status: status,
                metadataType: metaType,
                componentName: member,
                path: filePath,
            });
        }
    }
}
exports.default = ProfileDiffImpl;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZmlsZURpZmYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvaW1wbC9zb3VyY2UvcHJvZmlsZURpZmYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDhEQUEyRDtBQUMzRCwyQ0FBK0M7QUFDL0MsMkNBQTZCO0FBQzdCLHVDQUF5QjtBQUN6Qiw4REFBMEU7QUFDMUUsaUdBQXlFO0FBQ3pFLHdGQUFnRTtBQUVoRSxrREFBK0M7QUFDL0MsaUZBQXlEO0FBQ3pELG1FQUE2RDtBQUU3RCx1REFBb0Q7QUFDcEQsMENBQXdDLENBQUMsd0NBQXdDO0FBQ2pGLGlFQUF5QztBQUN6QyxvREFBNEI7QUFDNUIseURBQXlEO0FBRXpELHNDQUFzQztBQUV0QywrRUFBK0U7QUFDL0UsU0FBUyxhQUFhLENBQUMsS0FBSyxFQUFFLEtBQUs7SUFDakMsTUFBTSxHQUFHLEdBQUcsSUFBSSxtQ0FBZ0IsRUFBRSxDQUFDO0lBQ25DLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDL0MsTUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUMzQixNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO0lBQzNCLE1BQU0sU0FBUyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUM7SUFDOUIsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3pELEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDekMsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBQ0QsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDO0FBQzFCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQztBQUV0QixNQUFxQixlQUFlO0lBS2hDLFlBQ1ksV0FBcUIsRUFDckIsWUFBb0IsRUFDcEIsU0FBYyxFQUNkLFlBQW9CO1FBSHBCLGdCQUFXLEdBQVgsV0FBVyxDQUFVO1FBQ3JCLGlCQUFZLEdBQVosWUFBWSxDQUFRO1FBQ3BCLGNBQVMsR0FBVCxTQUFTLENBQUs7UUFDZCxpQkFBWSxHQUFaLFlBQVksQ0FBUTtRQVJ4QixjQUFTLEdBQVEsSUFBSSxDQUFDO1FBQ3ZCLFdBQU0sR0FBRyxFQUFFLENBQUM7UUFDWCxnQkFBVyxHQUFHLE9BQU8sQ0FBQztRQUN0QixnQkFBVyxHQUFHLFFBQVEsQ0FBQztRQU8zQixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDcEUsQ0FBQztJQUNNLEtBQUssQ0FBQyxJQUFJO1FBQ2Isb0JBQVMsQ0FBQyxHQUFHLENBQUMsc0JBQXNCLEVBQUUsd0JBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN4RCxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNwQixnQkFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUNELElBQUksYUFBYSxHQUFzQixJQUFJLENBQUM7UUFDNUMscURBQXFEO1FBQ3JELElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3BCLG9CQUFTLENBQUMsR0FBRyxDQUFDLHNCQUFzQixFQUFFLHdCQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDeEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLFVBQUcsQ0FBQyxNQUFNLENBQUM7Z0JBQzlCLGVBQWUsRUFBRSxJQUFJLENBQUMsWUFBWTtnQkFDbEMsUUFBUSxFQUFFLEtBQUs7YUFDbEIsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztRQUNELElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQzVFLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNoRSxvQkFBUyxDQUFDLEdBQUcsQ0FBQyw2REFBNkQsRUFBRSx3QkFBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQy9GLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLENBQUM7WUFFNUMsSUFBSSxtQkFBbUIsR0FBRyxJQUFBLG1DQUFnQixFQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3RGLGFBQWEsR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxZQUFZLEVBQUUsRUFBRTtnQkFDdEQsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMvRCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUM7YUFBTSxDQUFDO1lBQ0osb0JBQVMsQ0FBQyxHQUFHLENBQUMscUNBQXFDLEVBQUUsd0JBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUV2RSxNQUFNLFVBQVUsR0FBRyxNQUFNLHVCQUFVLENBQUMscUJBQXFCLEVBQUUsQ0FBQztZQUU1RCxNQUFNLGFBQWEsR0FBRyxJQUFJLHVCQUFhLEVBQUUsQ0FBQztZQUUxQyxvQkFBUyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRSx3QkFBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ3pDLE1BQU0sU0FBUyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDaEMsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQzNELGFBQWEsQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDakQsQ0FBQztZQUNELElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNyRCxJQUFJLENBQUMsV0FBVyxHQUFHLDRCQUFhLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztZQUNuRCxDQUFDO2lCQUFNLENBQUM7Z0JBQ0osSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFFO29CQUNwRCxNQUFNLFNBQVMsR0FBRyw0QkFBYSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7d0JBQ3hELE1BQU0sT0FBTyxHQUFHLHVCQUFhLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNuRCxPQUFPLE9BQU8sS0FBSyxXQUFXLENBQUM7b0JBQ25DLENBQUMsQ0FBQyxDQUFDO29CQUNILElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQzt3QkFDYixvQkFBUyxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsR0FBRyxXQUFXLEVBQUUsd0JBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDbEYsQ0FBQztvQkFDRCxPQUFPLFNBQVMsQ0FBQztnQkFDckIsQ0FBQyxDQUFDLENBQUM7Z0JBRUgsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFO29CQUNoRCxPQUFPLElBQUksS0FBSyxTQUFTLENBQUM7Z0JBQzlCLENBQUMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQztZQUVELElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNyRCxvQkFBUyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsRUFBRSx3QkFBVyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMxRCxPQUFPLElBQUksQ0FBQztZQUNoQixDQUFDO1lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDckIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxRCxDQUFDO1lBRUQsTUFBTSxXQUFXLEdBQUcsRUFBRSxDQUFDO1lBRXZCLHNEQUFzRDtZQUN0RCxvQkFBUyxDQUFDLEdBQUcsQ0FBQyxXQUFXLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSw2QkFBNkIsRUFBRSx3QkFBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRWpHLDhDQUE4QztZQUU5QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDL0MsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDeEMsb0JBQVMsQ0FBQyxHQUFHLENBQUMsNEJBQTRCLEdBQUcsV0FBVyxFQUFFLHdCQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzdFLE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQ2hELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLDRCQUFhLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUN0RixXQUFXLENBQUMsSUFBSSxDQUFDO29CQUNiLENBQUMsV0FBVyxDQUFDLEVBQUUsVUFBVSxDQUFDLFFBQVEsRUFBRTtpQkFDdkMsQ0FBQyxDQUFDO2dCQUNILDRCQUE0QjtnQkFFNUIsb0JBQVMsQ0FBQyxHQUFHLENBQUMsV0FBVyxXQUFXLFVBQVUsV0FBVyxDQUFDLE1BQU0sT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sR0FBRyxFQUFFLHdCQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDMUgsQ0FBQztZQUNELGFBQWEsR0FBRyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsRUFBRTtnQkFDN0MsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3pCLENBQUMsQ0FBQyxDQUFDO1lBQ0gsc0JBQXNCO1lBQ3RCLG9CQUFTLENBQUMsR0FBRyxDQUFDLDJDQUEyQyxDQUFDLENBQUM7UUFDL0QsQ0FBQztRQUVELElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO1lBQ3BDLG9CQUFTLENBQUMsR0FBRyxDQUFDLHVCQUF1QixHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMzRCxtQkFBUyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDakQsQ0FBQztRQUVELCtCQUErQjtRQUMvQixPQUFPLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxpQkFBaUIsRUFBRSxFQUFFO1lBQzVDLE1BQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQztZQUN4QixpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRTtnQkFDckMsWUFBWSxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUNsRCxDQUFDLENBQUMsQ0FBQztZQUNILE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDbEQsSUFBSSxtQkFBbUIsR0FBRyxJQUFBLG1DQUFnQixFQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQzVGLE1BQU0sYUFBYSxHQUFHLG1CQUFtQjtpQkFDcEMsSUFBSSxDQUFDLENBQUMsa0JBQWtCLEVBQUUsRUFBRTtnQkFDekIsSUFBSSx5QkFBeUIsR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUU7b0JBQy9ELE9BQU8sa0JBQWtCLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNuRCxDQUFDLENBQUMsQ0FBQztnQkFDSCxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyx5QkFBeUIsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDNUUsQ0FBQyxDQUFDO2lCQUNELEtBQUssQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO2dCQUNiLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUMzQixPQUFPLEVBQUUsQ0FBQztZQUNkLENBQUMsQ0FBQyxDQUFDO1lBRVAsT0FBTyxhQUFhO2lCQUNmLElBQUksQ0FBQyxDQUFDLGlCQUFpQixFQUFFLEVBQUU7Z0JBQ3hCLHFEQUFxRDtnQkFDckQsb0JBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLGlCQUFpQixDQUFDLE1BQU0sWUFBWSxFQUFFLHdCQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBRzNGLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDaEQsSUFBSSxnQkFBZ0IsR0FBRyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDNUMsSUFBSSxVQUFVLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO29CQUMvQyxJQUFJLGlCQUFpQixHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDdEMsSUFBSSxnQkFBZ0IsR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxhQUFhLEVBQUUsRUFBRTt3QkFDNUQsSUFBSSxVQUFVLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQzt3QkFDNUMsSUFBSSxpQkFBaUIsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ3RDLE9BQU8saUJBQWlCLEtBQUssaUJBQWlCLENBQUM7b0JBQ25ELENBQUMsQ0FBQyxDQUFDO29CQUNILG9CQUFTLENBQUMsR0FBRyxDQUFDLHFCQUFxQixHQUFHLGlCQUFpQixFQUFFLHdCQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzVFLElBQUksYUFBYSxHQUFHLGdCQUFnQixDQUFDLGlCQUFpQixDQUFDLENBQUM7b0JBQ3hELElBQUksYUFBYSxHQUFHLEVBQUUsQ0FBQztvQkFDdkIsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO3dCQUNuQixhQUFhLEdBQUcsZ0JBQWdCLENBQUMsaUJBQWlCLENBQUMsQ0FBQztvQkFDeEQsQ0FBQztvQkFDRCxJQUFJLFFBQVEsR0FDUixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsaUJBQWlCLEdBQUcsNEJBQWEsQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDO29CQUM3RixvQkFBUyxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsR0FBRyxpQkFBaUIsRUFBRSx3QkFBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNyRixJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxhQUFhLEVBQUUsYUFBYSxDQUFDLENBQUM7b0JBQ3pELG9CQUFTLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLE9BQU8saUJBQWlCLENBQUMsTUFBTSxFQUFFLEVBQUUsd0JBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDN0YsQ0FBQztnQkFDRDs7OztRQUlSO2dCQUNRLHNCQUFzQjtnQkFDdEIsb0JBQVMsQ0FBQyxHQUFHLENBQUMscUJBQXFCLGlCQUFpQixDQUFDLE1BQU0sV0FBVyxFQUFFLHdCQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzFGLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUN2QixDQUFDLENBQUM7aUJBQ0QsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7Z0JBQ2Isb0JBQVMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2pDLENBQUMsQ0FBQyxDQUFDO1FBQ1gsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRU0sS0FBSyxDQUFDLGdCQUFnQixDQUFDLFlBQXNCLEVBQUUsV0FBVztRQUM3RCxJQUFJLENBQVMsRUFDVCxDQUFTLEVBQ1QsS0FBSyxHQUFHLEVBQUUsRUFDVixTQUFtQixDQUFDO1FBQ3hCLElBQUksZ0JBQWdCLEdBQUcsSUFBSSwwQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN6RCxJQUFJLGdCQUFnQixHQUFHLEVBQUUsQ0FBQztRQUMxQixJQUFJLFVBQVUsR0FBRyxXQUFXLENBQUMsYUFBYSxFQUFFLENBQUM7UUFFN0Msb0JBQVMsQ0FBQyxHQUFHLENBQ1QsY0FBYyxZQUFZLENBQUMsTUFBTSxrQkFBa0IsVUFBVSxDQUFDLFdBQVcsRUFBRSxFQUFFLEVBQzdFLHdCQUFXLENBQUMsSUFBSSxDQUNuQixDQUFDO1FBRUYsMENBQTBDO1FBRTFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUNyRCxTQUFTLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDO1lBRTdDLElBQUksbUJBQW1CLEdBQUcsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ25FLGdCQUFnQixDQUFDLElBQUksQ0FDakIsbUJBQW1CO2lCQUNkLElBQUksQ0FBQyxDQUFDLFlBQVksRUFBRSxFQUFFO2dCQUNuQixJQUFJLGFBQWEsR0FBRyxJQUFJLHVCQUFhLEVBQUUsQ0FBQztnQkFDeEMsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO2dCQUN0QixLQUFLLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLEdBQUcsWUFBWSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDO29CQUN2RCxtQ0FBbUM7b0JBQ25DLElBQUksVUFBVSxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQVksQ0FBQztvQkFFaEQsSUFBSSxVQUFVLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFDakQsWUFBWSxDQUFDLElBQUksQ0FBQzt3QkFDZCxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsRUFBRSxVQUFVO3FCQUNwQyxDQUFDLENBQUM7b0JBRUgsb0JBQVMsQ0FBQyxHQUFHLENBQUMsV0FBVyxVQUFVLENBQUMsUUFBUSxlQUFlLFlBQVksQ0FBQyxNQUFNLE9BQU8sWUFBWSxDQUFDLE1BQU0sR0FBRyxFQUFFLHdCQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBRW5JLENBQUM7Z0JBQ0QsT0FBTyxZQUFZLENBQUM7WUFDeEIsQ0FBQyxDQUFDO2lCQUNELEtBQUssQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO2dCQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM3QixvQkFBUyxDQUFDLEdBQUcsQ0FBQyx3REFBd0QsS0FBSyxDQUFDLE9BQU8sRUFBRSxFQUFFLHdCQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzFHLE9BQU8sRUFBRSxDQUFDO1lBQ2QsQ0FBQyxDQUFDLENBQ1QsQ0FBQztRQUNOLENBQUM7UUFDRCxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUM7YUFDL0IsSUFBSSxDQUFDLENBQUMsWUFBWSxFQUFFLEVBQUU7WUFDbkIsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDO1lBQ2xCLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtnQkFDMUIsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQzNCLENBQUMsQ0FBQyxDQUFDO1lBQ0gsb0JBQVMsQ0FBQyxHQUFHLENBQUMsMEJBQTBCLFFBQVEsQ0FBQyxNQUFNLFlBQVksRUFBRSx3QkFBVyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZGLE9BQU8sUUFBUSxDQUFDO1FBQ3BCLENBQUMsQ0FBQzthQUNELEtBQUssQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQ2Isb0JBQVMsQ0FBQyxHQUFHLENBQUMsd0RBQXdELEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFBRSx3QkFBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzFHLE9BQU8sRUFBRSxDQUFDO1FBQ2QsQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBRU8sV0FBVyxDQUFDLFFBQVEsRUFBRSxhQUFhLEVBQUUsYUFBYTtRQUN0RCxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUM7UUFFbkIsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2pCLElBQUksYUFBYSxHQUFHLEtBQUssQ0FBQztRQUMxQixJQUFJLGFBQWEsR0FBRyxLQUFLLENBQUM7UUFDMUIsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDO1FBRXJCLGtDQUFrQztRQUNsQyxJQUFJLFlBQVksR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ25ELElBQUksY0FBYyxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDckQsSUFBSSxZQUFZLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNsQyxPQUFPLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFCLGFBQWEsR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoRSxDQUFDO1FBRUQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksYUFBYSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ3RFLGFBQWEsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxhQUFhLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDaEYsQ0FBQztRQUVELElBQUksYUFBYSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUN0RSxhQUFhLEdBQUcsYUFBYSxHQUFHLE9BQU8sQ0FBQztRQUM1QyxDQUFDO1FBRUQsb0JBQVMsQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLHdCQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDakQsa0VBQWtFO1FBQ2xFLE1BQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDL0Qsb0JBQVMsQ0FBQyxHQUFHLENBQUMsdUNBQXVDLEVBQUUsd0JBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3pDLElBQUksTUFBTSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzQixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7WUFDZCxJQUFJLGFBQWEsR0FBRyxVQUFVLENBQUM7WUFFL0IsSUFBSSxTQUFTLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQztZQUMxQixJQUFJLFFBQVEsR0FBRyxTQUFTLENBQUM7WUFDekIsSUFBSSxhQUFhLENBQUMsTUFBTSxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUNwQyxRQUFRLEdBQUcsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3hDLENBQUM7WUFDRCxJQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEIsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXZCLElBQUksTUFBTSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ2hCLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7b0JBQzNCLEtBQUssR0FBRyxLQUFLLEdBQUcsT0FBTyxDQUFDO2dCQUM1QixDQUFDO2dCQUNELElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRSxDQUFDO29CQUN6QixJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQzt3QkFDcEIsT0FBTzs0QkFDSCxPQUFPO2dDQUNQLFdBQVcsSUFBSSxDQUFDLFdBQVcsSUFBSSxRQUFRLEtBQUssS0FBSyxvQkFBb0IsSUFBSSxDQUFDLFdBQVcsSUFBSSxRQUFRLElBQUksQ0FBQzt3QkFDMUcsYUFBYSxHQUFHLElBQUksQ0FBQztvQkFDekIsQ0FBQzt5QkFBTSxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQzt3QkFDM0IsT0FBTyxHQUFHLE9BQU8sR0FBRyxXQUFXLElBQUksQ0FBQyxXQUFXLElBQUksUUFBUSxLQUFLLEtBQUssV0FBVyxDQUFDO3dCQUNqRixRQUFRLEdBQUcsSUFBSSxDQUFDO29CQUNwQixDQUFDO2dCQUNMLENBQUM7cUJBQU0sQ0FBQztvQkFDSixPQUFPO3dCQUNILE9BQU87NEJBQ1AsV0FBVyxJQUFJLENBQUMsV0FBVyxJQUFJLFFBQVEsS0FBSyxLQUFLLG9CQUFvQixJQUFJLENBQUMsV0FBVyxJQUFJLFFBQVEsSUFBSSxDQUFDO29CQUMxRyxhQUFhLEdBQUcsSUFBSSxDQUFDO2dCQUN6QixDQUFDO1lBQ0wsQ0FBQztpQkFBTSxJQUFJLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDdEIsSUFBSSxRQUFRLEVBQUUsQ0FBQztvQkFDWCxPQUFPLEdBQUcsT0FBTyxHQUFHLEdBQUcsS0FBSyxXQUFXLElBQUksQ0FBQyxXQUFXLElBQUksUUFBUSxJQUFJLENBQUM7b0JBQ3hFLFFBQVEsR0FBRyxJQUFJLENBQUM7Z0JBQ3BCLENBQUM7cUJBQU0sQ0FBQztvQkFDSixPQUFPO3dCQUNILE9BQU87NEJBQ1AsV0FBVyxJQUFJLENBQUMsV0FBVyxJQUFJLFFBQVEsY0FBYyxLQUFLLFdBQVcsSUFBSSxDQUFDLFdBQVcsSUFBSSxRQUFRLElBQUksQ0FBQztvQkFDMUcsYUFBYSxHQUFHLElBQUksQ0FBQztnQkFDekIsQ0FBQztZQUNMLENBQUM7aUJBQU0sQ0FBQztnQkFDSixPQUFPLEdBQUcsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUM5QixDQUFDO1FBQ0wsQ0FBQztRQUNELG9CQUFTLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFLHdCQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFckQsRUFBRSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFcEMsSUFBSSxNQUFNLEdBQUcsV0FBVyxDQUFDO1FBQ3pCLElBQUksUUFBUSxJQUFJLENBQUMsYUFBYSxJQUFJLGFBQWEsQ0FBQyxFQUFFLENBQUM7WUFDL0MsTUFBTSxHQUFHLFVBQVUsQ0FBQztRQUN4QixDQUFDO2FBQU0sSUFBSSxhQUFhLEVBQUUsQ0FBQztZQUN2QixNQUFNLEdBQUcsZUFBZSxDQUFDO1FBQzdCLENBQUM7YUFBTSxJQUFJLGFBQWEsRUFBRSxDQUFDO1lBQ3ZCLE1BQU0sR0FBRyxjQUFjLENBQUM7UUFDNUIsQ0FBQztRQUVELElBQUksUUFBUSxHQUFHLDJCQUFZLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM3RCxJQUFJLE1BQU0sR0FBRyx1QkFBYSxDQUFDLHlCQUF5QixDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN6RSxJQUFJLFFBQVEsSUFBSSxhQUFhLElBQUksYUFBYSxFQUFFLENBQUM7WUFDN0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7Z0JBQ2IsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsWUFBWSxFQUFFLFFBQVE7Z0JBQ3RCLGFBQWEsRUFBRSxNQUFNO2dCQUNyQixJQUFJLEVBQUUsUUFBUTthQUNqQixDQUFDLENBQUM7UUFDUCxDQUFDO0lBQ0wsQ0FBQztDQUNKO0FBMVVELGtDQTBVQyJ9
