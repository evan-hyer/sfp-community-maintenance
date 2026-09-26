export default class SharingRuleDiff {
    static generateSharingRulesXml(sharingRuleXml1: string, sharingRuleXml2: string, outputFilePath: string, objectName: string, destructivePackageObj: any[], resultOutput: any[], isDestructive: boolean): Promise<any[]>;
    private static updateOutput;
    private static ensureArray;
    static getMembers(filePath: string): Promise<{}>;
    private static buildSharingRulesObj;
    private static buildDestructiveChangesObj;
    private static writeSharingRule;
}
//# sourceMappingURL=sharingRuleDiff.d.ts.map