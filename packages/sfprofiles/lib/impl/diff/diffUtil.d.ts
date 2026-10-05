export interface DiffFileStatus {
    revisionFrom: string;
    revisionTo: string;
    path: string;
    renamedPath?: string;
}
export interface DiffFile {
    deleted: DiffFileStatus[];
    addedEdited: DiffFileStatus[];
}
export default class DiffUtil {
    static gitTreeRevisionTo: {
        revision: string;
        path: string;
    }[];
    static isFormulaField(diffFile: DiffFileStatus): Promise<boolean>;
    static fetchFileListRevisionTo(revisionTo: string): Promise<{
        revision: string;
        path: string;
    }[]>;
    static getRelativeFiles(filePath: string): Promise<{
        revision: string;
        path: string;
    }[]>;
    static copyFile(filePath: string, outputFolder: string): Promise<void>;
    static parseContent(fileContents: any): Promise<DiffFile>;
    static getChangedOrAdded(list1: any[], list2: any[], key: string): any;
    static addMemberToPackage(packageObj: any, name: any, member: any): any;
}
//# sourceMappingURL=diffUtil.d.ts.map