import MetadataFiles from '../metadata/metadataFiles';
import ProfileActions, { ProfileStatus } from './profileActions';
export default class ProfileMerge extends ProfileActions {
    metadataFiles: MetadataFiles;
    private mergeApps;
    private mergeClasses;
    private mergeFields;
    private mergeLayouts;
    private mergeObjects;
    private mergePages;
    private mergeRecordTypes;
    private mergeTabs;
    private mergePermissions;
    private mergeCustomPermissions;
    private mergeCustomMetadataAccesses;
    private mergeCustomSettingAccesses;
    private mergeFlowAccesses;
    private mergeLoginFlows;
    private mergeExternalDatasourceAccesses;
    /**
     * Merge two profile and make sure that profile 1 contains all config present in the profile 2
     * @param profile1
     * @param profile2
     */
    private mergeProfile;
    merge(srcFolders: string[], profiles: string[], metadatas: any, isdelete?: boolean): Promise<ProfileStatus>;
    private removeUnwantedPermissions;
}
//# sourceMappingURL=profileMerge.d.ts.map