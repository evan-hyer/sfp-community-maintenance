import { Org } from '@salesforce/core';
import 'diff-match-patch-line-and-word';
export default class ProfileDiffImpl {
    private profileList;
    private sourceOrgStr;
    private targetOrg;
    private outputFolder;
    private sourceOrg;
    output: any[];
    private sourceLabel;
    private targetLabel;
    constructor(profileList: string[], sourceOrgStr: string, targetOrg: Org, outputFolder: string);
    diff(): Promise<void | any[]>;
    retrieveProfiles(profileNames: string[], retrieveOrg: any): Promise<any[]>;
    private processDiff;
}
//# sourceMappingURL=profileDiff.d.ts.map