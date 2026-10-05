export default class WorkflowDiff {
    static generateWorkflowXml(workflowXml1: string, workflowXml2: string, outputFilePath: string, objectName: string, destructivePackageObj: any[], resultOutput: any[], isDestructive: boolean): Promise<any[]>;
    private static updateOutput;
    private static ensureArray;
    static getMembers(filePath: string): Promise<{}>;
    private static buildNewWorkflowObj;
    private static buildDestructiveChangesObj;
    private static buildDestructiveType;
    private static writeWorkflow;
}
//# sourceMappingURL=workflowDiff.d.ts.map