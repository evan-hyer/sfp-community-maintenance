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
const sfp_logger_1 = __importStar(require("@flxbl-io/sfp-logger"));
const fs = __importStar(require("fs-extra"));
const _ = __importStar(require("lodash"));
const profileActions_1 = __importDefault(require("./profileActions"));
const profileWriter_1 = __importDefault(require("../metadata/writer/profileWriter"));
const path = __importStar(require("path"));
class ProfileSync extends profileActions_1.default {
    async sync(srcFolders, profilesToSync, isdelete) {
        sfp_logger_1.default.log('Retrieving profiles', sfp_logger_1.LoggerLevel.DEBUG);
        //Display provided profiles if any
        if (!_.isNil(profilesToSync) && profilesToSync.length !== 0) {
            sfp_logger_1.default.log('Requested  profiles are..', sfp_logger_1.LoggerLevel.DEBUG);
            profilesToSync.forEach((element) => {
                sfp_logger_1.default.log(element, sfp_logger_1.LoggerLevel.DEBUG);
            });
        }
        //Fetch all profiles if source folders if not provided
        const isToFetchNewProfiles = _.isNil(srcFolders) || srcFolders.length === 0;
        sfp_logger_1.default.log('Source Folders are', sfp_logger_1.LoggerLevel.DEBUG);
        srcFolders.forEach((element) => {
            sfp_logger_1.default.log(element, sfp_logger_1.LoggerLevel.DEBUG);
        });
        //get local profiles when profile path is provided
        const profilesInProjectDir = await this.loadProfileFromPackageDirectories(srcFolders);
        //If dont fetch add those to profilesToSync
        if (!isToFetchNewProfiles && profilesToSync.length < 1) {
            profilesInProjectDir.forEach((element) => {
                profilesToSync.push(element.name);
            });
        }
        //Grab status of the profiles (Add, Update or Delete)
        const profileStatus = await this.getRemoteProfilesWithLocalStatus(profilesToSync, srcFolders);
        let profilesToRetrieve = [];
        if (isToFetchNewProfiles) {
            //Retriving local profiles and anything extra found in the org
            profilesToRetrieve = _.union(profileStatus.added, profileStatus.updated);
        }
        else {
            //Retriving only local profiles
            profilesToRetrieve = profileStatus.updated;
            profileStatus.added = [];
        }
        profilesToRetrieve.sort((a, b) => a.name.localeCompare(b.name));
        sfp_logger_1.default.log(`Number of profiles to retrieve ${profilesToRetrieve.length}`, sfp_logger_1.LoggerLevel.INFO);
        if (profilesToRetrieve.length > 0) {
            let i, j;
            const chunk = 10;
            let profilesToRetrieveChunked = [];
            sfp_logger_1.default.log(`Beginning retrieval of ${profilesToRetrieve} profiles.`, sfp_logger_1.LoggerLevel.DEBUG);
            for (i = 0, j = profilesToRetrieve.length; i < j; i += chunk) {
                const chunkSize = (j - i > chunk ? chunk : j - i);
                sfp_logger_1.default.log(`Reconciling ${chunkSize}`, sfp_logger_1.LoggerLevel.DEBUG);
                //slice profilesToRetrieve in chunk
                profilesToRetrieveChunked = profilesToRetrieve.slice(i, i + chunk);
                const remoteProfiles = await this.profileRetriever.loadProfiles(_.uniq(profilesToRetrieveChunked.map((elem) => {
                    return elem.name;
                })));
                const profileWriter = new profileWriter_1.default();
                for (let count = 0; count < remoteProfiles.length; count++) {
                    const profileObj = remoteProfiles[count];
                    sfp_logger_1.default.log(`Reconciling profile ${profileObj.fullName} (${i + count} of ${profilesToRetrieve})`, sfp_logger_1.LoggerLevel.DEBUG);
                    sfp_logger_1.default.log('Reconciling Tabs', sfp_logger_1.LoggerLevel.DEBUG);
                    await this.reconcileTabs(profileObj);
                    //Find correct profile path, so that remote could be overlaid
                    const indices = _.keys(_.pickBy(profilesToRetrieveChunked, { name: profileObj.fullName }));
                    for (const index of indices) {
                        const filePath = profilesToRetrieveChunked[index].path;
                        if (filePath) {
                            profileWriter.writeProfile(profileObj, path.join(process.cwd(), profilesToRetrieveChunked[index].path));
                        }
                        else {
                            sfp_logger_1.default.log('File path not found...', sfp_logger_1.LoggerLevel.DEBUG);
                        }
                    }
                }
            }
            // progressBar.stop();
            sfp_logger_1.default.log('Profile retrieval completed.');
        }
        else {
            sfp_logger_1.default.log(`No Profiles found to retrieve`, sfp_logger_1.LoggerLevel.INFO);
        }
        if (profileStatus.deleted && isdelete) {
            profileStatus.deleted.forEach((profile) => {
                if (fs.existsSync(path.join(process.cwd(), profile.path))) {
                    fs.unlinkSync(path.join(process.cwd(), profile.path));
                }
            });
        }
        //Return final status
        return profileStatus;
    }
}
exports.default = ProfileSync;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZmlsZVN5bmMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvaW1wbC9zb3VyY2UvcHJvZmlsZVN5bmMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLG1FQUE4RDtBQUM5RCw2Q0FBK0I7QUFFL0IsMENBQTRCO0FBQzVCLHNFQUFvRjtBQUNwRix3RkFBZ0U7QUFHaEUsMkNBQTZCO0FBRzdCLE1BQXFCLFdBQVksU0FBUSx3QkFBYztJQUM1QyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQW9CLEVBQUUsY0FBeUIsRUFBRSxRQUFrQjtRQUNqRixvQkFBUyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSx3QkFBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRXhELGtDQUFrQztRQUNsQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBSSxjQUFjLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQzFELG9CQUFTLENBQUMsR0FBRyxDQUFDLDJCQUEyQixFQUFFLHdCQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUQsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO2dCQUMvQixvQkFBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsd0JBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM5QyxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUM7UUFFRCxzREFBc0Q7UUFDdEQsTUFBTSxvQkFBb0IsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDO1FBRTVFLG9CQUFTLENBQUMsR0FBRyxDQUFDLG9CQUFvQixFQUFFLHdCQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkQsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO1lB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