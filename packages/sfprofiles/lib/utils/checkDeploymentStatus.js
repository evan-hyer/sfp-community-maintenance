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
exports.checkDeploymentStatus = void 0;
const delay_1 = require("./delay");
const sfp_logger_1 = __importStar(require("@flxbl-io/sfp-logger"));
async function checkDeploymentStatus(conn, retrievedId) {
    let metadata_result;
    while (true) {
        try {
            metadata_result = await conn.metadata.checkDeployStatus(retrievedId, true);
        }
        catch (error) {
            throw new Error(error.message);
        }
        if (!metadata_result.done) {
            sfp_logger_1.default.log('Polling for Deployment Status', sfp_logger_1.LoggerLevel.INFO);
            await (0, delay_1.delay)(5000);
        }
        else {
            break;
        }
    }
    return metadata_result;
}
exports.checkDeploymentStatus = checkDeploymentStatus;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hlY2tEZXBsb3ltZW50U3RhdHVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWxzL2NoZWNrRGVwbG95bWVudFN0YXR1cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLG1DQUFnQztBQUNoQyxtRUFBNkQ7QUFHdEQsS0FBSyxVQUFVLHFCQUFxQixDQUFDLElBQWdCLEVBQUUsV0FBbUI7SUFDN0UsSUFBSSxlQUFlLENBQUM7SUFFcEIsT0FBTyxJQUFJLEVBQUUsQ0FBQztRQUNWLElBQUksQ0FBQztZQUNELGVBQWUsR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQy9FLENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ1QsTUFBTSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdkMsQ0FBQztRQUVELElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDeEIsb0JBQVMsQ0FBQyxHQUFHLENBQUMsK0JBQStCLEVBQUUsd0JBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNqRSxNQUFNLElBQUEsYUFBSyxFQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RCLENBQUM7YUFBTSxDQUFDO1lBQ0osTUFBTTtRQUNWLENBQUM7SUFDTCxDQUFDO0lBQ0QsT0FBTyxlQUFlLENBQUM7QUFDM0IsQ0FBQztBQWxCRCxzREFrQkMifQ==