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
const _ = __importStar(require("lodash"));
const userPermissionDependencies = [
    {
        name: 'ViewAllData',
        permissionsRequired: ['ViewPlatformEvents', 'ViewDataLeakageEvents'],
        hasAccessOnData: true,
    },
    {
        name: 'QueryAllFiles',
        hasAccessOnData: true,
    },
    {
        name: 'InstallPackaging',
        permissionsRequired: ['ViewDataLeakageEvents', 'EditPublicReports'],
    },
    {
        name: 'CanUseNewDashboardBuilder',
        permissionsRequired: ['ManageDashboards'],
    },
    {
        name: 'ScheduleReports',
        permissionsRequired: ['EditReports', 'RunReports'],
    },
    {
        name: 'EditReports',
        permissionsRequired: ['RunReports'],
    },
    {
        name: 'ModifyAllData',
        permissionsRequired: ['EditPublicReports', 'ManageDashboards'],
    },
    {
        name: 'BulkMacrosAllowed',
        objectsAccessRequired: [
            {
                object: 'Macro',
                allowCreate: 'false',
                allowDelete: 'false',
                allowEdit: 'false',
                allowRead: 'true',
                modifyAllRecords: 'false',
                viewAllRecords: 'false',
            },
        ],
    },
    {
        name: 'ManageSolutions',
        objectsAccessRequired: [
            {
                object: 'Solution',
                allowCreate: 'true',
                allowDelete: 'true',
                allowEdit: 'true',
                allowRead: 'true',
                modifyAllRecords: 'false',
                viewAllRecords: 'false',
            },
        ],
    },
    {
        name: 'ManageCssUsers',
        objectsAccessRequired: [
            {
                object: 'Contact',
                allowCreate: 'true',
                allowDelete: 'false',
                allowEdit: 'true',
                allowRead: 'true',
                modifyAllRecords: 'false',
                viewAllRecords: 'false',
            },
        ],
    },
    {
        name: 'TransferAnyCase',
        objectsAccessRequired: [
            {
                object: 'Case',
                allowCreate: 'true',
                allowDelete: 'false',
                allowEdit: 'false',
                allowRead: 'true',
                modifyAllRecords: 'false',
                viewAllRecords: 'false',
            },
        ],
    },
];
class UserPermissionBuilder {
    constructor() { }
    addPermissionDependencies(profileOrPermissionSet) {
        let objectAccessRequired = [];
        for (let i = 0; i < userPermissionDependencies.length; i++) {
            let dependedPermission = userPermissionDependencies[i];
            if (profileOrPermissionSet.userPermissions != null && profileOrPermissionSet.userPermissions.length > 0) {
                for (let j = 0; j < profileOrPermissionSet.userPermissions.length; j++) {
                    let permission = profileOrPermissionSet.userPermissions[j];
                    if (permission.name == dependedPermission.name) {
                        objectAccessRequired.push(...dependedPermission.objectsAccessRequired);
                    }
                }
            }
        }
        if (objectAccessRequired.length > 0) {
            this.addRequiredObjectAccess(profileOrPermissionSet, this.mergeObjectAccess(objectAccessRequired));
        }
    }
    mergeObjectAccess(objectAccessRequired) {
        let objectMapping = {};
        for (let i = 0; i < objectAccessRequired.length; i++) {
            let objectAccess = objectAccessRequired[i];
            if (objectMapping[objectAccess.object] != undefined) {
                //console.log('Adding access');
                this.addAccess(objectMapping[objectAccess.object], objectAccess);
            }
            else {
                //console.log('object access does not exists ');
                objectMapping[objectAccess.object] = objectAccess;
            }
        }
        return Object.values(objectMapping);
    }
    addAccess(objectAccess1, ObjectAccess2) {
        objectAccess1.allowCreate = objectAccess1.allowCreate.toString() === 'true' ? true : ObjectAccess2.allowCreate;
        objectAccess1.allowDelete = objectAccess1.allowDelete.toString() === 'true' ? true : ObjectAccess2.allowDelete;
        objectAccess1.allowEdit = objectAccess1.allowEdit.toString() === 'true' ? true : ObjectAccess2.allowEdit;
        objectAccess1.allowRead = objectAccess1.allowRead.toString() === 'true' ? true : ObjectAccess2.allowRead;
        objectAccess1.modifyAllRecords =
            objectAccess1.modifyAllRecords.toString() === true ? true : ObjectAccess2.modifyAllRecords;
        objectAccess1.viewAllRecords =
            objectAccess1.viewAllRecords.toString() === 'true' ? true : ObjectAccess2.viewAllRecords;
    }
    addRequiredObjectAccess(profileOrPermissionSet, objectAccessRequired) {
        if (!profileOrPermissionSet.objectPermissions ||
            !Array.isArray(profileOrPermissionSet.objectPermissions)) {
            profileOrPermissionSet.objectPermissions = objectAccessRequired;
        }
        else {
            let objectAccesses = objectAccessRequired.filter((objectAccess) => {
                let exist = false;
                for (let i = 0; i < profileOrPermissionSet.objectPermissions.length; i++) {
                    let profileObjectAccess = profileOrPermissionSet.objectPermissions[i];
                    exist = profileObjectAccess.object == objectAccess.object;
                    if (exist) {
                        this.addAccess(profileObjectAccess, objectAccess);
                        break;
                    }
                }
                return !exist;
            });
            if (objectAccesses.length > 0) {
                profileOrPermissionSet.objectPermissions.push(...objectAccesses);
            }
        }
    }
    handlePermissionDependency(profileOrPermissionSet, supportedPermissions) {
        userPermissionDependencies.forEach((userPermission) => {
            let hasPermission = this.hasPermission(profileOrPermissionSet, userPermission.name);
            if (hasPermission &&
                userPermission.hasAccessOnData &&
                profileOrPermissionSet.objectPermissions !== undefined &&
                profileOrPermissionSet.objectPermissions.length > 0) {
                for (let i = 0; i < profileOrPermissionSet.objectPermissions.length; i++) {
                    profileOrPermissionSet.objectPermissions[i].allowRead = true;
                    profileOrPermissionSet.objectPermissions[i].viewAllRecords = true;
                }
            }
            if (hasPermission &&
                userPermission.permissionsRequired !== undefined &&
                userPermission.permissionsRequired.length > 0) {
                for (let i = 0; i < userPermission.permissionsRequired.length; i++) {
                    this.enablePermission(profileOrPermissionSet, userPermission.permissionsRequired[i], supportedPermissions);
                }
            }
        });
    }
    enablePermission(profileObj, permissionName, supportedPermission) {
        let found = false;
        if (profileObj.userPermissions !== undefined && profileObj.userPermissions.length > 0) {
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
            if (_.isNil(profileObj.userPermissions)) {
                profileObj.userPermissions = [];
            }
            if (!_.isNil(supportedPermission) && supportedPermission.includes(permissionName)) {
                let permission = {
                    name: permissionName,
                    enabled: true,
                };
                profileObj.userPermissions.push(permission);
            }
        }
    }
    hasPermission(profileOrPermissionSet, permissionName) {
        let found = false;
        if (!_.isNil(profileOrPermissionSet.userPermissions)) {
            for (let i = 0; i < profileOrPermissionSet.userPermissions.length; i++) {
                let element = profileOrPermissionSet.userPermissions[i];
                if (element.name === permissionName) {
                    found = element.enabled;
                    break;
                }
            }
        }
        return found;
    }
}
exports.default = UserPermissionBuilder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlclBlcm1pc3Npb25CdWlsZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2ltcGwvbWV0YWRhdGEvYnVpbGRlci91c2VyUGVybWlzc2lvbkJ1aWxkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLDBDQUE0QjtBQUU1QixNQUFNLDBCQUEwQixHQUFHO0lBQy9CO1FBQ0ksSUFBSSxFQUFFLGFBQWE7UUFDbkIsbUJBQW1CLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSx1QkFBdUIsQ0FBQztRQUNwRSxlQUFlLEVBQUUsSUFBSTtLQUN4QjtJQUNEO1FBQ0ksSUFBSSxFQUFFLGVBQWU7UUFDckIsZUFBZSxFQUFFLElBQUk7S0FDeEI7SUFDRDtRQUNJLElBQUksRUFBRSxrQkFBa0I7UUFDeEIsbUJBQW1CLEVBQUUsQ0FBQyx1QkFBdUIsRUFBRSxtQkFBbUIsQ0FBQztLQUN0RTtJQUNEO1FBQ0ksSUFBSSxFQUFFLDJCQUEyQjtRQUNqQyxtQkFBbUIsRUFBRSxDQUFDLGtCQUFrQixDQUFDO0tBQzVDO0lBQ0Q7UUFDSSxJQUFJLEVBQUUsaUJBQWlCO1FBQ3ZCLG1CQUFtQixFQUFFLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQztLQUNyRDtJQUNEO1FBQ0ksSUFBSSxFQUFFLGFBQWE7UUFDbkIsbUJBQW1CLEVBQUUsQ0FBQyxZQUFZLENBQUM7S0FDdEM7SUFDRDtRQUNJLElBQUksRUFBRSxlQUFlO1FBQ3JCLG1CQUFtQixFQUFFLENBQUMsbUJBQW1CLEVBQUUsa0JBQWtCLENBQUM7S0FDakU7SUFDRDtRQUNJLElBQUksRUFBRSxtQkFBbUI7UUFDekIscUJBQXFCLEVBQUU7WUFDbkI7Z0JBQ0ksTUFBTSxFQUFFLE9BQU87Z0JBQ2YsV0FBVyxFQUFFLE9BQU87Z0JBQ3BCLFdBQVcsRUFBRSxPQUFPO2dCQUNwQixTQUFTLEVBQUUsT0FBTztnQkFDbEIsU0FBUyxFQUFFLE1BQU07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