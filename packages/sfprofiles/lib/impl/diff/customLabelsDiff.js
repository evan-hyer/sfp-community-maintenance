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
const diffUtil_1 = __importDefault(require("./diffUtil"));
const _ = require('lodash');
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
class CustomLabelsDiff {
    static async getMembers(filePath) {
        let fileContent = fs.readFileSync(filePath, 'utf8').toString();
        const parseString = util.promisify(parser.parseString);
        let members = [];
        if (fileContent !== '') {
            let parseResult = await parseString(fileContent);
            let customLabelsObj = parseResult.CustomLabels || {};
            if (!_.isNil(customLabelsObj.labels)) {
                if (!Array.isArray(customLabelsObj.labels)) {
                    members.push(customLabelsObj.labels.fullName);
                }
                else {
                    members = customLabelsObj.labels.map((label) => {
                        return label.fullName;
                    });
                }
            }
        }
        return members;
    }
    static async generateCustomLabelsXml(customLabelsXml1, customLabelsXml2, outputFilePath, destructivePackageObj, resultOutput, isDestructive) {
        let customLabelsObj1 = {};
        let customLabelsObj2 = {};
        const parseString = util.promisify(parser.parseString);
        if (customLabelsXml1 !== '') {
            let parseResult = await parseString(customLabelsXml1);
            customLabelsObj1 = parseResult.CustomLabels || {};
        }
        if (customLabelsXml2 !== '') {
            let parseResult = await parseString(customLabelsXml2);
            customLabelsObj2 = parseResult.CustomLabels || {};
        }
        // Building the new workflow object for the added and modified fields
        let addedEditedOrDeleted = CustomLabelsDiff.buildCustomLabelsObj(customLabelsObj1, customLabelsObj2);
        if (addedEditedOrDeleted.addedEdited.labels && addedEditedOrDeleted.addedEdited.labels.length > 0) {
            CustomLabelsDiff.writeCustomLabel(addedEditedOrDeleted.addedEdited, outputFilePath);
        }
        // Check for deletion
        destructivePackageObj = CustomLabelsDiff.buildDestructiveChanges(addedEditedOrDeleted.deleted, destructivePackageObj);
        CustomLabelsDiff.updateOutput(addedEditedOrDeleted.addedEdited, resultOutput, 'Deploy', outputFilePath);
        if (isDestructive) {
            CustomLabelsDiff.updateOutput(addedEditedOrDeleted.deleted, resultOutput, 'Delete', 'destructiveChanges.xml');
        }
        return destructivePackageObj;
    }
    static updateOutput(customLabelObj, resultOutput, action, filePath) {
        customLabelObj.labels.forEach((elem) => {
            resultOutput.push({
                action: action,
                metadataType: 'CustomLabel',
                componentName: elem.fullName,
                path: filePath,
            });
        });
    }
    static buildCustomLabelsObj(customLabelsObj1, customLabelsObj2) {
        let newcustomLabelsObj = {
            $: { xmlns: 'http://soap.sforce.com/2006/04/metadata' },
            labels: [],
        };
        if (!_.isNil(customLabelsObj1.labels) && !Array.isArray(customLabelsObj1.labels)) {
            customLabelsObj1.labels = [customLabelsObj1.labels];
        }
        if (!_.isNil(customLabelsObj2.labels) && !Array.isArray(customLabelsObj2.labels)) {
            customLabelsObj2.labels = [customLabelsObj2.labels];
        }
        let deletedCustomLabelsObj = {
            $: { xmlns: 'http://soap.sforce.com/2006/04/metadata' },
            labels: [],
        };
        let addedDeleted = diffUtil_1.default.getChangedOrAdded(customLabelsObj1.labels, customLabelsObj2.labels, 'fullName');
        newcustomLabelsObj.labels = addedDeleted.addedEdited;
        deletedCustomLabelsObj.labels = addedDeleted.deleted;
        return {
            addedEdited: newcustomLabelsObj,
            deleted: deletedCustomLabelsObj,
        };
    }
    static buildDestructiveChanges(deletedCustomLabels, destructivePackageObj) {
        let labelType = _.find(destructivePackageObj, function (metaType) {
            return metaType.name === 'CustomLabel';
        });
        if (labelType === undefined &&
            deletedCustomLabels.labels !== undefined &&
            deletedCustomLabels.labels.length > 0) {
            labelType = {
                name: 'CustomLabel',
                members: [],
            };
            destructivePackageObj.push(labelType);
        }
        if (deletedCustomLabels.labels !== undefined) {
            deletedCustomLabels.labels.forEach((elem) => {
                labelType.members.push(elem.fullName);
            });
        }
        return destructivePackageObj;
    }
    static writeCustomLabel(newCustomLabelsObj, outputFilePath) {
        const builder = new xml2js.Builder({
            xmldec: { version: '1.0', encoding: 'UTF-8', standalone: null },
        });
        let customLabelObj = {
            CustomLabels: newCustomLabelsObj,
        };
        let xml = builder.buildObject(customLabelObj);
        fs.writeFileSync(outputFilePath, xml);
    }
}
exports.default = CustomLabelsDiff;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tTGFiZWxzRGlmZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9pbXBsL2RpZmYvY3VzdG9tTGFiZWxzRGlmZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsNkNBQStCO0FBQy9CLCtDQUFpQztBQUNqQywyQ0FBNkI7QUFDN0IsMERBQWtDO0FBQ2xDLE1BQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUU1QixNQUFNLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDN0IsYUFBYSxFQUFFLEtBQUs7SUFDcEIsZUFBZSxFQUFFO1FBQ2IsVUFBVSxJQUFJO1lBQ1YsSUFBSSxNQUFlLENBQUM7WUFDcEIsSUFBSSxJQUFJLEtBQUssTUFBTTtnQkFBRSxNQUFNLEdBQUcsSUFBSSxDQUFDO1lBQ25DLElBQUksSUFBSSxLQUFLLE9BQU87Z0JBQUUsTUFBTSxHQUFHLEtBQUssQ0FBQztZQUNyQyxPQUFPLE1BQU0sQ0FBQztRQUNsQixDQUFDO0tBQ0o7Q0FDSixDQUFDLENBQUM7QUFFSCxNQUFxQixnQkFBZ0I7SUFDMUIsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsUUFBZ0I7UUFDM0MsSUFBSSxXQUFXLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDL0QsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUEwRCxDQUFDO1FBQ2hILElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNqQixJQUFJLFdBQVcsS0FBSyxFQUFFLEVBQUUsQ0FBQztZQUNyQixJQUFJLFdBQVcsR0FBRyxNQUFNLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNqRCxJQUFJLGVBQWUsR0FBRyxXQUFXLENBQUMsWUFBWSxJ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