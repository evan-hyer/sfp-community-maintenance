import { Connection } from '@salesforce/core';
import { ProfileSourceFile } from './profileActions';
export default class ReconcileWorker {
    private targetOrg;
    private isSourceOnly;
    conn: Connection;
    constructor(targetOrg: string, isSourceOnly: boolean);
    reconcile(profilesToReconcile: ProfileSourceFile[], destFolder: string): Promise<string[]>;
    private loadAllLocalComponents;
    private loadComponentsTocache;
    reconcileProfileJob(profileComponent: ProfileSourceFile, destFolder: string): Promise<string[]>;
}
//# sourceMappingURL=reconcileWorker.d.ts.map