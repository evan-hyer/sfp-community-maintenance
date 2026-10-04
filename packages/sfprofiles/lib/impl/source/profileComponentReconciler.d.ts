import { Connection } from '@salesforce/core';
import Profile from '../metadata/schema';
export default class ProfileComponentReconciler {
    private conn;
    private isSourceOnly;
    constructor(conn: Connection, isSourceOnly: boolean);
    reconcileProfileComponents(profileObj: Profile, profileName: string): Promise<Profile>;
    private removeUserPermissionNotAvailableInOrg;
    private removePermissionsBasedOnProjectConfig;
    private removeUnsupportedUserPermissions;
    private cleanupUserLicenses;
    private reconcileApp;
    private reconcileClasses;
    private reconcileFields;
    private reconcileLayouts;
    private reconcileObjects;
    private reconcileCustomMetadata;
    private reconcileCustomSettings;
    private reconcileExternalDataSource;
    private reconcileFlow;
    private reconcileLoginFlow;
    private reconcileCustomPermission;
    private reconcilePages;
    private reconcileRecordTypes;
    private reconcileTabs;
    private fetchPermissions;
    private reconcileUserPermissions;
}
//# sourceMappingURL=profileComponentReconciler.d.ts.map