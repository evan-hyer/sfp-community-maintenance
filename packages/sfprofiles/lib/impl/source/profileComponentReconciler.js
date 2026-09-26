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
const source_deploy_retrieve_1 = require("@salesforce/source-deploy-retrieve");
const metadataFiles_1 = __importDefault(require("../metadata/metadataFiles"));
const sfp_logger_1 = __importStar(require("@flxbl-io/sfp-logger"));
const sfpowerkit_1 = require("../../utils/sfpowerkit");
const userPermissionBuilder_1 = __importDefault(require("../metadata/builder/userPermissionBuilder"));
const metadataRetriever_1 = __importDefault(require("../metadata/retriever/metadataRetriever"));
const profileRetriever_1 = __importDefault(require("../metadata/retriever/profileRetriever"));
class ProfileComponentReconciler {
    //rivate profileRetriever;
    constructor(conn, isSourceOnly) {
        this.conn = conn;
        this.isSourceOnly = isSourceOnly;
    }
    async reconcileProfileComponents(profileObj, profileName) {
        sfp_logger_1.default.log(`Reconciling App: ${profileName}`, sfp_logger_1.LoggerLevel.DEBUG);
        await this.reconcileApp(profileObj);
        sfp_logger_1.default.log(`Reconciling Classes: ${profileName}`, sfp_logger_1.LoggerLevel.DEBUG);
        await this.reconcileClasses(profileObj);
        sfp_logger_1.default.log(`Reconciling Fields: ${profileName}`, sfp_logger_1.LoggerLevel.DEBUG);
        await this.reconcileFields(profileObj);
        sfp_logger_1.default.log(`Reconciling Objects: ${profileName}`, sfp_logger_1.LoggerLevel.DEBUG);
        await this.reconcileObjects(profileObj);
        sfp_logger_1.default.log(`Reconciling Pages: ${profileName}`, sfp_logger_1.LoggerLevel.DEBUG);
        await this.reconcilePages(profileObj);
        sfp_logger_1.default.log(`Reconciling Layouts: ${profileName}`, sfp_logger_1.LoggerLevel.DEBUG);
        await this.reconcileLayouts(profileObj);
        sfp_logger_1.default.log(`Reconciling Record Types: ${profileName}`, sfp_logger_1.LoggerLevel.DEBUG);
        await this.reconcileRecordTypes(profileObj);
        sfp_logger_1.default.log(`Reconciling  Tabs: ${profileName}`, sfp_logger_1.LoggerLevel.DEBUG);
        await this.reconcileTabs(profileObj);
        sfp_logger_1.default.log(`Reconciling  ExternalDataSources: ${profileName}`, sfp_logger_1.LoggerLevel.DEBUG);
        await this.reconcileExternalDataSource(profileObj);
        sfp_logger_1.default.log(`Reconciling  CustomPermissions: ${profileName}`, sfp_logger_1.LoggerLevel.DEBUG);
        await this.reconcileCustomPermission(profileObj);
        sfp_logger_1.default.log(`Reconciling  CustomMetadata: ${profileName}`, sfp_logger_1.LoggerLevel.DEBUG);
        await this.reconcileCustomMetadata(profileObj);
        sfp_logger_1.default.log(`Reconciling  CustomSettings: ${profileName}`, sfp_logger_1.LoggerLevel.DEBUG);
        await this.reconcileCustomSettings(profileObj);
        sfp_logger_1.default.log(`Reconciling  Flow: ${profileName}`, sfp_logger_1.LoggerLevel.DEBUG);
        await this.reconcileFlow(profileObj);
        sfp_logger_1.default.log(`Reconciling  Login Flows: ${profileName}`, sfp_logger_1.LoggerLevel.DEBUG);
        await this.reconcileLoginFlow(profileObj);
        sfp_logger_1.default.log(`Reconciling  User Licenses: ${profileName}`, sfp_logger_1.LoggerLevel.DEBUG);
        await this.cleanupUserLicenses(profileObj);
        sfp_logger_1.default.log(`Reconciling  User Permissions: ${profileName}`, sfp_logger_1.LoggerLevel.DEBUG);
        await this.reconcileUserPermissions(profileObj);
        sfp_logger_1.default.log(`All Components for ${profileName} reconciled`, sfp_logger_1.LoggerLevel.DEBUG);
        return profileObj;
    }
    async removeUserPermissionNotAvailableInOrg(profileObj, supportedPermissions) {
        if (profileObj.userPermissions !== undefined && profileObj.userPermissions.length > 0) {
            //Remove permission that are not present in the target org
            profileObj.userPermissions = profileObj.userPermissions.filter((permission) => {
                let supported = supportedPermissions.includes(permission.name);
                return supported;
            });
        }
    }
    async removePermissionsBasedOnProjectConfig(profileObj) {
        let pluginConfig = await sfpowerkit_1.Sfpowerkit.getConfig();
        let ignorePermissions = pluginConfig.ignoredPermissions || [];
        if (profileObj.userPermissions !== undefined && profileObj.userPermissions.length > 0) {
            profileObj.userPermissions = profileObj.userPermissions.filter((permission) => {
                let supported = !ignorePermissions.includes(permission.name);
                return supported;
            });
        }
    }
    removeUnsupportedUserPermissions(profileObj) {
        let profileRetriever;
        //if sourceonly mode load profileRetriever
        if (metadataFiles_1.default.sourceOnly) {
            profileRetriever = new profileRetriever_1.default(null);
        }
        else {
            profileRetriever = new profileRetriever_1.default(this.conn);
        }
        let unsupportedLicencePermissions = profileRetriever.getUnsupportedLicencePermissions(profileObj.userLicense);
        if (profileObj.userPermissions != null && profileObj.userPermissions.length > 0) {
            profileObj.userPermissions = profileObj.userPermissions.filter((permission) => {
                let supported = !unsupportedLicencePermissions.includes(permission.name);
                return supported;
            });
        }
    }
    async cleanupUserLicenses(profileObj) {
        if (!this.isSourceOnly) {
            //Manage licences
            let userLicenseRetriever = new metadataRetriever_1.default(this.conn, 'UserLicense');
            const isSupportedLicence = await userLicenseRetriever.isComponentExistsInTheOrg(profileObj.userLicense);
            if (!isSupportedLicence) {
                delete profileObj.userLicense;
            }
        }
    }
    async reconcileApp(profileObj) {
        let customApplications = new metadataRetriever_1.default(this.conn, source_deploy_retrieve_1.registry.types.customapplication.name);
        if (profileObj.applicationVisibilities !== undefined) {
            let validArray = [];
            for (let i = 0; i < profileObj.applicationVisibilities.length; i++) {
                let cmpObj = profileObj.applicationVisibilities[i];
                let exist = await customApplications.isComponentExistsInProjectDirectoryOrInOrg(cmpObj.application);
                if (exist) {
                    validArray.push(cmpObj);
                }
            }
            sfp_logger_1.default.log(`Application Visiblitilties reduced from ${profileObj.applicationVisibilities.length}  to  ${validArray.length}`, sfp_logger_1.LoggerLevel.DEBUG);
            profileObj.applicationVisibilities = validArray;
        }
    }
    async reconcileClasses(profileObj) {
        let apexClasses = new metadataRetriever_1.default(this.conn, source_deploy_retrieve_1.registry.types.apexclass.name);
        if (profileObj.classAccesses !== undefined) {
            if (!Array.isArray(profileObj.classAccesses)) {
                profileObj.classAccesses = [profileObj.classAccesses];
            }
            let validArray = [];
            for (let i = 0; i < profileObj.classAccesses.length; i++) {
                let cmpObj = profileObj.classAccesses[i];
                let exists = await apexClasses.isComponentExistsInProjectDirectoryOrInOrg(cmpObj.apexClass);
                if (exists) {
                    validArray.push(cmpObj);
                }
            }
            sfp_logger_1.default.log(`Class Access reduced from ${profileObj.classAccesses.length}  to  ${validArray.length}`, sfp_logger_1.LoggerLevel.DEBUG);
            profileObj.classAccesses = validArray;
        }
    }
    async reconcileFields(profileObj) {
        if (profileObj.fieldPermissions) {
            if (!Array.isArray(profileObj.fieldPermissions)) {
                profileObj.fieldPermissions = [profileObj.fieldPermissions];
            }
            let validArray = [];
            for (let i = 0; i < profileObj.fieldPermissions.length; i++) {
                let fieldRetriever = new metadataRetriever_1.default(this.conn, source_deploy_retrieve_1.registry.types.customobject.children.types.customfield.name);
                let cmpObj = profileObj.fieldPermissions[i];
                let parent = cmpObj.field.split('.')[0];
                let exists = await fieldRetriever.isComponentExistsInProjectDirectoryOrInOrg(cmpObj.field, parent);
                if (exists) {
                    validArray.push(cmpObj);
                }
            }
            sfp_logger_1.default.log(`Fields Level Permissions reduced from ${profileObj.fieldPermissions.length}  to  ${validArray.length}`, sfp_logger_1.LoggerLevel.DEBUG);
            profileObj.fieldPermissions = validArray;
        }
    }
    async reconcileLayouts(profileObj) {
        let layoutRetreiver = new metadataRetriever_1.default(this.conn, source_deploy_retrieve_1.registry.types.layout.name);
        let recordTypeRetriever = new metadataRetriever_1.default(this.conn, source_deploy_retrieve_1.registry.types.customobject.children.types.recordtype.name);
        if (profileObj.layoutAssignments !== undefined) {
            let validArray = [];
            for (let count = 0; count < profileObj.layoutAssignments.length; count++) {
                let cmpObj = profileObj.layoutAssignments[count];
                let exist = (await layoutRetreiver.isComponentExistsInProjectDirectoryOrInOrg(cmpObj.layout)) &&
                    (!cmpObj.recordType ||
                        (await recordTypeRetriever.isComponentExistsInProjectDirectoryOrInOrg(cmpObj.recordType)));
                if (exist) {
                    validArray.push(cmpObj);
                }
            }
            sfp_logger_1.default.log(`Layout Assignnments reduced from ${profileObj.layoutAssignments.length}  to  ${validArray.length}`, sfp_logger_1.LoggerLevel.DEBUG);
            profileObj.layoutAssignments = validArray;
        }
    }
    async reconcileObjects(profileObj) {
        let objectPermissionRetriever = new metadataRetriever_1.default(this.conn, 'ObjectPermissions');
        let objectRetriever = new metadataRetriever_1.default(this.conn, source_deploy_retrieve_1.registry.types.customobject.name);
        if (profileObj.objectPermissions !== undefined) {
            if (!Array.isArray(profileObj.objectPermissions)) {
                profileObj.objectPermissions = [profileObj.objectPermissions];
            }
            let validArray = [];
            for (let i = 0; i < profileObj.objectPermissions.length; i++) {
                let cmpObj = profileObj.objectPermissions[i];
                //Check Object exist in Source Directory
                let exist = await objectRetriever.isComponentExistsInProjectDirectory(cmpObj.object);
                if (!exist)
                    exist = await objectPermissionRetriever.isComponentExistsInTheOrg(cmpObj.object);
                if (exist) {
                    validArray.push(cmpObj);
                }
            }
            sfp_logger_1.default.log(`Object Permissions reduced from ${profileObj.objectPermissions.length}  to  ${validArray.length}`, sfp_logger_1.LoggerLevel.DEBUG);
            profileObj.objectPermissions = validArray;
        }
    }
    async reconcileCustomMetadata(profileObj) {
        let objectRetriever = new metadataRetriever_1.default(this.conn, source_deploy_retrieve_1.registry.types.customobject.name);
        if (profileObj.customMetadataTypeAccesses !== undefined) {
            if (!Array.isArray(profileObj.customMetadataTypeAccesses)) {
                profileObj.customMetadataTypeAccesses = [profileObj.customMetadataTypeAccesses];
            }
            let validArray = [];
            for (let i = 0; i < profileObj.customMetadataTypeAccesses.length; i++) {
                let cmpCM = profileObj.customMetadataTypeAccesses[i];
                let exist = await objectRetriever.isComponentExistsInProjectDirectoryOrInOrg(cmpCM.name);
                if (exist) {
                    validArray.push(cmpCM);
                }
            }
            sfp_logger_1.default.log(`CustomMetadata Access reduced from ${profileObj.customMetadataTypeAccesses.length}  to  ${validArray.length}`, sfp_logger_1.LoggerLevel.DEBUG);
            profileObj.customMetadataTypeAccesses = validArray;
        }
    }
    async reconcileCustomSettings(profileObj) {
        let objectRetriever = new metadataRetriever_1.default(this.conn, source_deploy_retrieve_1.registry.types.customobject.name);
        if (profileObj.customSettingAccesses !== undefined) {
            if (!Array.isArray(profileObj.customSettingAccesses)) {
                profileObj.customSettingAccesses = [profileObj.customSettingAccesses];
            }
            let validArray = [];
            for (let i = 0; i < profileObj.customSettingAccesses.length; i++) {
                let cmpCS = profileObj.customSettingAccesses[i];
                let exist = await objectRetriever.isComponentExistsInProjectDirectoryOrInOrg(cmpCS.name);
                if (exist) {
                    validArray.push(cmpCS);
                }
            }
            sfp_logger_1.default.log(`CustomSettings Access reduced from ${profileObj.customSettingAccesses.length}  to  ${validArray.length}`, sfp_logger_1.LoggerLevel.DEBUG);
            profileObj.customSettingAccesses = validArray;
        }
    }
    async reconcileExternalDataSource(profileObj) {
        let externalDataSourceRetriever = new metadataRetriever_1.default(this.conn, source_deploy_retrieve_1.registry.types.externaldatasource.name);
        if (profileObj.externalDataSourceAccesses !== undefined) {
            if (!Array.isArray(profileObj.externalDataSourceAccesses)) {
                profileObj.externalDataSourceAccesses = [profileObj.externalDataSourceAccesses];
            }
            let validArray = [];
            for (let i = 0; i < profileObj.externalDataSourceAccesses.length; i++) {
                let dts = profileObj.externalDataSourceAccesses[i];
                let exist = await externalDataSourceRetriever.isComponentExistsInProjectDirectoryOrInOrg(dts.externalDataSource);
                if (exist) {
                    validArray.push(dts);
                }
            }
            sfp_logger_1.default.log(`ExternalDataSource Access reduced from ${profileObj.externalDataSourceAccesses.length}  to  ${validArray.length}`, sfp_logger_1.LoggerLevel.DEBUG);
            profileObj.externalDataSourceAccesses = validArray;
        }
    }
    async reconcileFlow(profileObj) {
        let flowRetreiver = new metadataRetriever_1.default(this.conn, source_deploy_retrieve_1.registry.types.flow.name);
        if (profileObj.flowAccesses !== undefined) {
            if (!Array.isArray(profileObj.flowAccesses)) {
                profileObj.flowAccesses = [profileObj.flowAccesses];
            }
            let validArray = [];
            for (let i = 0; i < profileObj.flowAccesses.length; i++) {
                let flow = profileObj.flowAccesses[i];
                let exist = await flowRetreiver.isComponentExistsInProjectDirectoryOrInOrg(flow.flow);
                if (exist) {
                    validArray.push(flow);
                }
            }
            sfp_logger_1.default.log(`Flow Access reduced from ${profileObj.flowAccesses.length}  to  ${validArray.length}`, sfp_logger_1.LoggerLevel.DEBUG);
            profileObj.flowAccesses = validArray;
        }
    }
    async reconcileLoginFlow(profileObj) {
        let apexPageRetriver = new metadataRetriever_1.default(this.conn, source_deploy_retrieve_1.registry.types.apexpage.name);
        let flowRetreiver = new metadataRetriever_1.default(this.conn, source_deploy_retrieve_1.registry.types.flow.name);
        if (profileObj.loginFlows !== undefined) {
            if (!Array.isArray(profileObj.loginFlows)) {
                profileObj.loginFlows = [profileObj.loginFlows];
            }
            let validArray = [];
            for (let i = 0; i < profileObj.loginFlows.length; i++) {
                let loginFlow = profileObj.loginFlows[i];
                if (loginFlow.flow !== undefined) {
                    let exist = await flowRetreiver.isComponentExistsInProjectDirectoryOrInOrg(loginFlow.flow);
                    if (exist) {
                        validArray.push(loginFlow);
                    }
                }
                else if (loginFlow.vfFlowPage !== undefined) {
                    let exist = await apexPageRetriver.isComponentExistsInProjectDirectoryOrInOrg(loginFlow.vfFlowPage);
                    if (exist) {
                        validArray.push(loginFlow);
                    }
                }
            }
            sfp_logger_1.default.log(`LoginFlows reduced from ${profileObj.loginFlows.length}  to  ${validArray.length}`, sfp_logger_1.LoggerLevel.DEBUG);
            profileObj.loginFlows = validArray;
        }
    }
    async reconcileCustomPermission(profileObj) {
        let customPermissionsRetriever = new metadataRetriever_1.default(this.conn, source_deploy_retrieve_1.registry.types.custompermission.name);
        if (profileObj.customPermissions !== undefined) {
            if (!Array.isArray(profileObj.customPermissions)) {
                profileObj.customPermissions = [profileObj.customPermissions];
            }
            let validArray = [];
            for (let i = 0; i < profileObj.customPermissions.length; i++) {
                let customPermission = profileObj.customPermissions[i];
                let exist = await customPermissionsRetriever.isComponentExistsInProjectDirectoryOrInOrg(customPermission.name);
                if (exist) {
                    validArray.push(customPermission);
                }
            }
            sfp_logger_1.default.log(`CustomPermission reduced from ${profileObj.customPermissions.length}  to  ${validArray.length}`, sfp_logger_1.LoggerLevel.DEBUG);
            profileObj.customPermissions = validArray;
        }
    }
    async reconcilePages(profileObj) {
        let apexPageRetriver = new metadataRetriever_1.default(this.conn, source_deploy_retrieve_1.registry.types.apexpage.name);
        if (profileObj.pageAccesses !== undefined) {
            if (!Array.isArray(profileObj.pageAccesses)) {
                profileObj.pageAccesses = [profileObj.pageAccesses];
            }
            let validArray = [];
            for (let i = 0; i < profileObj.pageAccesses.length; i++) {
                let cmpObj = profileObj.pageAccesses[i];
                let exist = await apexPageRetriver.isComponentExistsInProjectDirectoryOrInOrg(cmpObj.apexPage);
                if (exist) {
                    validArray.push(cmpObj);
                }
            }
            sfp_logger_1.default.log(`Page Access Permissions reduced from ${profileObj.pageAccesses.length}  to  ${validArray.length}`, sfp_logger_1.LoggerLevel.DEBUG);
            profileObj.pageAccesses = validArray;
        }
    }
    async reconcileRecordTypes(profileObj) {
        let recordTypeRetriever = new metadataRetriever_1.default(this.conn, source_deploy_retrieve_1.registry.types.customobject.children.types.recordtype.name);
        if (profileObj.recordTypeVisibilities !== undefined) {
            if (!Array.isArray(profileObj.recordTypeVisibilities)) {
                profileObj.recordTypeVisibilities = [profileObj.recordTypeVisibilities];
            }
            let validArray = [];
            for (let i = 0; i < profileObj.recordTypeVisibilities.length; i++) {
                let cmpObj = profileObj.recordTypeVisibilities[i];
                let exist = await recordTypeRetriever.isComponentExistsInProjectDirectoryOrInOrg(cmpObj.recordType);
                if (exist) {
                    validArray.push(cmpObj);
                }
            }
            sfp_logger_1.default.log(`Record Type Visibilities reduced from ${profileObj.recordTypeVisibilities.length}  to  ${validArray.length}`, sfp_logger_1.LoggerLevel.DEBUG);
            profileObj.recordTypeVisibilities = validArray;
        }
    }
    async reconcileTabs(profileObj) {
        let tabRetriever = new metadataRetriever_1.default(this.conn, source_deploy_retrieve_1.registry.types.customtab.name);
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
            sfp_logger_1.default.log(`Tab Visibilities reduced from ${profileObj.tabVisibilities.length}  to  ${validArray.length}`, sfp_logger_1.LoggerLevel.DEBUG);
            profileObj.tabVisibilities = validArray;
        }
    }
    async fetchPermissions() {
        let permissionRetriever = new metadataRetriever_1.default(this.conn, 'UserPermissions');
        let permissionSets = await permissionRetriever.getComponents();
        let supportedPermissions = permissionSets.map((elem) => {
            return elem.fullName;
        });
        return supportedPermissions;
    }
    async reconcileUserPermissions(profileObj) {
        if (profileObj.userPermissions == null || profileObj.userPermissions.length === 0) {
            return;
        }
        //Delete all user Permissions if the profile is standard one
        let isCustom = profileObj.custom;
        if (!isCustom) {
            delete profileObj.userPermissions;
            return;
        }
        //Remove unsupported userPermission
        this.removeUnsupportedUserPermissions(profileObj);
        sfp_logger_1.default.log('Removed Unsupported User Pemrmisions ', sfp_logger_1.LoggerLevel.TRACE);
        let userPermissionBuilder = new userPermissionBuilder_1.default();
        //IS sourceonly, use ignorePermission set in sfdxProject.json file
        if (metadataFiles_1.default.sourceOnly) {
            await this.removePermissionsBasedOnProjectConfig(profileObj);
            await userPermissionBuilder.handlePermissionDependency(profileObj, []);
        }
        else {
            let supportedPermissions = await this.fetchPermissions();
            await this.removeUserPermissionNotAvailableInOrg(profileObj, supportedPermissions);
            await userPermissionBuilder.handlePermissionDependency(profileObj, supportedPermissions);
        }
    }
}
exports.default = ProfileComponentReconciler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZmlsZUNvbXBvbmVudFJlY29uY2lsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvaW1wbC9zb3VyY2UvcHJvZmlsZUNvbXBvbmVudFJlY29uY2lsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLCtFQUE4RDtBQUM5RCxpRkFBeUQ7QUFDekQsbUVBQTZEO0FBQzdELGtEQUErQztBQUMvQyx5R0FBaUY7QUFDakYsbUdBQTJFO0FBQzNFLGlHQUF5RTtBQUd6RSxNQUFxQiwwQkFBMEI7SUFDM0MsMEJBQTBCO0lBRTFCLFlBQTJCLElBQWdCLEVBQVUsWUFBcUI7UUFBL0MsU0FBSSxHQUFKLElBQUksQ0FBWTtRQUFVLGlCQUFZLEdBQVosWUFBWSxDQUFTO0lBQUcsQ0FBQztJQUV2RSxLQUFLLENBQUMsMEJBQTBCLENBQUMsVUFBbUIsRUFBRSxXQUFtQjtRQUM1RSxvQkFBUyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsV0FBVyxFQUFFLEVBQUUsd0JBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNwRSxNQUFNLElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDcEMsb0JBQVMsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLFdBQVcsRUFBRSxFQUFFLHdCQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEUsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDeEMsb0JBQVMsQ0FBQyxHQUFHLENBQUMsdUJBQXVCLFdBQVcsRUFBRSxFQUFFLHdCQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkUsTUFBTSxJQUFJLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3ZDLG9CQUFTLENBQUMsR0FBRyxDQUFDLHdCQUF3QixXQUFXLEVBQUUsRUFBRSx3QkFBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3hFLE1BQU0sSUFB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