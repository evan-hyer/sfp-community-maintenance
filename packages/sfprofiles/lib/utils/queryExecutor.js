"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sfp_logger_1 = __importStar(require("@flxbl-io/sfp-logger"));
const async_retry_1 = __importDefault(require("async-retry"));
class QueryExecutor {
    constructor(conn) {
        this.conn = conn;
    }
    async executeQuery(query, tooling) {
        return await (0, async_retry_1.default)(async () => {
            var _a, _b;
            try {
                // First try normal query
                return await this.executeNormalQuery(query, tooling);
            }
            catch (error) {
                // If we get a header size error, fallback to bulk query
                if (((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('431')) || ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes('Request Header Fields Too Large'))) {
                    return await this.executeBulkQuery(query);
                }
                throw error;
            }
        }, {
            retries: 5,
            minTimeout: 2000,
            onRetry: (error) => {
                sfp_logger_1.default.log(`Retrying Network call due to ${error.message}`, sfp_logger_1.LoggerLevel.INFO);
            },
        });
    }
    async executeNormalQuery(query, tooling) {
        let results;
        if (tooling) {
            results = (await this.conn.tooling.query(query));
        }
        else {
            results = (await this.conn.query(query));
        }
        if (!results.done) {
            let tempRecords = results.records;
            while (!results.done) {
                results = await this.queryMore(results.nextRecordsUrl, tooling);
                tempRecords = tempRecords.concat(results.records);
            }
            results.records = tempRecords;
        }
        return results.records;
    }
    async executeBulkQuery(query) {
        try {
            // Extract object type from query
            const objectType = this.getObjectTypeFromQuery(query);
            const queryStream = await this.conn.bulk2.query(query);
            // Collect records from stream
            const records = [];
            for await (const record of queryStream) {
                records.push(record);
            }
            // Transform results to match REST API format
            return records.map((record) => ({
                attributes: {
                    type: objectType,
                    url: `/services/data/v${this.conn.version}/sobjects/${objectType}/${record.Id}`
                },
                ...record
            }));
        }
        catch (error) {
            throw new Error(`Bulk query failed: ${error.message}`);
        }
    }
    getObjectTypeFromQuery(query) {
        const matches = query.match(/FROM\s+([a-zA-Z0-9_]+)/i);
        if (!matches || !matches[1]) {
            throw new Error('Unable to determine object type from query');
        }
        return matches[1];
    }
    async queryMore(url, tooling) {
        let result;
        if (tooling) {
            result = (await this.conn.tooling.queryMore(url));
        }
        else {
            result = (await this.conn.queryMore(url));
        }
        return result;
    }
}
exports.default = QueryExecutor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnlFeGVjdXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9xdWVyeUV4ZWN1dG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxtRUFBNkQ7QUFDN0QsOERBQWdDO0FBRWhDLE1BQXFCLGFBQWE7SUFDOUIsWUFBb0IsSUFBZ0I7UUFBaEIsU0FBSSxHQUFKLElBQUksQ0FBWTtJQUFHLENBQUM7SUFFakMsS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFhLEVBQUUsT0FBZ0I7UUFDckQsT0FBTyxNQUFNLElBQUEscUJBQUssRUFDZCxLQUFLLElBQUksRUFBRTs7WUFDUCxJQUFJLENBQUM7Z0JBQ0QseUJBQXlCO2dCQUN6QixPQUFPLE1BQU0sSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztZQUN6RCxDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDYix3REFBd0Q7Z0JBQ3hELElBQUksQ0FBQSxNQUFBLEtBQUssQ0FBQyxPQUFPLDBDQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBSSxNQUFBLEtBQUssQ0FBQyxPQUFPLDBDQUFFLFFBQVEsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFBLEVBQUUsQ0FBQztvQkFDL0YsT0FBTyxNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDOUMsQ0FBQztnQkFDRCxNQUFNLEtBQUssQ0FBQztZQUNoQixDQUFDO1FBQ0wsQ0FBQyxFQUNEO1lBQ0ksT0FBTyxFQUFFLENBQUM7WUFDVixVQUFVLEVBQUUsSUFBSTtZQUNoQixPQUFPLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRTtnQkFDZixvQkFBUyxDQUFDLEdBQUcsQ0FBQyxnQ0FBZ0MsS0FBSyxDQUFDLE9BQU8sRUFBRSxFQUFFLHdCQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDckYsQ0FBQztTQUNK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