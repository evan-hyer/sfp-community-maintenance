import { Connection, Org } from '@salesforce/core';
import ProfileRetriever from '../metadata/retriever/profileRetriever';
import Profile from '../metadata/schema';
export default abstract class ProfileActions {
    org: Org;
    protected conn: Connection;
    protected profileRetriever: ProfileRetriever;
    profileFileExtension: string;
    constructor(org: Org);
    protected getRemoteProfilesWithLocalStatus(profileNames: string[], packageDirectories?: string[]): Promise<ProfileStatus>;
    protected loadProfileFromPackageDirectories(packageDirectories?: string[]): Promise<ProfileSourceFile[]>;
    protected reconcileTabs(profileObj: Profile): Promise<void>;
}
export interface ProfileSourceFile {
    path?: string;
    name?: string;
}
export interface ProfileStatus {
    added: ProfileSourceFile[];
    deleted: ProfileSourceFile[];
    updated: ProfileSourceFile[];
}
//# sourceMappingURL=profileActions.d.ts.map