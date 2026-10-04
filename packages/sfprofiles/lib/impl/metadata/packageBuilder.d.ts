import { Connection } from '@jsforce/jsforce-node';
/**
 * This code was adapted from github:sfdx-jayree-plugin project which was
 * based on the original github:sfdx-hydrate project
 */
export declare class Packagexml {
    configs: BuildConfig;
    private conn;
    private packageTypes;
    private ipRegex;
    result: {
        type: string;
        createdById?: string;
        createdByName?: string;
        createdDate?: string;
        fileName?: string;
        fullName: string;
        id?: string;
        lastModifiedById?: string;
        lastModifiedByName?: string;
        lastModifiedDate?: string;
        manageableState?: string;
        namespacePrefix?: string;
    }[];
    constructor(conn: Connection, configs: BuildConfig);
    build(): Promise<any>;
    private setStandardValueset;
    private buildInstalledPackageRegex;
    private describeMetadata;
    private handleFolderObject;
    private handleNonFolderObject;
    private isAvailableinIncludeList;
    private convertToArray;
    private filterItems;
    private filterChildItems;
    private getParentName;
    private generateXml;
    private addMember;
    private isManagePackageIgnored;
}
export declare class BuildConfig {
    includeFilters: string[];
    excludeFilters: string[];
    excludeManaged: boolean;
    includeChilds: boolean;
    apiVersion: string;
    targetDir: string;
    outputFile: string;
    constructor(flags: object, apiVersion: string);
}
//# sourceMappingURL=packageBuilder.d.ts.map