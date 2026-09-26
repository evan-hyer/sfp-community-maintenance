export default class CustomLabelsDiff {
    static getMembers(filePath: string): Promise<any[]>;
    static generateCustomLabelsXml(customLabelsXml1: string, customLabelsXml2: string, outputFilePath: string, destructivePackageObj: any[], resultOutput: any[], isDestructive: boolean): Promise<any[]>;
    private static updateOutput;
    private static buildCustomLabelsObj;
    private static buildDestructiveChanges;
    private static writeCustomLabel;
}
//# sourceMappingURL=customLabelsDiff.d.ts.map