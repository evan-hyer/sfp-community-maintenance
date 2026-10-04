import Profile from '../schema';
import { Connection } from '@jsforce/jsforce-node';
import { MetadataInfo } from '../metadataInfo';
export default class ProfileRetriever {
    private conn;
    static supportedMetadataTypes: string[];
    constructor(conn: Connection);
    loadProfiles(profileNames: string[]): Promise<MetadataInfo[]>;
    handlePermissions(profileObj: Profile, permissions: any): Promise<Profile>;
    private completeUserPermissions;
    private hasPermission;
    private completeObjects;
    private static buildObjPermArray;
    private static filterObjects;
    private enablePermission;
    private handleQueryAllFilesPermission;
    private handleViewAllDataPermission;
    private handleInstallPackagingPermission;
    getUnsupportedLicencePermissions(licence: string): any;
    private fetchPermissions;
    private fetchPermissionsWithValue;
}
//# sourceMappingURL=profileRetriever.d.ts.map