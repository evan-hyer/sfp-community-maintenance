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
const sfpowerkit_1 = require("./sfpowerkit");
const sfp_logger_1 = __importStar(require("@flxbl-io/sfp-logger"));
const async_retry_1 = __importDefault(require("async-retry"));
class MetadataOperation {
    constructor(conn) {
        this.conn = conn;
    }
    async getComponentsFromOrgUsingListMetadata(componentType) {
        const apiversion = await sfpowerkit_1.Sfpowerkit.getApiVersion();
        return await (0, async_retry_1.default)(async () => {
            try {
                let items = await this.conn.metadata.list({
                    type: componentType,
                }, apiversion);
                if (items === undefined || items === null) {
                    items = [];
                }
                if (!Array.isArray(items)) {
                    items = [items];
                }
                return items;
            }
            catch (error) {
                throw new Error(`Unable to fetch list for ${componentType}`);
            }
        }, {
            retries: 5,
            minTimeout: 2000,
            onRetry: (error) => {
                sfp_logger_1.default.log(`Retrying Network call due to ${error.message}`, sfp_logger_1.LoggerLevel.INFO);
            },
        });
    }
    async describeAnObject(componentType) {
        return await (0, async_retry_1.default)(async () => {
            try {
                return await this.conn.sobject(componentType).describe();
            }
            catch (error) {
                throw new Error(`Unable to describe  ${componentType}`);
            }
        }, {
            retries: 5,
            minTimeout: 2000,
            onRetry: (error) => {
                sfp_logger_1.default.log(`Retrying Network call due to ${error.message}`, sfp_logger_1.LoggerLevel.INFO);
            },
        });
    }
}
exports.default = MetadataOperation;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YWRhdGFPcGVyYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbHMvbWV0YWRhdGFPcGVyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLGtEQUErQztBQUMvQyxtRUFBNkQ7QUFDN0QsOERBQWdDO0FBRWhDLE1BQXFCLGlCQUFpQjtJQUNsQyxZQUFvQixJQUFnQjtRQUFoQixTQUFJLEdBQUosSUFBSSxDQUFZO0lBQUcsQ0FBQztJQUVqQyxLQUFLLENBQUMscUNBQXFDLENBQUMsYUFBcUI7UUFDcEUsTUFBTSxVQUFVLEdBQVcsTUFBTSx1QkFBVSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBRTVELE9BQU8sTUFBTSxJQUFBLHFCQUFLLEVBQ2QsS0FBSyxJQUFJLEVBQUU7WUFDUCxJQUFJLENBQUM7Z0JBQ0QsSUFBSSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQ3JDO29CQUNJLElBQUksRUFBRSxhQUFhO2lCQUN0QixFQUNELFVBQVUsQ0FDYixDQUFDO2dCQUVGLElBQUksS0FBSyxLQUFLLFNBQVMsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFLENBQUM7b0JBQ3hDLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQ2YsQ0FBQztnQkFFRCxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUN4QixLQUFLLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDcEIsQ0FBQztnQkFFRCxPQUFPLEtBQUssQ0FBQztZQUNqQixDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDYixNQUFNLElBQUksS0FBSyxDQUFDLDRCQUE0QixhQUFhLEVBQUUsQ0FBQyxDQUFDO1lBQ2pFLENBQUM7UUFDTCxDQUFDLEVBQ0Q7WUFDSSxPQUFPLEVBQUUsQ0FBQztZQUNWLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLE9BQU8sRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFO2dCQUNmLG9CQUFTLENBQUMsR0FBRyxDQUFDLGdDQUFnQyxLQUFLLENBQUMsT0FBTyxFQUFFLEVBQUUsd0JBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNyRixDQUFDO1NBQ0osQ0FDSixDQUFDO0lBQ04sQ0FBQztJQUVNLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFxQjtRQUMvQyxPQUFPLE1BQU0sSUFBQSxxQkFBSyxFQUNkLEtBQUssSUFBSSxFQUFFO1lBQ1AsSUFBSSxDQUFDO2dCQUNELE9BQU8sTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUM3RCxDQUFDO1lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztnQkFDYixNQUFNLElBQUksS0FBSyxDQUFDLHVCQUF1QixhQUFhLEVBQUUsQ0FBQyxDQUFDO1lBQzVELENBQUM7UUFDTCxDQUFDLEVBQ0Q7WUFDSSxPQUFPLEVBQUUsQ0FBQztZQUNWLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLE9BQU8sRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFO2dCQUNmLG9CQUFTLENBQUMsR0FBRyxDQUFDLGdDQUFnQyxLQUFLLENBQUMsT0FBTyxFQUFFLEVBQUUsd0JBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNyRixDQUFDO1NBQ0osQ0FDSixDQUFDO0lBQ04sQ0FBQztDQUNKO0FBekRELG9DQXlEQyJ9