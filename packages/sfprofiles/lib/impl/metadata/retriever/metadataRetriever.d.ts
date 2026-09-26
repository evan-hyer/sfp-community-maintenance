import { Connection } from '@jsforce/jsforce-node';
export default class MetadataRetriever {
    protected _componentType: any;
    protected _conn: any;
    constructor(conn: Connection, componentType: string);
    get componentType(): any;
    getComponents(parent?: string): Promise<any>;
    private getUserLicense;
    private getTabs;
    isComponentExistsInTheOrg(item: string, parent?: string): Promise<boolean>;
    isComponentExistsInProjectDirectory(item: string): Promise<boolean>;
    isComponentExistsInProjectDirectoryOrInOrg(item: string, parent?: string): Promise<boolean>;
    private getCustomObjects;
    getUserPermissions(): Promise<any[]>;
    private getObjectPermissions;
    private getFieldsByObjectName;
    private getRecordTypes;
    private getLayouts;
}
//# sourceMappingURL=metadataRetriever.d.ts.map