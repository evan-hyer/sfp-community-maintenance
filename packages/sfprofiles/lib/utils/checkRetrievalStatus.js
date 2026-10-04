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
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRetrievalStatus = void 0;
const delay_1 = require("./delay");
const sfp_logger_1 = __importStar(require("@flxbl-io/sfp-logger"));
async function checkRetrievalStatus(conn, retrievedId, isToBeLoggedToConsole = true) {
    let metadata_result;
    while (true) {
        try {
            metadata_result = await conn.metadata.checkRetrieveStatus(retrievedId);
        }
        catch (error) {
            throw new Error(error.message);
        }
        if (metadata_result.done === 'false') {
            if (isToBeLoggedToConsole)
                sfp_logger_1.default.log(`Polling for Retrieval Status`, sfp_logger_1.LoggerLevel.INFO);
            await (0, delay_1.delay)(5000);
        }
        else {
            //this.ux.logJson(metadata_result);
            break;
        }
    }
    return metadata_result;
}
exports.checkRetrievalStatus = checkRetrievalStatus;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hlY2tSZXRyaWV2YWxTdGF0dXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbHMvY2hlY2tSZXRyaWV2YWxTdGF0dXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSxtQ0FBZ0M7QUFDaEMsbUVBQTZEO0FBSXRELEtBQUssVUFBVSxvQkFBb0IsQ0FBQyxJQUFnQixFQUFFLFdBQW1CLEVBQUUscUJBQXFCLEdBQUcsSUFBSTtJQUMxRyxJQUFJLGVBQWUsQ0FBQztJQUVwQixPQUFPLElBQUksRUFBRSxDQUFDO1FBQ1YsSUFBSSxDQUFDO1lBQ0QsZUFBZSxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUMzRSxDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNiLE1BQU0sSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFFRCxJQUFJLGVBQWUsQ0FBQyxJQUFJLEtBQUssT0FBTyxFQUFFLENBQUM7WUFDbkMsSUFBSSxxQkFBcUI7Z0JBQUUsb0JBQVMsQ0FBQyxHQUFHLENBQUMsOEJBQThCLEVBQUUsd0JBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMzRixNQUFNLElBQUEsYUFBSyxFQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RCLENBQUM7YUFBTSxDQUFDO1lBQ0osbUNBQW1DO1lBQ25DLE1BQU07UUFDVixDQUFDO0lBQ0wsQ0FBQztJQUNELE9BQU8sZUFBZSxDQUFDO0FBQzNCLENBQUM7QUFuQkQsb0RBbUJDIn0=