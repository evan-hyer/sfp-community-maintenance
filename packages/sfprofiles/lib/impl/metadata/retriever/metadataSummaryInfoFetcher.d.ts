import { Connection } from '@jsforce/jsforce-node';
export default class MetadataSummaryInfoFetcher {
    private static NotSupportedTypes;
    static fetchMetadataSummaryFromAnOrg(conn: Connection, isDisplayProgressBar?: boolean, filterTypes?: string[]): Promise<Map<string, MetadataSummary>>;
    static fetchMetadataSummaryByTypesFromAnOrg(conn: Connection, types: any[], metadataMap: Map<string, MetadataSummary>): Promise<any>;
}
export interface MetadataSummary {
    id: string;
    fullName: string;
    type: string;
}
//# sourceMappingURL=metadataSummaryInfoFetcher.d.ts.map