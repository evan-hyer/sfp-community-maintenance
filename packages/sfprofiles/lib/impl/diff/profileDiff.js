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
const xml2js = __importStar(require("xml2js"));
const util = __importStar(require("util"));
const _ = __importStar(require("lodash"));
const diffUtil_1 = __importDefault(require("./diffUtil"));
const profileWriter_1 = __importDefault(require("../metadata/writer/profileWriter"));
class ProfileDiff {
    static async generateProfileXml(profileXml1, profileXml2, outputFilePath) {
        var _a, _b, _c, _d;
        let profileWriter = new profileWriter_1.default();
        const parser = new xml2js.Parser({ explicitArray: true });
        const parseString = util.promisify(parser.parseString);
        let parseResult = await parseString(profileXml1);
        let profileObj1 = profileWriter.toProfile(parseResult.Profile);
        parseResult = await parseString(profileXml2);
        let profileObj2 = profileWriter.toProfile(parseResult.Profile);
        let newProObj = {
            fullName: profileObj2.fullName,
            applicationVisibilities: [],
            classAccesses: [],
            customMetadataTypeAccesses: [],
            customPermissions: [],
            customSettingAccesses: [],
            externalDataSourceAccesses: [],
            fieldLevelSecurities: [],
            fieldPermissions: [],
            flowAccesses: [],
            layoutAssignments: [],
            loginFlows: [],
            loginHours: [],
            loginIpRanges: [],
            objectPermissions: [],
            pageAccesses: [],
            profileActionOverrides: [],
            recordTypeVisibilities: [],
            tabVisibilities: [],
            userPermissions: [],
        };
        if (!_.isNil(profileObj2.description)) {
            newProObj.description = profileObj2.description;
        }
        newProObj.applicationVisibilities = diffUtil_1.default.getChangedOrAdded(profileObj1.applicationVisibilities, profileObj2.applicationVisibilities, 'application').addedEdited;
        newProObj.classAccesses = diffUtil_1.default.getChangedOrAdded(profileObj1.classAccesses, profileObj2.classAccesses, 'apexClass').addedEdited;
        newProObj.customPermissions = diffUtil_1.default.getChangedOrAdded(profileObj1.customPermissions, profileObj2.customPermissions, 'name').addedEdited;
        newProObj.externalDataSourceAccesses = diffUtil_1.default.getChangedOrAdded(profileObj1.externalDataSourceAccesses, profileObj2.externalDataSourceAccesses, 'externalDataSource').addedEdited;
        newProObj.fieldLevelSecurities = diffUtil_1.default.getChangedOrAdded(profileObj1.fieldLevelSecurities, profileObj2.fieldLevelSecurities, 'field').addedEdited;
        newProObj.fieldPermissions = diffUtil_1.default.getChangedOrAdded(profileObj1.fieldPermissions, profileObj2.fieldPermissions, 'field').addedEdited;
        newProObj.loginFlows = diffUtil_1.default.getChangedOrAdded((_a = profileObj1.loginFlows) === null || _a === void 0 ? void 0 : _a.filter((loginFlow) => loginFlow.flow !== undefined), (_b = profileObj2.loginFlows) === null || _b === void 0 ? void 0 : _b.filter((loginFlow) => loginFlow.flow !== undefined), 'flow').addedEdited;
        newProObj.loginFlows.push(...diffUtil_1.default.getChangedOrAdded((_c = profileObj1.loginFlows) === null || _c === void 0 ? void 0 : _c.filter((loginFlow) => loginFlow.vfFlowPage !== undefined), (_d = profileObj2.loginFlows) === null || _d === void 0 ? void 0 : _d.filter((loginFlow) => loginFlow.vfFlowPage !== undefined), 'vfFlowPage').addedEdited);
        newProObj.loginHours = !_.isEqual(profileObj1.loginHours, profileObj2.loginHours) ? profileObj2.loginHours : [];
        newProObj.loginIpRanges = !_.isEqual(profileObj1.loginIpRanges, profileObj2.loginIpRanges)
            ? profileObj2.loginIpRanges
            : [];
        newProObj.objectPermissions = diffUtil_1.default.getChangedOrAdded(profileObj1.objectPermissions, profileObj2.objectPermissions, 'object').addedEdited;
        newProObj.pageAccesses = diffUtil_1.default.getChangedOrAdded(profileObj1.pageAccesses, profileObj2.pageAccesses, 'apexPage').addedEdited;
        newProObj.profileActionOverrides = diffUtil_1.default.getChangedOrAdded(profileObj1.profileActionOverrides, profileObj2.profileActionOverrides, 'actionName').addedEdited;
        newProObj.recordTypeVisibilities = diffUtil_1.default.getChangedOrAdded(profileObj1.recordTypeVisibilities, profileObj2.recordTypeVisibilities, 'recordType').addedEdited;
        newProObj.tabVisibilities = diffUtil_1.default.getChangedOrAdded(profileObj1.tabVisibilities, profileObj2.tabVisibilities, 'tab').addedEdited;
        newProObj.userPermissions = diffUtil_1.default.getChangedOrAdded(profileObj1.userPermissions, profileObj2.userPermissions, 'name').addedEdited;
        newProObj.layoutAssignments = this.getChangedOrAddedLayouts(profileObj1.layoutAssignments, profileObj2.layoutAssignments);
        newProObj.customMetadataTypeAccesses = diffUtil_1.default.getChangedOrAdded(profileObj1.customMetadataTypeAccesses, profileObj2.customMetadataTypeAccesses, 'name').addedEdited;
        newProObj.customSettingAccesses = diffUtil_1.default.getChangedOrAdded(profileObj1.customSettingAccesses, profileObj2.customSettingAccesses, 'name').addedEdited;
        newProObj.flowAccesses = diffUtil_1.default.getChangedOrAdded(profileObj1.flowAccesses, profileObj2.flowAccesses, 'flow').addedEdited;
        if (newProObj.fullName === undefined || newProObj.fullName === '') {
            delete newProObj.fullName;
        }
        profileWriter.writeProfile(newProObj, outputFilePath);
    }
    static getChangedOrAddedLayouts(list1, list2) {
        let result = [];
        if (_.isNil(list1) && !_.isNil(list2) && list2.length > 0) {
            result.push(...list2);
        }
        if (!_.isNil(list1) && !_.isNil(list2)) {
            list2.forEach((layoutAss2) => {
                let found = false;
                for (let i = 0; i < list1.length; i++) {
                    let layoutAss1 = list1[i];
                    if (layoutAss1.layout === layoutAss2.layout) {
                        //check if edited
                        if (_.isEqual(layoutAss1, layoutAss2)) {
                            found = true;
                            break;
                        }
                    }
                }
                if (!found) {
                    result.push(layoutAss2);
                }
            });
        }
        return result;
    }
}
exports.default = ProfileDiff;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZmlsZURpZmYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvaW1wbC9kaWZmL3Byb2ZpbGVEaWZmLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQ0FBaUM7QUFDakMsMkNBQTZCO0FBRTdCLDBDQUE0QjtBQUU1QiwwREFBa0M7QUFDbEMsd0ZBQWdFO0FBRWhFLE1BQThCLFdBQVc7SUFDOUIsTUFBTSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxXQUFtQixFQUFFLFdBQW1CLEVBQUUsY0FBc0I7O1FBQ25HLElBQUksYUFBYSxHQUFHLElBQUksdUJBQWEsRUFBRSxDQUFDO1FBRXhDLE1BQU0sTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzFELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBMkUsQ0FBQztRQUVqSSxJQUFJLFdBQVcsR0FBRyxNQUFNLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNqRCxJQUFJLFdBQVcsR0FBRyxhQUFhLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUMvRCxXQUFXLEdBQUcsTUFBTSxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDN0MsSUFBSSxXQUFXLEdBQUcsYUFBYSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFL0QsSUFBSSxTQUFTLEdBQUc7WUFDWixRQUFRLEVBQUUsV0FBVyxDQUFDLFFBQVE7WUFDOUIsdUJBQXVCLEVBQUUsRUFBRTtZQUMzQixhQUFhLEVBQUUsRUFBRTtZQUNqQiwwQkFBMEIsRUFBRSxFQUFFO1lBQzlCLGlCQUFpQixFQUFFLEVBQUU7WUFDckIscUJBQXFCLEVBQUUsRUFBRTtZQUN6QiwwQkFBMEIs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