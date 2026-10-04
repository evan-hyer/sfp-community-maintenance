export default class DiffImpl {
    private revisionFrom?;
    private revisionTo?;
    private isDestructive?;
    private pathToIgnore?;
    destructivePackageObjPre: any[];
    destructivePackageObjPost: any[];
    resultOutput: {
        action: string;
        metadataType: string;
        componentName: string;
        message: string;
        path: string;
    }[];
    constructor(revisionFrom?: string, revisionTo?: string, isDestructive?: boolean, pathToIgnore?: any[]);
    build(outputFolder: string, packagedirectories: string[], apiversion: string): Promise<{
        action: string;
        metadataType: string;
        componentName: string;
        message: string;
        path: string;
    }[]>;
    private static checkForIngore;
    private buildOutput;
    private handleUnsplittedMetadata;
    private createDestructiveChanges;
    private writeDestructivechanges;
    private buildDestructiveTypeObj;
}
//# sourceMappingURL=diffImpl.d.ts.map