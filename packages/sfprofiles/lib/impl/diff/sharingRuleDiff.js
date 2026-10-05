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
const _ = require('lodash');
const util = __importStar(require("util"));
const diffUtil_1 = __importDefault(require("./diffUtil"));
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
class SharingRuleDiff {
    static async generateSharingRulesXml(sharingRuleXml1, sharingRuleXml2, outputFilePath, objectName, destructivePackageObj, resultOutput, isDestructive) {
        const parseString = util.promisify(parser.parseString);
        let sharingRulesObj1 = {};
        let sharingRulesObj2 = {};
        if (sharingRuleXml1 !== '') {
            let parseResult = await parseString(sharingRuleXml1);
            sharingRulesObj1 = parseResult.SharingRules || {};
        }
        if (sharingRuleXml2 !== '') {
            let parseResult = await parseString(sharingRuleXml2);
            sharingRulesObj2 = parseResult.SharingRules || {};
        }
        let addedEditedOrDeleted = SharingRuleDiff.buildSharingRulesObj(sharingRulesObj1, sharingRulesObj2);
        SharingRuleDiff.writeSharingRule(addedEditedOrDeleted.addedEdited, outputFilePath);
        destructivePackageObj = SharingRuleDiff.buildDestructiveChangesObj(addedEditedOrDeleted.deleted, destructivePackageObj, objectName);
        SharingRuleDiff.updateOutput(addedEditedOrDeleted.addedEdited, resultOutput, objectName, 'Deploy', outputFilePath);
        if (isDestructive) {
            SharingRuleDiff.updateOutput(addedEditedOrDeleted.deleted, resultOutput, objectName, 'Delete', 'destructiveChanges.xml');
        }
        return destructivePackageObj;
    }
    static updateOutput(sharingRulesObj, resultOutput, objectName, action, filePath) {
        sharingRulesObj.sharingCriteriaRules.forEach((elem) => {
            resultOutput.push({
                action: action,
                metadataType: 'SharingCriteriaRule',
                componentName: `${objectName}.${elem.fullName}`,
                path: filePath,
            });
        });
        sharingRulesObj.sharingOwnerRules.forEach((elem) => {
            resultOutput.push({
                action: action,
                metadataType: 'SharingOwnerRule',
                componentName: `${objectName}.${elem.fullName}`,
                path: filePath,
            });
        });
        sharingRulesObj.sharingTerritoryRules.forEach((elem) => {
            resultOutput.push({
                action: action,
                metadataType: 'SharingTerritoryRule',
                componentName: `${objectName}.${elem.fullName}`,
                path: filePath,
            });
        });
    }
    static ensureArray(sharingObj) {
        let keys = Object.keys(sharingObj);
        keys.forEach((key) => {
            if (typeof sharingObj[key] === 'object' && !Array.isArray(sharingObj[key]) && key !== '$') {
                sharingObj[key] = [sharingObj[key]];
            }
        });
        return sharingObj;
    }
    static async getMembers(filePath) {
        let fileContent = fs.readFileSync(filePath, 'utf8').toString();
        const parseString = util.promisify(parser.parseString);
        let members = {};
        if (fileContent !== '') {
            let parseResult = await parseString(fileContent);
            let sharingRulesObj = parseResult.SharingRules || {};
            if (!_.isNil(sharingRulesObj.sharingCriteriaRules)) {
                if (!Array.isArray(sharingRulesObj.sharingCriteriaRules)) {
                    members['SharingCriteriaRule'] = [sharingRulesObj.sharingCriteriaRules.fullName];
                }
                else {
                    members['SharingCriteriaRule'] = sharingRulesObj.sharingCriteriaRules.map((sharingRule) => {
                        return sharingRule.fullName;
                    });
                }
            }
            if (!_.isNil(sharingRulesObj.sharingOwnerRules)) {
                if (!Array.isArray(sharingRulesObj.sharingOwnerRules)) {
                    members['SharingOwnerRule'] = [sharingRulesObj.sharingOwnerRules.fullName];
                }
                else {
                    members['SharingOwnerRule'] = sharingRulesObj.sharingOwnerRules.map((sharingRule) => {
                        return sharingRule.fullName;
                    });
                }
            }
            if (!_.isNil(sharingRulesObj.sharingTerritoryRules)) {
                if (!Array.isArray(sharingRulesObj.sharingTerritoryRules)) {
                    members['SharingTerritoryRule'] = [sharingRulesObj.sharingTerritoryRules.fullName];
                }
                else {
                    members['SharingTerritoryRule'] = sharingRulesObj.sharingTerritoryRules.map((sharingRule) => {
                        return sharingRule.fullName;
                    });
                }
            }
            if (!_.isNil(sharingRulesObj.sharingGuestRules)) {
                if (!Array.isArray(sharingRulesObj.sharingGuestRules)) {
                    members['SharingGuestRule'] = [sharingRulesObj.sharingGuestRules.fullName];
                }
                else {
                    members['SharingGuestRule'] = sharingRulesObj.sharingGuestRules.map((sharingRule) => {
                        return sharingRule.fullName;
                    });
                }
            }
        }
        return members;
    }
    static buildSharingRulesObj(sharingRuleObj1, sharingRulesObj2) {
        let newSharingRuleObj = {
            $: { xmlns: 'http://soap.sforce.com/2006/04/metadata' },
            sharingCriteriaRules: [],
            sharingOwnerRules: [],
            sharingTerritoryRules: [],
            sharingGuestRules: [],
        };
        sharingRuleObj1 = SharingRuleDiff.ensureArray(sharingRuleObj1);
        sharingRulesObj2 = SharingRuleDiff.ensureArray(sharingRulesObj2);
        let deletedSharingObj = {
            $: { xmlns: 'http://soap.sforce.com/2006/04/metadata' },
            sharingCriteriaRules: [],
            sharingOwnerRules: [],
            sharingTerritoryRules: [],
            sharingGuestRules: [],
        };
        let addedDeleted = diffUtil_1.default.getChangedOrAdded(sharingRuleObj1.sharingCriteriaRules, sharingRulesObj2.sharingCriteriaRules, 'fullName');
        newSharingRuleObj.sharingCriteriaRules = addedDeleted.addedEdited;
        deletedSharingObj.sharingCriteriaRules = addedDeleted.deleted;
        addedDeleted = diffUtil_1.default.getChangedOrAdded(sharingRuleObj1.sharingOwnerRules, sharingRulesObj2.sharingOwnerRules, 'fullName');
        newSharingRuleObj.sharingOwnerRules = addedDeleted.addedEdited;
        deletedSharingObj.sharingOwnerRules = addedDeleted.deleted;
        addedDeleted = diffUtil_1.default.getChangedOrAdded(sharingRuleObj1.sharingTerritoryRules, sharingRulesObj2.sharingTerritoryRules, 'fullName');
        newSharingRuleObj.sharingTerritoryRules = addedDeleted.addedEdited;
        deletedSharingObj.sharingTerritoryRules = addedDeleted.deleted;
        addedDeleted = diffUtil_1.default.getChangedOrAdded(sharingRuleObj1.sharingGuestRules, sharingRulesObj2.sharingGuestRules, 'fullName');
        newSharingRuleObj.sharingGuestRules = addedDeleted.addedEdited;
        deletedSharingObj.sharingGuestRules = addedDeleted.deleted;
        return {
            addedEdited: newSharingRuleObj,
            deleted: deletedSharingObj,
        };
    }
    static buildDestructiveChangesObj(deletedSharing, destructivePackageObj, objectName) {
        let sharingCriteriaRules = _.find(destructivePackageObj, function (metaType) {
            return metaType.name === 'SharingCriteriaRule';
        });
        if (sharingCriteriaRules === undefined &&
            deletedSharing.sharingCriteriaRules !== undefined &&
            deletedSharing.sharingCriteriaRules.length > 0) {
            sharingCriteriaRules = {
                name: 'SharingCriteriaRule',
                members: [],
            };
            destructivePackageObj.push(sharingCriteriaRules);
        }
        if (deletedSharing.sharingCriteriaRules !== undefined) {
            deletedSharing.sharingCriteriaRules.forEach((elem) => {
                sharingCriteriaRules.members.push(objectName + '.' + elem.fullName);
            });
        }
        let sharingOwnerRules = _.find(destructivePackageObj, function (metaType) {
            return metaType.name === 'SharingOwnerRule';
        });
        if (sharingOwnerRules === undefined &&
            deletedSharing.sharingOwnerRules !== undefined &&
            deletedSharing.sharingOwnerRules.length > 0) {
            sharingOwnerRules = {
                name: 'SharingOwnerRule',
                members: [],
            };
            destructivePackageObj.push(sharingOwnerRules);
        }
        if (deletedSharing.sharingOwnerRules !== undefined) {
            deletedSharing.sharingOwnerRules.forEach((elem) => {
                sharingOwnerRules.members.push(objectName + '.' + elem.fullName);
            });
        }
        let sharingTerritoryRules = _.find(destructivePackageObj, function (metaType) {
            return metaType.name === 'SharingTerritoryRule';
        });
        if (sharingTerritoryRules === undefined &&
            deletedSharing.sharingTerritoryRules !== undefined &&
            deletedSharing.sharingTerritoryRules.length > 0) {
            sharingTerritoryRules = {
                name: 'SharingTerritoryRule',
                members: [],
            };
            destructivePackageObj.push(sharingTerritoryRules);
        }
        if (deletedSharing.sharingTerritoryRules !== undefined) {
            deletedSharing.sharingTerritoryRules.forEach((elem) => {
                sharingTerritoryRules.members.push(objectName + '.' + elem.fullName);
            });
        }
        return destructivePackageObj;
    }
    static writeSharingRule(newSharingRulesObj, outputFilePath) {
        const builder = new xml2js.Builder({
            xmldec: { version: '1.0', encoding: 'UTF-8', standalone: null },
        });
        let sharingRulesObj = {
            SharingRules: newSharingRulesObj,
        };
        let xml = builder.buildObject(sharingRulesObj);
        fs.writeFileSync(outputFilePath, xml);
    }
}
exports.default = SharingRuleDiff;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmluZ1J1bGVEaWZmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2ltcGwvZGlmZi9zaGFyaW5nUnVsZURpZmYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDZDQUErQjtBQUMvQiwrQ0FBaUM7QUFDakMsTUFBTSxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzVCLDJDQUE2QjtBQUM3QiwwREFBa0M7QUFFbEMsTUFBTSxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQzdCLGFBQWEsRUFBRSxLQUFLO0lBQ3BCLGVBQWUsRUFBRTtRQUNiLFVBQVUsSUFBSTtZQUNWLElBQUksTUFBZSxDQUFDO1lBQ3BCLElBQUksSUFBSSxLQUFLLE1BQU07Z0JBQUUsTUFBTSxHQUFHLElBQUksQ0FBQztZQUNuQyxJQUFJLElBQUksS0FBSyxPQUFPO2dCQUFFLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDckMsT0FBTyxNQUFNLENBQUM7UUFDbEIsQ0FBQztLQUNKO0NBQ0osQ0FBQyxDQUFDO0FBRUgsTUFBcUIsZUFBZTtJQUN6QixNQUFNLENBQUMsS0FBSyxDQUFDLHVCQUF1QixDQUN2QyxlQUF1QixFQUN2QixlQUF1QixFQUN2QixjQUFzQixFQUN0QixVQUFrQixFQUNsQixxQkFBNEIsRUFDNUIsWUFBbUIsRUFDbkIsYUFBc0I7UUFFdEIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUE0RSxDQUFDO1FBQ2xJLElBQUksZ0JBQWdCLEdBQVEsRUFBRSxDQUFDO1FBQy9CLElBQUksZ0JBQWdCLEdBQVEsRUFBRSxDQUFDO1FBRS9CLElBQUksZUFBZSxLQUFLLEVBQUUsRUFBRSxDQUFDO1lBQ3pCLElBQUksV0FBVyxHQUFHLE1BQU0sV0FBVyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ3JELGdCQUFn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