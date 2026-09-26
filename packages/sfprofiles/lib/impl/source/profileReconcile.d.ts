import ProfileActions from './profileActions';
export default class ProfileReconcile extends ProfileActions {
    reconcile(srcFolders: string[], profileList: string[], destFolder: string): Promise<string[]>;
    private runWorkers;
    private findProfilesToReconcile;
    private createDestinationFolder;
}
//# sourceMappingURL=profileReconcile.d.ts.map