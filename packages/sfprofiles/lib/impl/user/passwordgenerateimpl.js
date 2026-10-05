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
// tslint:disable-next-line:ordered-imports
// eslint-disable-next-line no-useless-escape
const core_1 = require("@salesforce/core");
const queryExecutor_1 = __importDefault(require("../../utils/queryExecutor"));
const sfp_logger_1 = __importStar(require("@flxbl-io/sfp-logger"));
class Passwordgenerateimpl {
    static async run(userName) {
        const query = `SELECT id FROM User WHERE username = '${userName}'`;
        const authInfo = await core_1.AuthInfo.create({ username: userName });
        const userConnection = await core_1.Connection.create({ authInfo: authInfo });
        let queryUtil = new queryExecutor_1.default(userConnection);
        let userRecord = await queryUtil.executeQuery(query, false);
        let passwordBuffer = core_1.User.generatePasswordUtf8();
        let pwd;
        await passwordBuffer.value(async (buffer) => {
            try {
                pwd = buffer.toString('utf8');
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore TODO: expose `soap` on Connection however appropriate
                const soap = userConnection.soap;
                await soap.setPassword(userRecord[0].Id, pwd);
            }
            catch (e) {
                pwd = undefined;
                if (e.message === 'INSUFFICIENT_ACCESS: Cannot set password for self') {
                    sfp_logger_1.default.log(`${e.message}. Incase of scratch org, Add "features": ["EnableSetPasswordInApi"] in your project-scratch-def.json then create your scratch org.`, sfp_logger_1.LoggerLevel.WARN);
                }
                else {
                    sfp_logger_1.default.log(`${e.message}`, sfp_logger_1.LoggerLevel.WARN);
                }
            }
        });
        return {
            username: userName,
            password: pwd,
        };
    }
}
exports.default = Passwordgenerateimpl;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFzc3dvcmRnZW5lcmF0ZWltcGwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvaW1wbC91c2VyL3Bhc3N3b3JkZ2VuZXJhdGVpbXBsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBMkM7QUFDM0MsNkNBQTZDO0FBQzdDLDJDQUE4RDtBQUM5RCw4RUFBaUQ7QUFDakQsbUVBQTZEO0FBRTdELE1BQXFCLG9CQUFvQjtJQUM5QixNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFnQjtRQUNwQyxNQUFNLEtBQUssR0FBRyx5Q0FBeUMsUUFBUSxHQUFHLENBQUM7UUFFbkUsTUFBTSxRQUFRLEdBQUcsTUFBTSxlQUFRLENBQUMsTUFBTSxDQUFDLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDL0QsTUFBTSxjQUFjLEdBQUcsTUFBTSxpQkFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZFLElBQUksU0FBUyxHQUFHLElBQUksdUJBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUM3QyxJQUFJLFVBQVUsR0FBRyxNQUFNLFNBQVMsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzVELElBQUksY0FBYyxHQUFHLFdBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1FBQ2pELElBQUksR0FBRyxDQUFDO1FBRVIsTUFBTSxjQUFjLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxNQUFjLEVBQUUsRUFBRTtZQUNoRCxJQUFJLENBQUM7Z0JBQ0QsR0FBRyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRTlCLDZEQUE2RDtnQkFDN0QsbUVBQW1FO2dCQUNuRSxNQUFNLElBQUksR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDO2dCQUNqQyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNsRCxDQUFDO1lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFDVCxHQUFHLEdBQUcsU0FBUyxDQUFDO2dCQUNoQixJQUFJLENBQUMsQ0FBQyxPQUFPLEtBQUssbURBQW1ELEVBQUUsQ0FBQztvQkFDcEUsb0JBQVMsQ0FBQyxHQUFHLENBQ1QsR0FBRyxDQUFDLENBQUMsT0FBTyxvSUFBb0ksRUFDaEosd0JBQVcsQ0FBQyxJQUFJLENBQ25CLENBQUM7Z0JBQ04sQ0FBQztxQkFBTSxDQUFDO29CQUNKLG9CQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLHdCQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3BELENBQUM7WUFDTCxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPO1lBQ0gsUUFBUSxFQUFFLFFBQVE7WUFDbEIsUUFBUSxFQUFFLEdBQUc7U0FDaEIsQ0FBQztJQUNOLENBQUM7Q0FDSjtBQXJDRCx1Q0FxQ0MifQ==