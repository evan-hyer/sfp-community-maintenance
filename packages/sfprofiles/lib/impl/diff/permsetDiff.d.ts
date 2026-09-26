export default abstract class PermsetDiff {
    protected debugFlag: boolean;
    constructor(debugFlag?: boolean);
    static generatePermissionsetXml(permissionsetXml1: string, permissionsetXml2: string, outputFilePath: string): Promise<void>;
    private static writePermset;
}
//# sourceMappingURL=permsetDiff.d.ts.map