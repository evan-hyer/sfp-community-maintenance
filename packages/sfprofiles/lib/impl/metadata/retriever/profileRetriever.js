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
const _ = __importStar(require("lodash"));
const metadataRetriever_1 = __importDefault(require("./metadataRetriever"));
const queryExecutor_1 = __importDefault(require("../../../utils/queryExecutor"));
const metadataOperation_1 = __importDefault(require("../../../utils/metadataOperation"));
const unsuportedObjects = ['PersonAccount'];
/**
 *
 * Used to track Unsupported Userpermission per Licence
 * Update this list when Salesforce change supported permission per licence
 */
const userLicenceMap = [
    {
        name: 'Guest User License',
        unsupportedPermissions: ['PasswordNeverExpires'],
    },
];
class ProfileRetriever {
    constructor(conn) {
        this.conn = conn;
    }
    async loadProfiles(profileNames) {
        let profilePermissions = await this.fetchPermissionsWithValue(profileNames);
        let profiles = (await this.conn.metadata.read('Profile', profileNames));
        if (Array.isArray(profiles)) {
            for (let i = 0; i < profiles.length; i++) {
                await this.handlePermissions(profiles[i], profilePermissions);
                profiles[i] = await this.completeObjects(profiles[i], false);
            }
            return profiles;
        }
        else if (profiles !== null) {
            await this.handlePermissions(profiles, profilePermissions);
            profiles = await this.completeObjects(profiles, false);
            return [profiles];
        }
        else {
            return [];
        }
    }
    async handlePermissions(profileObj, permissions) {
        await this.handleViewAllDataPermission(profileObj);
        await this.handleInstallPackagingPermission(profileObj);
        this.handleQueryAllFilesPermission(profileObj);
        //Check if the permission QueryAllFiles is true and give read access to objects
        profileObj = await this.completeUserPermissions(profileObj, permissions);
        return profileObj;
    }
    async completeUserPermissions(profileObj, profilePermissions) {
        let supportedPermissions = await this.fetchPermissions();
        // remove unsupported userLicence
        let unsupportedLicencePermissions = this.getUnsupportedLicencePermissions(profileObj.userLicense);
        if (profileObj.userPermissions != null && profileObj.userPermissions.length > 0) {
            profileObj.userPermissions = profileObj.userPermissions.filter((permission) => {
                let supported = !unsupportedLicencePermissions.includes(permission.name);
                return supported;
            });
        }
        let notRetrievedPermissions = supportedPermissions.filter((permission) => {
            let found = null;
            if (profileObj.userPermissions != null && profileObj.userPermissions.length > 0) {
                found = profileObj.userPermissions.find((element) => {
                    return element.name === permission;
                });
            }
            return found === null || found === undefined;
        });
        let isCustom = '' + profileObj.custom;
        if (isCustom == 'false') {
            //Remove System permission for standard profile as Salesforce does not support edition on those profile
            delete profileObj.userPermissions;
        }
        else {
            for (let i = 0; i < notRetrievedPermissions.length; i++) {
                let profileName = decodeURIComponent(profileObj.fullName);
                let profilePermission = profilePermissions.find((record) => {
                    return record.Name == profileName;
                });
                let permissionField = 'Permissions' + notRetrievedPermissions[i];
                let permissionValue = false;
                if (profilePermission) {
                    permissionValue = profilePermission[permissionField];
                    if (permissionValue == undefined) {
                        permissionValue = false;
                    }
                }
                let newPermission = {
                    enabled: permissionValue,
                    name: notRetrievedPermissions[i],
                };
                if (profileObj.userPermissions === undefined) {
                    profileObj.userPermissions = new Array();
                }
                if (!Array.isArray(profileObj.userPermissions)) {
                    profileObj.userPermissions = [profileObj.userPermissions];
                }
                profileObj.userPermissions.push(newPermission);
            }
        }
        if (profileObj.userPermissions !== undefined) {
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
        }
        return profileObj;
    }
    hasPermission(profileObj, permissionName) {
        let found = false;
        if (profileObj.userPermissions !== null &&
            profileObj.userPermissions !== undefined &&
            profileObj.userPermissions.length > 0) {
            for (let i = 0; i < profileObj.userPermissions.length; i++) {
                let element = profileObj.userPermissions[i];
                if (element.name === permissionName) {
                    found = element.enabled;
                    break;
                }
            }
        }
        return found;
    }
    async completeObjects(profileObj, access = true) {
        let objPerm = ProfileRetriever.filterObjects(profileObj);
        if (objPerm === undefined) {
            objPerm = new Array();
        }
        else if (!Array.isArray(objPerm)) {
            objPerm = [objPerm];
        }
        let objectPermissionsRetriever = new metadataRetriever_1.default(this.conn, 'ObjectPermissions');
        let objectPermissions = await objectPermissionsRetriever.getComponents();
        objectPermissions.forEach((obj) => {
            let name = obj.fullName;
            if (unsuportedObjects.includes(name)) {
                return;
            }
            let objectIsPresent = false;
            for (let i = 0; i < objPerm.length; i++) {
                if (objPerm[i].object === name) {
                    objectIsPresent = true;
                    break;
                }
                else {
                    objectIsPresent = false;
                }
            }
            if (objectIsPresent === false) {
                let objToInsert = ProfileRetriever.buildObjPermArray(name, access);
                if (profileObj.objectPermissions === undefined) {
                    profileObj.objectPermissions = new Array();
                }
                else if (!Array.isArray(profileObj.objectPermissions)) {
                    profileObj.objectPermissions = [profileObj.objectPermissions];
                }
                profileObj.objectPermissions.push(objToInsert);
            }
        });
        if (profileObj.objectPermissions !== undefined) {
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
        }
        return profileObj;
    }
    static buildObjPermArray(objectName, access = true) {
        let newObjPerm = {
            allowCreate: access,
            allowDelete: access,
            allowEdit: access,
            allowRead: access,
            modifyAllRecords: access,
            object: objectName,
            viewAllRecords: access,
        };
        return newObjPerm;
    }
    static filterObjects(profileObj) {
        return profileObj.objectPermissions;
    }
    async enablePermission(profileObj, permissionName) {
        let found = false;
        if (profileObj.userPermissions !== null && profileObj.userPermissions.length > 0) {
            for (let i = 0; i < profileObj.userPermissions.length; i++) {
                let element = profileObj.userPermissions[i];
                if (element.name === permissionName) {
                    element.enabled = true;
                    found = true;
                    break;
                }
            }
        }
        if (!found) {
            if (profileObj.userPermissions === null || profileObj.userPermissions === undefined) {
                profileObj.userPermissions = [];
            }
            let supportedPermissions = await this.fetchPermissions();
            if (supportedPermissions.includes(permissionName)) {
                let permission = {
                    name: permissionName,
                    enabled: true,
                };
                profileObj.userPermissions.push(permission);
            }
        }
    }
    handleQueryAllFilesPermission(profileObj) {
        let isQueryAllFilesPermission = this.hasPermission(profileObj, 'QueryAllFiles');
        if (isQueryAllFilesPermission &&
            profileObj.objectPermissions !== undefined &&
            profileObj.objectPermissions.length > 0) {
            for (let i = 0; i < profileObj.objectPermissions.length; i++) {
                profileObj.objectPermissions[i].allowRead = true;
                profileObj.objectPermissions[i].viewAllRecords = true;
            }
        }
    }
    async handleViewAllDataPermission(profileObj) {
        let isViewAllData = this.hasPermission(profileObj, 'ViewAllData');
        if (isViewAllData && profileObj.objectPermissions !== undefined && profileObj.objectPermissions.length > 0) {
            for (let i = 0; i < profileObj.objectPermissions.length; i++) {
                profileObj.objectPermissions[i].allowRead = true;
                profileObj.objectPermissions[i].viewAllRecords = true;
            }
        }
        if (isViewAllData) {
            await this.enablePermission(profileObj, 'ViewPlatformEvents');
            await this.enablePermission(profileObj, 'ViewDataLeakageEvents');
        }
    }
    async handleInstallPackagingPermission(profileObj) {
        let hasPermission = this.hasPermission(profileObj, 'InstallPackaging');
        if (hasPermission) {
            await this.enablePermission(profileObj, 'ViewDataLeakageEvents');
        }
    }
    getUnsupportedLicencePermissions(licence) {
        if (!_.isNil(licence)) {
            for (let i = 0; i < userLicenceMap.length; i++) {
                if (userLicenceMap[i].name.trim().toLocaleLowerCase() === licence.trim().toLocaleLowerCase()) {
                    return userLicenceMap[i].unsupportedPermissions;
                }
            }
        }
        return [];
    }
    async fetchPermissions() {
        let permissionRetriever = new metadataRetriever_1.default(this.conn, 'UserPermissions');
        let permissionSets = await permissionRetriever.getComponents();
        let supportedPermissions = permissionSets.map((elem) => {
            return elem.fullName;
        });
        return supportedPermissions;
    }
    async fetchPermissionsWithValue(profileNames) {
        let describeResult = await new metadataOperation_1.default(this.conn).describeAnObject('Profile');
        let permissions = [];
        describeResult.fields.forEach((field) => {
            let fieldName = field['name'];
            if (fieldName.startsWith('Permissions')) {
                permissions.push(fieldName.trim());
            }
        });
        let permissionStr = permissions.join(', ');
        let query = `SELECT Id, Name, ${permissionStr} FROM Profile WHERE Name IN ('${profileNames.join("','")}')`;
        query = decodeURIComponent(query);
        let executor = new queryExecutor_1.default(this.conn);
        let profiles = await executor.executeQuery(query, false);
        return profiles;
    }
}
ProfileRetriever.supportedMetadataTypes = [
    'ApexClass',
    'CustomApplication',
    'CustomObject',
    'CustomField',
    'Layout',
    'ApexPage',
    'CustomTab',
    'RecordType',
    'SystemPermissions',
];
exports.default = ProfileRetriever;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZmlsZVJldHJpZXZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9pbXBsL21ldGFkYXRhL3JldHJpZXZlci9wcm9maWxlUmV0cmlldmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJQSwwQ0FBNEI7QUFDNUIsNEVBQW9EO0FBQ3BELHlFQUFpRDtBQUNqRCxpRkFBeUQ7QUFFekQsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBQzVDOzs7O0dBSUc7QUFDSCxNQUFNLGNBQWMsR0FBRztJQUNuQjtRQUNJLElBQUksRUFBRSxvQkFBb0I7UUFDMUIsc0JBQXNCLEVBQUUsQ0FBQyxzQkFBc0IsQ0FBQztLQUNuRDtDQUNKLENBQUM7QUFFRixNQUFxQixnQkFBZ0I7SUFhakMsWUFBMkIsSUFBZ0I7UUFBaEIsU0FBSSxHQUFKLElBQUksQ0FBWTtJQUFHLENBQUM7SUFFeEMsS0FBSyxDQUFDLFlBQVksQ0FBQyxZQUFzQjtRQUM1QyxJQUFJLGtCQUFrQixHQUFHLE1BQU0sSUFBSSxDQUFDLHlCQUF5QixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRTVFLElBQUksUUFBUSxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFRLENBQUM7UUFDL0UsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDMUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDdkMsTUFBTSxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLGtCQUFrQixDQUFDLENBQUM7Z0JBQzlELFFBQVEsQ0FBQyxDQUFDLENBQUMs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