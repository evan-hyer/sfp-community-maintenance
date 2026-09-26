import { Connection } from '@jsforce/jsforce-node';
export default class QueryExecutor {
    private conn;
    constructor(conn: Connection);
    executeQuery(query: string, tooling: boolean): Promise<any>;
    private executeNormalQuery;
    private executeBulkQuery;
    private getObjectTypeFromQuery;
    queryMore(url: string, tooling: boolean): Promise<any>;
}
//# sourceMappingURL=queryExecutor.d.ts.map