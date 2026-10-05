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
const metadataFiles_1 = __importDefault(require("../metadata/metadataFiles"));
const fs = __importStar(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const xml2js_1 = __importDefault(require("xml2js"));
const lodash_1 = __importDefault(require("lodash"));
const util = __importStar(require("util"));
const profileActions_1 = __importDefault(require("./profileActions"));
const profileWriter_1 = __importDefault(require("../metadata/writer/profileWriter"));
const sfp_logger_1 = __importStar(require("@flxbl-io/sfp-logger"));
const unsupportedprofiles = [];
class ProfileMerge extends profileActions_1.default {
    mergeApps(profileObj, applicationVisibilities) {
        if (profileObj.applicationVisibilities === null || profileObj.applicationVisibilities === undefined) {
            profileObj.applicationVisibilities = [];
        }
        else if (!Array.isArray(profileObj.applicationVisibilities)) {
            profileObj.applicationVisibilities = [profileObj.applicationVisibilities];
        }
        for (let i = 0; i < applicationVisibilities.length; i++) {
            let appVisibility = applicationVisibilities[i];
            let found = false;
            for (let j = 0; j < profileObj.applicationVisibilities.length; j++) {
                if (appVisibility.application === profileObj.applicationVisibilities[j].application) {
                    profileObj.applicationVisibilities[j].default = appVisibility.default;
                    profileObj.applicationVisibilities[j].visible = appVisibility.visible;
                    found = true;
                    break;
                }
            }
            if (!found) {
                profileObj.applicationVisibilities.push(appVisibility);
            }
        }
        profileObj.applicationVisibilities.sort((app1, app2) => {
            let order = 0;
            if (app1.application < app2.application) {
                order = -1;
            }
            else if (app1.application > app2.application) {
                order = 1;
            }
            return order;
        });
        return profileObj;
    }
    mergeClasses(profileObj, classes) {
        if (profileObj.classAccesses === null || profileObj.classAccesses === undefined) {
            profileObj.classAccesses = [];
        }
        else if (!Array.isArray(profileObj.classAccesses)) {
            profileObj.classAccesses = [profileObj.classAccesses];
        }
        for (let i = 0; i < classes.length; i++) {
            let classAccess = classes[i];
            let found = false;
            for (let j = 0; j < profileObj.classAccesses.length; j++) {
                if (classAccess.apexClass === profileObj.classAccesses[j].apexClass) {
                    profileObj.classAccesses[j].enabled = classAccess.enabled;
                    found = true;
                    break;
                }
            }
            if (!found) {
                profileObj.classAccesses.push(classAccess);
            }
        }
        profileObj.classAccesses.sort((class1, class2) => {
            let order = 0;
            if (class1.apexClass < class2.apexClass) {
                order = -1;
            }
            else if (class1.apexClass > class2.apexClass) {
                order = 1;
            }
            return order;
        });
        return profileObj;
    }
    mergeFields(profileObj, fieldPermissions) {
        if (profileObj.fieldPermissions === null || profileObj.fieldPermissions === undefined) {
            profileObj.fieldPermissions = [];
        }
        else if (!Array.isArray(profileObj.fieldPermissions)) {
            profileObj.fieldPermissions = [profileObj.fieldPermissions];
        }
        for (let i = 0; i < fieldPermissions.length; i++) {
            let fieldPermission = fieldPermissions[i];
            let found = false;
            for (let j = 0; j < profileObj.fieldPermissions.length; j++) {
                if (fieldPermission.field === profileObj.fieldPermissions[j].field) {
                    profileObj.fieldPermissions[j].editable = fieldPermission.editable;
                    if (fieldPermission.hidden !== undefined && fieldPermission.hidden !== null) {
                        profileObj.fieldPermissions[j].hidden = fieldPermission.hidden;
                    }
                    profileObj.fieldPermissions[j].readable = fieldPermission.readable;
                    found = true;
                    break;
                }
            }
            if (!found) {
                profileObj.fieldPermissions.push(fieldPermission);
            }
        }
        profileObj.fieldPermissions.sort((field1, field2) => {
            let order = 0;
            if (field1.field < field2.field) {
                order = -1;
            }
            else if (field1.field > field2.field) {
                order = 1;
            }
            return order;
        });
        return profileObj;
    }
    mergeLayouts(profileObj, layoutAssignments) {
        if (profileObj.layoutAssignments === null || profileObj.layoutAssignments === undefined) {
            profileObj.layoutAssignments = [];
        }
        else if (!Array.isArray(profileObj.layoutAssignments)) {
            profileObj.layoutAssignments = [profileObj.layoutAssignments];
        }
        for (let i = 0; i < layoutAssignments.length; i++) {
            let layoutAssignment = layoutAssignments[i];
            let objName = layoutAssignment.layout.split('-')[0];
            profileObj.layoutAssignments = profileObj.layoutAssignments.filter((layoutAss) => {
                const otherObjName = layoutAss.layout.split('-')[0];
                return objName !== otherObjName;
            });
        }
        for (let i = 0; i < layoutAssignments.length; i++) {
            let layoutAssignment = layoutAssignments[i];
            let found = false;
            for (let j = 0; j < profileObj.layoutAssignments.length; j++) {
                if (layoutAssignment.layout === profileObj.layoutAssignments[j].layout &&
                    layoutAssignment.recordType === profileObj.layoutAssignments[j].recordType) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                profileObj.layoutAssignments.push(layoutAssignment);
            }
        }
        profileObj.layoutAssignments.sort((layout1, layout2) => {
            let order = 0;
            if (layout1.layout === layout2.layout) {
                if (layout1.recordType === undefined) {
                    order = -1;
                }
                else if (layout1.recordType < layout2.recordType) {
                    order = -1;
                }
                else {
                    order = 1;
                }
            }
            else {
                if (layout1.layout < layout2.layout) {
                    order = -1;
                }
                else if (layout1.layout > layout2.layout) {
                    order = 1;
                }
            }
            return order;
        });
        return profileObj;
    }
    mergeObjects(profileObj, objectPermissions) {
        if (profileObj.objectPermissions === null || profileObj.objectPermissions === undefined) {
            profileObj.objectPermissions = [];
        }
        else if (!Array.isArray(profileObj.objectPermissions)) {
            profileObj.objectPermissions = [profileObj.objectPermissions];
        }
        for (let i = 0; i < objectPermissions.length; i++) {
            let objPerm = objectPermissions[i];
            let found = false;
            for (let j = 0; j < profileObj.objectPermissions.length; j++) {
                if (objPerm.object === profileObj.objectPermissions[j].object) {
                    profileObj.objectPermissions[j].allowCreate = objPerm.allowCreate;
                    profileObj.objectPermissions[j].allowDelete = objPerm.allowDelete;
                    profileObj.objectPermissions[j].allowEdit = objPerm.allowEdit;
                    profileObj.objectPermissions[j].allowRead = objPerm.allowRead;
                    profileObj.objectPermissions[j].modifyAllRecords = objPerm.modifyAllRecords;
                    profileObj.objectPermissions[j].viewAllRecords = objPerm.viewAllRecords;
                    found = true;
                    break;
                }
            }
            if (!found) {
                profileObj.objectPermissions.push(objPerm);
            }
        }
        profileObj.objectPermissions.sort((obj1, obj2) => {
            let order = 0;
            if (obj1.object < obj2.object) {
                order = -1;
            }
            else if (obj1.object > obj2.object) {
                order = 1;
            }
            return order;
        });
        return profileObj;
    }
    mergePages(profileObj, pages) {
        if (profileObj.pageAccesses === null || profileObj.pageAccesses === undefined) {
            profileObj.pageAccesses = [];
        }
        else if (!Array.isArray(profileObj.pageAccesses)) {
            profileObj.pageAccesses = [profileObj.pageAccesses];
        }
        for (let i = 0; i < pages.length; i++) {
            let page = pages[i];
            let found = false;
            for (let j = 0; j < profileObj.pageAccesses.length; j++) {
                if (page.apexPage === profileObj.pageAccesses[j].apexPage) {
                    profileObj.pageAccesses[j].enabled = page.enabled;
                    found = true;
                    break;
                }
            }
            if (!found) {
                profileObj.pageAccesses.push(page);
            }
        }
        profileObj.pageAccesses.sort((page1, page2) => {
            let order = 0;
            if (page1.apexPage < page2.apexPage) {
                order = -1;
            }
            else if (page1.apexPage > page2.apexPage) {
                order = 1;
            }
            return order;
        });
        return profileObj;
    }
    mergeRecordTypes(profileObj, recordTypes) {
        if (profileObj.recordTypeVisibilities === null || profileObj.recordTypeVisibilities === undefined) {
            profileObj.recordTypeVisibilities = [];
        }
        else if (!Array.isArray(profileObj.recordTypeVisibilities)) {
            profileObj.recordTypeVisibilities = [profileObj.recordTypeVisibilities];
        }
        for (let i = 0; i < recordTypes.length; i++) {
            let recordType = recordTypes[i];
            let found = false;
            for (let j = 0; j < profileObj.recordTypeVisibilities.length; j++) {
                if (recordType.recordType === profileObj.recordTypeVisibilities[j].recordType) {
                    profileObj.recordTypeVisibilities[j].default = recordType.default;
                    if (recordType.personAccountDefault !== undefined && recordType.personAccountDefault !== null) {
                        profileObj.recordTypeVisibilities[j].personAccountDefault = recordType.personAccountDefault;
                    }
                    profileObj.recordTypeVisibilities[j].visible = recordType.visible;
                    found = true;
                    break;
                }
            }
            if (!found) {
                profileObj.recordTypeVisibilities.push(recordType);
            }
        }
        profileObj.recordTypeVisibilities.sort((recordtype1, recordtype2) => {
            let order = 0;
            if (recordtype1.recordType < recordtype2.recordType) {
                order = -1;
            }
            else if (recordtype1.recordType > recordtype2.recordType) {
                order = 1;
            }
            return order;
        });
        return profileObj;
    }
    mergeTabs(profileObj, tabs) {
        if (profileObj.tabVisibilities === null || profileObj.tabVisibilities === undefined) {
            profileObj.tabVisibilities = [];
        }
        else if (!Array.isArray(profileObj.tabVisibilities)) {
            profileObj.tabVisibilities = [profileObj.tabVisibilities];
        }
        for (let i = 0; i < tabs.length; i++) {
            let tab = tabs[i];
            let found = false;
            for (let j = 0; j < profileObj.tabVisibilities.length; j++) {
                if (tab.tab === profileObj.tabVisibilities[j].tab) {
                    profileObj.tabVisibilities[j].visibility = tab.visibility;
                    found = true;
                    break;
                }
            }
            if (!found) {
                profileObj.tabVisibilities.push(tab);
            }
        }
        profileObj.tabVisibilities.sort((tab1, tab2) => {
            let order = 0;
            if (tab1.tab < tab2.tab) {
                order = -1;
            }
            else if (tab1.tab > tab2.tab) {
                order = 1;
            }
            return order;
        });
        return profileObj;
    }
    mergePermissions(profileObj, permissions) {
        if (profileObj.userPermissions === null || profileObj.userPermissions === undefined) {
            profileObj.userPermissions = [];
        }
        else if (!Array.isArray(profileObj.userPermissions)) {
            profileObj.userPermissions = [profileObj.userPermissions];
        }
        for (let i = 0; i < permissions.length; i++) {
            let perm = permissions[i];
            let found = false;
            for (let j = 0; j < profileObj.userPermissions.length; j++) {
                if (perm.name === profileObj.userPermissions[j].name) {
                    profileObj.userPermissions[j].enabled = perm.enabled;
                    found = true;
                    break;
                }
            }
            if (!found) {
                profileObj.userPermissions.push(perm);
            }
        }
        profileObj.userPermissions.sort((perm1, perm2) => {
            let order = 0;
            if (perm1.name < perm2.name) {
                order = -1;
            }
            else if (perm1.name > perm2.name) {
                order = 1;
            }
            return order;
        });
        return profileObj;
    }
    mergeCustomPermissions(profileObj, permissions) {
        if (profileObj.customPermissions === null || profileObj.customPermissions === undefined) {
            profileObj.customPermissions = [];
        }
        else if (!Array.isArray(profileObj.customPermissions)) {
            profileObj.customPermissions = [profileObj.customPermissions];
        }
        for (let i = 0; i < permissions.length; i++) {
            let perm = permissions[i];
            let found = false;
            for (let j = 0; j < profileObj.customPermissions.length; j++) {
                if (perm.name === profileObj.customPermissions[j].name) {
                    profileObj.customPermissions[j].enabled = perm.enabled;
                    found = true;
                    break;
                }
            }
            if (!found) {
                profileObj.customPermissions.push(perm);
            }
        }
        profileObj.customPermissions.sort((perm1, perm2) => {
            let order = 0;
            if (perm1.name < perm2.name) {
                order = -1;
            }
            else if (perm1.name > perm2.name) {
                order = 1;
            }
            return order;
        });
        return profileObj;
    }
    mergeCustomMetadataAccesses(profileObj, custonMetadataAccesses) {
        if (profileObj.customMetadataTypeAccesses === null || profileObj.customMetadataTypeAccesses === undefined) {
            profileObj.customMetadataTypeAccesses = [];
        }
        else if (!Array.isArray(profileObj.customMetadataTypeAccesses)) {
            profileObj.customMetadataTypeAccesses = [profileObj.customMetadataTypeAccesses];
        }
        for (let i = 0; i < custonMetadataAccesses.length; i++) {
            let customMetadata = custonMetadataAccesses[i];
            let found = false;
            for (let j = 0; j < profileObj.customMetadataTypeAccesses.length; j++) {
                if (customMetadata.name === profileObj.customMetadataTypeAccesses[j].name) {
                    profileObj.customMetadataTypeAccesses[j].enabled = customMetadata.enabled;
                    found = true;
                    break;
                }
            }
            if (!found) {
                profileObj.customMetadataTypeAccesses.push(customMetadata);
            }
        }
        profileObj.customMetadataTypeAccesses.sort((cm1, cm2) => {
            let order = 0;
            if (cm1.name < cm2.name) {
                order = -1;
            }
            else if (cm1.name > cm2.name) {
                order = 1;
            }
            return order;
        });
        return profileObj;
    }
    mergeCustomSettingAccesses(profileObj, customSettingAccesses) {
        if (profileObj.customSettingAccesses === null || profileObj.customSettingAccesses === undefined) {
            profileObj.customSettingAccesses = [];
        }
        else if (!Array.isArray(profileObj.customSettingAccesses)) {
            profileObj.customSettingAccesses = [profileObj.customSettingAccesses];
        }
        for (let i = 0; i < customSettingAccesses.length; i++) {
            let customSetting = customSettingAccesses[i];
            let found = false;
            for (let j = 0; j < profileObj.customSettingAccesses.length; j++) {
                if (customSetting.name === profileObj.customSettingAccesses[j].name) {
                    profileObj.customSettingAccesses[j].enabled = customSetting.enabled;
                    found = true;
                    break;
                }
            }
            if (!found) {
                profileObj.customSettingAccesses.push(customSetting);
            }
        }
        profileObj.customSettingAccesses.sort((cs1, cs2) => {
            let order = 0;
            if (cs1.name < cs2.name) {
                order = -1;
            }
            else if (cs1.name > cs2.name) {
                order = 1;
            }
            return order;
        });
        return profileObj;
    }
    mergeFlowAccesses(profileObj, flowAccesses) {
        if (profileObj.flowAccesses === null || profileObj.flowAccesses === undefined) {
            profileObj.flowAccesses = [];
        }
        else if (!Array.isArray(profileObj.flowAccesses)) {
            profileObj.flowAccesses = [profileObj.flowAccesses];
        }
        for (let i = 0; i < flowAccesses.length; i++) {
            let flowAccess = flowAccesses[i];
            let found = false;
            for (let j = 0; j < profileObj.flowAccesses.length; j++) {
                if (flowAccess.flow === profileObj.flowAccesses[j].flow) {
                    profileObj.flowAccesses[j].enabled = flowAccess.enabled;
                    found = true;
                    break;
                }
            }
            if (!found) {
                profileObj.flowAccesses.push(flowAccess);
            }
        }
        profileObj.flowAccesses.sort((flow1, flow2) => {
            let order = 0;
            if (flow1.flow < flow2.flow) {
                order = -1;
            }
            else if (flow1.flow > flow2.flow) {
                order = 1;
            }
            return order;
        });
        return profileObj;
    }
    mergeLoginFlows(profileObj, loginFlows) {
        if (!Array.isArray(loginFlows)) {
            loginFlows = [loginFlows];
        }
        if (profileObj.loginFlows === null || profileObj.loginFlows === undefined) {
            profileObj.loginFlows = [];
        }
        else if (!Array.isArray(profileObj.loginFlows)) {
            profileObj.loginFlows = [profileObj.loginFlows];
        }
        for (let i = 0; i < loginFlows.length; i++) {
            let loginFlow = loginFlows[i];
            let found = false;
            for (let j = 0; j < profileObj.loginFlows.length; j++) {
                if (loginFlow.flow === profileObj.loginFlows[j].flow && loginFlow.flow !== undefined) {
                    profileObj.loginFlows[j].flowType = loginFlow.flowType;
                    profileObj.loginFlows[j].friendlyName = loginFlow.friendlyName;
                    profileObj.loginFlows[j].uiLoginFlowType = loginFlow.uiLoginFlowType;
                    profileObj.loginFlows[j].useLightningRuntime = loginFlow.useLightningRuntime;
                    delete profileObj.loginFlows[j].vfFlowPageTitle;
                    delete profileObj.loginFlows[j].vfFlowPage;
                    found = true;
                    break;
                }
                else if (loginFlow.vfFlowPage === profileObj.loginFlows[j].vfFlowPage &&
                    loginFlow.vfFlowPage !== undefined) {
                    profileObj.loginFlows[j].flowType = loginFlow.flowType;
                    profileObj.loginFlows[j].friendlyName = loginFlow.friendlyName;
                    profileObj.loginFlows[j].uiLoginFlowType = loginFlow.uiLoginFlowType;
                    profileObj.loginFlows[j].useLightningRuntime = loginFlow.useLightningRuntime;
                    profileObj.loginFlows[j].vfFlowPageTitle = loginFlow.vfFlowPageTitle;
                    delete profileObj.loginFlows[j].flow;
                    found = true;
                    break;
                }
            }
            if (!found) {
                profileObj.loginFlows.push(loginFlow);
            }
        }
        profileObj.loginFlows.sort((flow1, flow2) => {
            let order = 0;
            if (flow1.flow < flow2.flow) {
                order = -1;
            }
            else if (flow1.flow > flow2.flow) {
                order = 1;
            }
            return order;
        });
        return profileObj;
    }
    mergeExternalDatasourceAccesses(profileObj, externalDatasources) {
        if (profileObj.externalDataSourceAccesses === null || profileObj.externalDataSourceAccesses === undefined) {
            profileObj.externalDataSourceAccesses = [];
        }
        else if (!Array.isArray(profileObj.externalDataSourceAccesses)) {
            profileObj.externalDataSourceAccesses = [profileObj.externalDataSourceAccesses];
        }
        for (let i = 0; i < externalDatasources.length; i++) {
            let dataSource = externalDatasources[i];
            let found = false;
            for (let j = 0; j < profileObj.externalDataSourceAccesses.length; j++) {
                if (dataSource.externalDataSource === profileObj.externalDataSourceAccesses[j].externalDataSource) {
                    profileObj.externalDataSourceAccesses[j].enabled = dataSource.enabled;
                    found = true;
                    break;
                }
            }
            if (!found) {
                profileObj.externalDataSourceAccesses.push(dataSource);
            }
        }
        profileObj.externalDataSourceAccesses.sort((ds1, ds2) => {
            let order = 0;
            if (ds1.externalDataSource < ds2.externalDataSource) {
                order = -1;
            }
            else if (ds1.externalDataSource > ds2.externalDataSource) {
                order = 1;
            }
            return order;
        });
        return profileObj;
    }
    /**
     * Merge two profile and make sure that profile 1 contains all config present in the profile 2
     * @param profile1
     * @param profile2
     */
    async mergeProfile(profile1, profile2) {
        if (profile2.applicationVisibilities !== undefined) {
            this.mergeApps(profile1, profile2.applicationVisibilities);
        }
        if (profile2.classAccesses !== undefined) {
            this.mergeClasses(profile1, profile2.classAccesses);
        }
        if (profile2.customMetadataTypeAccesses !== undefined) {
            this.mergeCustomMetadataAccesses(profile1, profile2.customMetadataTypeAccesses);
        }
        if (profile2.customSettingAccesses !== undefined) {
            this.mergeCustomSettingAccesses(profile1, profile2.customSettingAccesses);
        }
        if (profile2.customPermissions !== undefined) {
            this.mergeCustomPermissions(profile1, profile2.customPermissions);
        }
        if (profile2.externalDataSourceAccesses !== undefined) {
            this.mergeExternalDatasourceAccesses(profile1, profile2.externalDataSourceAccesses);
        }
        if (profile2.fieldPermissions !== undefined) {
            this.mergeFields(profile1, profile2.fieldPermissions);
        }
        if (profile2.flowAccesses !== undefined) {
            this.mergeFlowAccesses(profile1, profile2.flowAccesses);
        }
        if (profile2.loginFlows !== undefined) {
            this.mergeLoginFlows(profile1, profile2.loginFlows);
        }
        if (profile2.layoutAssignments !== undefined) {
            this.mergeLayouts(profile1, profile2.layoutAssignments);
        }
        if (profile2.objectPermissions !== undefined) {
            this.mergeObjects(profile1, profile2.objectPermissions);
        }
        if (profile2.pageAccesses !== undefined) {
            this.mergePages(profile1, profile2.pageAccesses);
        }
        if (profile2.userPermissions !== undefined) {
            this.mergePermissions(profile1, profile2.userPermissions);
        }
        if (profile2.recordTypeVisibilities !== undefined) {
            this.mergeRecordTypes(profile1, profile2.recordTypeVisibilities);
        }
        if (profile2.tabVisibilities !== undefined) {
            this.mergeTabs(profile1, profile2.tabVisibilities);
        }
        if (profile2.loginHours !== undefined) {
            profile1.loginHours = profile2.loginHours;
        }
        else {
            delete profile1.loginHours;
        }
        if (profile2.loginIpRanges !== undefined) {
            profile1.loginIpRanges = profile2.loginIpRanges;
        }
        else {
            delete profile1.loginIpRanges;
        }
        return profile1;
    }
    async merge(srcFolders, profiles, metadatas, isdelete) {
        sfp_logger_1.default.log('Merging profiles...', sfp_logger_1.LoggerLevel.DEBUG);
        let fetchNewProfiles = lodash_1.default.isNil(srcFolders) || srcFolders.length === 0;
        if (fetchNewProfiles) {
            srcFolders = await sfpowerkit_1.Sfpowerkit.getProjectDirectories();
        }
        this.metadataFiles = new metadataFiles_1.default();
        for (let i = 0; i < srcFolders.length; i++) {
            let srcFolder = srcFolders[i];
            let normalizedPath = path_1.default.join(process.cwd(), srcFolder);
            this.metadataFiles.loadComponents(normalizedPath);
        }
        let profileListToReturn = [];
        let profileNames = [];
        let localProfilesWithStatus = await this.getRemoteProfilesWithLocalStatus(profiles);
        let localProfiles = localProfilesWithStatus.updated || [];
        if (fetchNewProfiles) {
            localProfiles = lodash_1.default.union(localProfilesWithStatus.added, localProfilesWithStatus.updated);
        }
        else {
            localProfilesWithStatus.added = [];
        }
        localProfiles.sort();
        for (let i = 0; i < localProfiles.length; i++) {
            let profileComponent = localProfiles[i];
            let supported = !unsupportedprofiles.includes(profileComponent.name);
            if (supported) {
                profileNames.push(profileComponent.name);
            }
        }
        //SfPowerKit.ux.log("Loading profiles from server ");
        let i, j, chunk = 10;
        let temparray;
        sfp_logger_1.default.log(`${profileNames.length}  profiles found in the directory `, sfp_logger_1.LoggerLevel.DEBUG);
        for (i = 0, j = profileNames.length; i < j; i += chunk) {
            temparray = profileNames.slice(i, i + chunk);
            //SfPowerKit.ux.log(temparray.length);
            let start = i + 1;
            let end = i + chunk;
            sfp_logger_1.default.log('Loading a chunk of profiles ' + start + ' to ' + end, sfp_logger_1.LoggerLevel.INFO);
            let profileList = [];
            let metadataList = await this.profileRetriever.loadProfiles(temparray);
            for (let count = 0; count < metadataList.length; count++) {
                //handle profile merge here
                let profileObjFromServer = metadataList[count];
                if (metadatas !== undefined) {
                    // remove metadatas from profile
                    profileObjFromServer = this.removeUnwantedPermissions(profileObjFromServer, metadatas);
                }
                //Check if the component exists in the file system
                let profileWriter = new profileWriter_1.default();
                let profileObj;
                let indices = lodash_1.default.keys(lodash_1.default.pickBy(localProfiles, { name: profileObjFromServer.fullName }));
                for (const index of indices) {
                    sfpowerkit_1.Sfpowerkit.log('Reconciling  Tabs on retrieved profiles.', sfp_logger_1.LoggerLevel.DEBUG);
                    await this.reconcileTabs(profileObjFromServer);
                    let filePath = localProfiles[index].path;
                    if (filePath && fs.existsSync(filePath)) {
                        sfp_logger_1.default.log('Merging profile ' + profileObjFromServer.fullName, sfp_logger_1.LoggerLevel.DEBUG);
                        let profileXml = fs.readFileSync(filePath);
                        const parser = new xml2js_1.default.Parser({ explicitArray: false });
                        const parseString = util.promisify(parser.parseString);
                        let parseResult = await parseString(profileXml);
                        profileObj = profileWriter.toProfile(parseResult.Profile);
                        profileObj = await this.mergeProfile(profileObj, profileObjFromServer);
                    }
                    else {
                        sfp_logger_1.default.log('New Profile found in server ' + profileObjFromServer.fullName, sfp_logger_1.LoggerLevel.DEBUG);
                    }
                    profileObj.fullName = profileObjFromServer.fullName;
                    profileWriter.writeProfile(profileObj, filePath);
                    sfp_logger_1.default.log('Profile ' + profileObj.fullName + ' merged', sfp_logger_1.LoggerLevel.DEBUG);
                    profileList.push(profileObj.fullName);
                }
            }
            profileListToReturn.push(...profileList);
        }
        if (localProfilesWithStatus.deleted && isdelete) {
            localProfilesWithStatus.deleted.forEach((profile) => {
                if (fs.existsSync(profile.path)) {
                    fs.unlinkSync(profile.path);
                }
            });
        }
        return Promise.resolve(localProfilesWithStatus);
    }
    removeUnwantedPermissions(profileObjFromServer, metadatas) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const getPermissionsArray = (permissions) => {
            if (!permissions) {
                permissions = [];
            }
            else if (!Array.isArray(permissions)) {
                permissions = [permissions];
            }
            return permissions;
        };
        profileObjFromServer.applicationVisibilities = (_a = getPermissionsArray(profileObjFromServer.applicationVisibilities)) === null || _a === void 0 ? void 0 : _a.filter((elem) => {
            return (metadatas['CustomApplication'].includes(elem.application) ||
                metadatas['CustomApplication'].includes('*'));
        });
        profileObjFromServer.classAccesses = (_b = getPermissionsArray(profileObjFromServer.classAccesses)) === null || _b === void 0 ? void 0 : _b.filter((elem) => {
            return metadatas['ApexClass'].includes(elem.apexClass) || metadatas['ApexClass'].includes('*');
        });
        profileObjFromServer.layoutAssignments = (_c = getPermissionsArray(profileObjFromServer.layoutAssignments)) === null || _c === void 0 ? void 0 : _c.filter((elem) => {
            return metadatas['Layout'].includes(elem.layout) || metadatas['Layout'].includes('*');
        });
        profileObjFromServer.objectPermissions = (_d = getPermissionsArray(profileObjFromServer.objectPermissions)) === null || _d === void 0 ? void 0 : _d.filter((elem) => {
            return metadatas['CustomObject'].includes(elem.object) || metadatas['CustomObject'].includes('*');
        });
        profileObjFromServer.pageAccesses = (_e = getPermissionsArray(profileObjFromServer.pageAccesses)) === null || _e === void 0 ? void 0 : _e.filter((elem) => {
            return metadatas['ApexPage'].includes(elem.apexPage) || metadatas['ApexPage'].includes('*');
        });
        profileObjFromServer.fieldPermissions = (_f = getPermissionsArray(profileObjFromServer.fieldPermissions)) === null || _f === void 0 ? void 0 : _f.filter((elem) => {
            return metadatas['CustomField'].includes(elem.field);
        });
        profileObjFromServer.recordTypeVisibilities = (_g = getPermissionsArray(profileObjFromServer.recordTypeVisibilities)) === null || _g === void 0 ? void 0 : _g.filter((elem) => {
            return metadatas['RecordType'].includes(elem.recordType);
        });
        profileObjFromServer.tabVisibilities = (_h = getPermissionsArray(profileObjFromServer.tabVisibilities)) === null || _h === void 0 ? void 0 : _h.filter((elem) => {
            return metadatas['CustomTab'].includes(elem.tab) || metadatas['CustomTab'].includes('*');
        });
        if (metadatas['SystemPermissions'].length == 0) {
            delete profileObjFromServer.userPermissions;
        }
        return profileObjFromServer;
    }
}
exports.default = ProfileMerge;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZmlsZU1lcmdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2ltcGwvc291cmNlL3Byb2ZpbGVNZXJnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsa0RBQStDO0FBQy9DLGlGQUF5RDtBQUN6RCw2Q0FBK0I7QUFDL0IsZ0RBQXdCO0FBQ3hCLG9EQUE0QjtBQUM1QixvREFBdUI7QUFrQnZCLDJDQUE2QjtBQUM3QixzRUFBaUU7QUFDakUsd0ZBQWdFO0FBQ2hFLG1FQUE2RDtBQUU3RCxNQUFNLG1CQUFtQixHQUFHLEVBQUUsQ0FBQztBQUUvQixNQUFxQixZQUFhLFNBQVEsd0JBQWM7SUFHNUMsU0FBUyxDQUFDLFVBQW1CLEVBQUUsdUJBQWdEO1FBQ25GLElBQUksVUFBVSxDQUFDLHVCQUF1QixLQUFLLElBQUksSUFBSSxVQUFVLENBQUMsdUJBQXVCLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDbEcsVUFBVSxDQUFDLHVCQUF1QixHQUFHLEVBQUUsQ0FBQztRQUM1QyxDQUFDO2FBQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLHVCQUF1QixDQUFDLEVBQUUsQ0FBQztZQUM1RCxVQUFVLENBQUMsdUJBQXVCLEdBQUcsQ0FBQyxVQUFVLENBQUMsdUJBQXVCLENBQUMsQ0FBQztRQUM5RSxDQUFDO1FBQ0QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLHVCQUF1QixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3RELElBQUksYUFBYSxHQUFHLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9DLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNsQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLHVCQUF1QixDQUFDLE1BQU0sRUFBRSxDQUFD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