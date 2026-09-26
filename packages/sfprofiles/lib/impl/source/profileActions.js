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
const sfpowerkit_1 = require("../../utils/sfpowerkit");
const sfp_logger_1 = __importStar(require("@flxbl-io/sfp-logger"));
const path = __importStar(require("path"));
const fileutils_1 = __importDefault(require("../../utils/fileutils"));
const retrieveMetadata_1 = require("../../utils/retrieveMetadata");
const core_1 = require("@salesforce/core");
const profileRetriever_1 = __importDefault(require("../metadata/retriever/profileRetriever"));
const source_deploy_retrieve_1 = require("@salesforce/source-deploy-retrieve");
const common_1 = require("@salesforce/source-deploy-retrieve/lib/src/common");
const metadataRetriever_1 = __importDefault(require("../metadata/retriever/metadataRetriever"));
class ProfileActions {
    constructor(org) {
        this.org = org;
        //TODO: Figure out from registry?
        this.profileFileExtension = '.' + source_deploy_retrieve_1.registry.types.profile.suffix + common_1.META_XML_SUFFIX;
        if (this.org) {
            this.conn = this.org.getConnection();
            this.profileRetriever = new profileRetriever_1.default(org.getConnection());
        }
    }
    async getRemoteProfilesWithLocalStatus(profileNames, packageDirectories) {
        let profilesStatus = {};
        profilesStatus.added = [];
        profilesStatus.updated = [];
        profilesStatus.deleted = [];
        //Load all local profiles
        let localProfiles = await this.loadProfileFromPackageDirectories(packageDirectories);
        //generate default path for new profiles
        let profilePath = path.join(await sfpowerkit_1.Sfpowerkit.getDefaultFolder(), 'main', 'default', 'profiles');
        //create folder structure
        fileutils_1.default.mkDirByPathSync(profilePath);
        // Query the profiles from org
        const remoteProfiles = await (0, retrieveMetadata_1.retrieveMetadata)([{ type: 'Profile', folder: null }], this.conn);
        if (profileNames && profileNames.length > 0) {
            for (let i = 0; i < profileNames.length; i++) {
                let profileName = profileNames[i];
                let found = false;
                for (let j = 0; j < localProfiles.length; j++) {
                    if (profileName === localProfiles[j].name && remoteProfiles.includes(profileName)) {
                        profilesStatus.updated.push(localProfiles[j]);
                        found = true;
                    }
                }
                if (!found) {
                    for (let k = 0; k < remoteProfiles.length; k++) {
                        if (remoteProfiles[k] === profileName) {
                            let newProfilePath = path.join(profilePath, remoteProfiles[k] + this.profileFileExtension);
                            profilesStatus.added.push({ path: newProfilePath, name: profileName });
                            found = true;
                            break;
                        }
                    }
                }
                if (!found) {
                    profilesStatus.deleted.push({ name: profileName });
                    sfp_logger_1.default.log(`Profile ${profileName} not found in the org`, sfp_logger_1.LoggerLevel.WARN);
                }
            }
        }
        else {
            sfp_logger_1.default.log('Load new profiles from server into the project directory', sfp_logger_1.LoggerLevel.DEBUG);
            profilesStatus.deleted = localProfiles.filter((profile) => {
                return !remoteProfiles.includes(profile.name);
            });
            profilesStatus.updated = localProfiles.filter((profile) => {
                return remoteProfiles.includes(profile.name);
            });
            if (remoteProfiles && remoteProfiles.length > 0) {
                let newProfiles = remoteProfiles.filter((profileObj) => {
                    let found = false;
                    for (let i = 0; i < profilesStatus.updated.length; i++) {
                        let fileName = profilesStatus.updated[i].name;
                        //escape some caracters
                        let onlineName = profileObj.replace("'", '%27');
                        onlineName = onlineName.replace('/', '%2F');
                        if (onlineName === fileName) {
                            found = true;
                            break;
                        }
                    }
                    return !found;
                });
                if (newProfiles && newProfiles.length > 0) {
                    sfp_logger_1.default.log('New profiles founds', sfp_logger_1.LoggerLevel.DEBUG);
                    for (let i = 0; i < newProfiles.length; i++) {
                        sfp_logger_1.default.log(newProfiles[i], sfp_logger_1.LoggerLevel.DEBUG);
                        let newProfilePath = path.join(profilePath, newProfiles[i] + this.profileFileExtension);
                        profilesStatus.added.push({ path: newProfilePath, name: newProfiles[i] });
                    }
                }
                else {
                    sfp_logger_1.default.log('No new profile found, Updating existing profiles', sfp_logger_1.LoggerLevel.INFO);
                }
            }
        }
        return profilesStatus;
    }
    async loadProfileFromPackageDirectories(packageDirectories) {
        let resolver = new source_deploy_retrieve_1.MetadataResolver();
        let profiles = [];
        //If packageDirectories are not mentioned, fetch all package directories
        if (!packageDirectories || packageDirectories.length == 0) {
            const project = await core_1.SfProject.resolve();
            packageDirectories = new Array();
            for (const packageDirectory of project.getPackageDirectories()) {
                packageDirectories.push(packageDirectory.path);
            }
        }
        //For each package directory, collect profiles
        for (const packageDirectory of packageDirectories) {
            profiles = profiles.concat(resolver.getComponentsFromPath(packageDirectory, new source_deploy_retrieve_1.ComponentSet([{ fullName: '*', type: source_deploy_retrieve_1.registry.types.profile.name }])));
        }
        let profileSourceFile = profiles.map((elem) => {
            return { path: elem.xml, name: elem.name };
        });
        return profileSourceFile;
    }
    async reconcileTabs(profileObj) {
        let tabRetriever = new metadataRetriever_1.default(this.org.getConnection(), source_deploy_retrieve_1.registry.types.customtab.name);
        if (profileObj.tabVisibilities !== undefined) {
            if (!Array.isArray(profileObj.tabVisibilities)) {
                profileObj.tabVisibilities = [profileObj.tabVisibilities];
            }
            let validArray = [];
            for (let i = 0; i < profileObj.tabVisibilities.length; i++) {
                let cmpObj = profileObj.tabVisibilities[i];
                let exist = await tabRetriever.isComponentExistsInProjectDirectoryOrInOrg(cmpObj.tab);
                if (exist) {
                    validArray.push(cmpObj);
                }
            }
            sfpowerkit_1.Sfpowerkit.log(`Tab Visibilities reduced from ${profileObj.tabVisibilities.length}  to  ${validArray.length}`, sfp_logger_1.LoggerLevel.DEBUG);
            profileObj.tabVisibilities = validArray;
        }
    }
}
exports.default = ProfileActions;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZmlsZUFjdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvaW1wbC9zb3VyY2UvcHJvZmlsZUFjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGtEQUErQztBQUMvQyxtRUFBNkQ7QUFDN0QsMkNBQTZCO0FBQzdCLGlFQUF5QztBQUN6Qyw4REFBMkQ7QUFDM0QsMkNBQThEO0FBQzlELGlHQUF5RTtBQUN6RSwrRUFBK0c7QUFDL0csOEVBQW9GO0FBRXBGLG1HQUEyRTtBQUUzRSxNQUE4QixjQUFjO0lBT3hDLFlBQTBCLEdBQVE7UUFBUixRQUFHLEdBQUgsR0FBRyxDQUFLO1FBSGxDLGlDQUFpQztRQUNqQyx5QkFBb0IsR0FBRyxHQUFHLEdBQUcsaUNBQVEsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyx3QkFBZSxDQUFDO1FBR3pFLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ1gsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3JDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLDBCQUFnQixDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDO1FBQ3RFLENBQUM7SUFDTCxDQUFDO0lBRVMsS0FBSyxDQUFDLGdDQUFnQyxDQUM1QyxZQUFzQixFQUN0QixrQkFBNkI7UUFFN0IsSUFBSSxjQUFjLEdBQWtCLEVBQW1CLENBQUM7UUFDeEQsY0FBYyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7UUFDMUIsY0FBYyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDNUIsY0FBYyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFFNUIseUJBQXlCO1FBQ3pCLElBQUksYUFBYSxHQUFHLE1BQU0sSUFBSSxDQUFDLGlDQUFpQyxDQUFDLGtCQUFrQixDQUFDLENB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