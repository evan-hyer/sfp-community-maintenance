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
const fs = __importStar(require("fs-extra"));
const xml2js = __importStar(require("xml2js"));
const util = __importStar(require("util"));
const _ = __importStar(require("lodash"));
const diffUtil_1 = __importDefault(require("./diffUtil"));
const nonArayProperties = ['description', 'hasActivationRequired', 'label', 'license', 'userLicense', '$', 'fullName'];
const parser = new xml2js.Parser({
    explicitArray: false,
    valueProcessors: [
        function (name) {
            let result;
            if (name === 'true')
                result = true;
            if (name === 'false')
                result = false;
            return result;
        },
    ],
});
class PermsetDiff {
    constructor(debugFlag) {
        this.debugFlag = debugFlag;
    }
    static async generatePermissionsetXml(permissionsetXml1, permissionsetXml2, outputFilePath) {
        const parseString = util.promisify(parser.parseString);
        let parseResult = await parseString(permissionsetXml1);
        let permsetObj1 = parseResult.PermissionSet;
        parseResult = await parseString(permissionsetXml2);
        let permsetObj2 = parseResult.PermissionSet;
        let newPermsetObj = {};
        newPermsetObj.label = permsetObj2.label;
        if (!_.isNil(permsetObj2.description)) {
            newPermsetObj.description = permsetObj2.description;
        }
        if (!_.isNil(permsetObj2.license)) {
            newPermsetObj.license = permsetObj2.license;
        }
        if (permsetObj2.hasActivationRequired) {
            newPermsetObj.hasActivationRequired = permsetObj2.hasActivationRequired;
        }
        newPermsetObj.applicationVisibilities = diffUtil_1.default.getChangedOrAdded(permsetObj1.applicationVisibilities, permsetObj2.applicationVisibilities, 'application').addedEdited;
        newPermsetObj.classAccesses = diffUtil_1.default.getChangedOrAdded(permsetObj1.classAccesses, permsetObj2.classAccesses, 'apexClass').addedEdited;
        newPermsetObj.customPermissions = diffUtil_1.default.getChangedOrAdded(permsetObj1.customPermissions, permsetObj2.customPermissions, 'name').addedEdited;
        newPermsetObj.externalDataSourceAccesses = diffUtil_1.default.getChangedOrAdded(permsetObj1.externalDataSourceAccesses, permsetObj2.externalDataSourceAccesses, 'externalDataSource').addedEdited;
        newPermsetObj.fieldPermissions = diffUtil_1.default.getChangedOrAdded(permsetObj1.fieldPermissions, permsetObj2.fieldPermissions, 'field').addedEdited;
        newPermsetObj.objectPermissions = diffUtil_1.default.getChangedOrAdded(permsetObj1.objectPermissions, permsetObj2.objectPermissions, 'object').addedEdited;
        newPermsetObj.pageAccesses = diffUtil_1.default.getChangedOrAdded(permsetObj1.pageAccesses, permsetObj2.pageAccesses, 'apexPage').addedEdited;
        newPermsetObj.recordTypeVisibilities = diffUtil_1.default.getChangedOrAdded(permsetObj1.recordTypeVisibilities, permsetObj2.recordTypeVisibilities, 'recordType').addedEdited;
        newPermsetObj.tabSettings = diffUtil_1.default.getChangedOrAdded(permsetObj1.tabSettings, permsetObj2.tabSettings, 'tab').addedEdited;
        newPermsetObj.userPermissions = diffUtil_1.default.getChangedOrAdded(permsetObj1.userPermissions, permsetObj2.userPermissions, 'name').addedEdited;
        await PermsetDiff.writePermset(newPermsetObj, outputFilePath);
    }
    static async writePermset(permsetObj, filePath) {
        //Delete eampty arrays
        for (let key in permsetObj) {
            if (Array.isArray(permsetObj[key])) {
                //All top element must be arays exept non arrayProperties
                if (!nonArayProperties.includes(key) && permsetObj[key].length === 0) {
                    delete permsetObj[key];
                }
            }
        }
        if (permsetObj.label != undefined) {
            let builder = new xml2js.Builder({ rootName: 'PermissionSet' });
            permsetObj['$'] = {
                xmlns: 'http://soap.sforce.com/2006/04/metadata',
            };
            let xml = builder.buildObject(permsetObj);
            fs.writeFileSync(filePath, xml);
        }
    }
}
exports.default = PermsetDiff;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGVybXNldERpZmYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvaW1wbC9kaWZmL3Blcm1zZXREaWZmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw2Q0FBK0I7QUFDL0IsK0NBQWlDO0FBQ2pDLDJDQUE2QjtBQUM3QiwwQ0FBNEI7QUFDNUIsMERBQWtDO0FBRWxDLE1BQU0saUJBQWlCLEdBQUcsQ0FBQyxhQUFhLEVBQUUsdUJBQXVCLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxhQUFhLEVBQUUsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBRXZILE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUM3QixhQUFhLEVBQUUsS0FBSztJQUNwQixlQUFlLEVBQUU7UUFDYixVQUFVLElBQUk7WUFDVixJQUFJLE1BQWUsQ0FBQztZQUNwQixJQUFJLElBQUksS0FBSyxNQUFNO2dCQUFFLE1BQU0sR0FBRyxJQUFJLENBQUM7WUFDbkMsSUFBSSxJQUFJLEtBQUssT0FBTztnQkFBRSxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3JDLE9BQU8sTUFBTSxDQUFDO1FBQ2xCLENBQUM7S0FDSjtDQUNKLENBQUMsQ0FBQztBQUVILE1BQThCLFdBQVc7SUFHckMsWUFBbUIsU0FBbUI7UUFDbEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7SUFDL0IsQ0FBQztJQUVNLE1BQU0sQ0FBQyxLQUFLLENBQUMsd0JBQXdCLENBQ3hDLGlCQUF5QixFQUN6QixpQkFBeUIsRUFDekIsY0FBc0I7UUFFdEIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUEwRCxDQUFDO1FBRWhILElBQUksV0FBVyxHQUFHLE1BQU0sV0FBVyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDdkQsSUFBSSxXQUFXLEdBQUcsV0FBVyxDQUFD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