import { Connection } from '@jsforce/jsforce-node';
export default class MetadataOperation {
    private conn;
    constructor(conn: Connection);
    getComponentsFromOrgUsingListMetadata(componentType: string): Promise<import("@jsforce/jsforce-node/lib/api/metadata").FileProperties[]>;
    describeAnObject(componentType: string): Promise<import("@jsforce/jsforce-node").DescribeSObjectResult>;
}
//# sourceMappingURL=metadataOperation.d.ts.map