import ProfileActions, { ProfileStatus } from './profileActions';
export default class ProfileSync extends ProfileActions {
    sync(srcFolders: string[], profilesToSync?: string[], isdelete?: boolean): Promise<ProfileStatus>;
}
//# sourceMappingURL=profileSync.d.ts.map