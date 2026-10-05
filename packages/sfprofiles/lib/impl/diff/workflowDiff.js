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
class WorkflowDiff {
    static async generateWorkflowXml(workflowXml1, workflowXml2, outputFilePath, objectName, destructivePackageObj, resultOutput, isDestructive) {
        let workflowObj1 = {};
        let workflowObj2 = {};
        const parseString = util.promisify(parser.parseString);
        if (workflowXml1 !== '') {
            let parseResult = await parseString(workflowXml1);
            workflowObj1 = parseResult.Workflow || {};
        }
        if (workflowXml2 !== '') {
            let parseResult = await parseString(workflowXml2);
            workflowObj2 = parseResult.Workflow || {};
        }
        let addedEditedOrDeleted = WorkflowDiff.buildNewWorkflowObj(workflowObj1, workflowObj2);
        WorkflowDiff.writeWorkflow(addedEditedOrDeleted.addedEdited, outputFilePath);
        destructivePackageObj = WorkflowDiff.buildDestructiveChangesObj(addedEditedOrDeleted.deleted, destructivePackageObj, objectName);
        WorkflowDiff.updateOutput(addedEditedOrDeleted.addedEdited, resultOutput, objectName, 'Deploy', outputFilePath);
        if (isDestructive) {
            WorkflowDiff.updateOutput(addedEditedOrDeleted.deleted, resultOutput, objectName, 'Delete', 'destructiveChanges.xml');
        }
        return destructivePackageObj;
    }
    static updateOutput(workflowObj, resultOutput, objectName, action, filePath) {
        workflowObj.alerts.forEach((elem) => {
            resultOutput.push({
                action: action,
                metadataType: 'WorkflowAlert',
                componentName: `${objectName}.${elem.fullName}`,
                path: filePath,
            });
        });
        workflowObj.fieldUpdates.forEach((elem) => {
            resultOutput.push({
                action: action,
                metadataType: 'WorkflowFieldUpdate',
                componentName: `${objectName}.${elem.fullName}`,
                path: filePath,
            });
        });
        workflowObj.knowledgePublishes.forEach((elem) => {
            resultOutput.push({
                action: action,
                metadataType: 'WorkflowKnowledgePublish',
                componentName: `${objectName}.${elem.label}`,
                path: filePath,
            });
        });
        workflowObj.outboundMessages.forEach((elem) => {
            resultOutput.push({
                action: action,
                metadataType: 'WorkflowOutboundMessage',
                componentName: `${objectName}.${elem.fullName}`,
                path: filePath,
            });
        });
        workflowObj.rules.forEach((elem) => {
            resultOutput.push({
                action: action,
                metadataType: 'WorkflowRule',
                componentName: `${objectName}.${elem.fullName}`,
                path: filePath,
            });
        });
        workflowObj.tasks.forEach((elem) => {
            resultOutput.push({
                action: action,
                metadataType: 'WorkflowTask',
                componentName: `${objectName}.${elem.fullName}`,
                path: filePath,
            });
        });
    }
    static ensureArray(workflowObj) {
        let keys = Object.keys(workflowObj);
        keys.forEach((key) => {
            if (typeof workflowObj[key] === 'object' && !Array.isArray(workflowObj[key]) && key !== '$') {
                workflowObj[key] = [workflowObj[key]];
            }
        });
        return workflowObj;
    }
    static async getMembers(filePath) {
        let fileContent = fs.readFileSync(filePath, 'utf8').toString();
        const parseString = util.promisify(parser.parseString);
        let members = {};
        if (fileContent !== '') {
            let parseResult = await parseString(fileContent);
            let workFlowObj = parseResult.Workflow || {};
            if (!_.isNil(workFlowObj.alerts)) {
                if (!Array.isArray(workFlowObj.alerts)) {
                    members['WorkflowAlert'] = [workFlowObj.alerts.fullName];
                }
                else {
                    members['WorkflowAlert'] = workFlowObj.alerts.map((workFlowAlert) => {
                        return workFlowAlert.fullName;
                    });
                }
            }
            if (!_.isNil(workFlowObj.fieldUpdates)) {
                if (!Array.isArray(workFlowObj.fieldUpdates)) {
                    members['WorkflowFieldUpdate'] = [workFlowObj.fieldUpdates.fullName];
                }
                else {
                    members['WorkflowFieldUpdate'] = workFlowObj.fieldUpdates.map((workFlowFU) => {
                        return workFlowFU.fullName;
                    });
                }
            }
            if (!_.isNil(workFlowObj.knowledgePublishes)) {
                if (!Array.isArray(workFlowObj.knowledgePublishes)) {
                    members['WorkflowKnowledgePublish'] = [workFlowObj.knowledgePublishes.label];
                }
                else {
                    members['WorkflowKnowledgePublish'] = workFlowObj.knowledgePublishes.map((workflowKnowledgePublish) => {
                        return workflowKnowledgePublish.label;
                    });
                }
            }
            if (!_.isNil(workFlowObj.outboundMessages)) {
                if (!Array.isArray(workFlowObj.outboundMessages)) {
                    members['WorkflowOutboundMessage'] = [workFlowObj.outboundMessages.fullName];
                }
                else {
                    members['WorkflowOutboundMessage'] = workFlowObj.outboundMessages.map((workflowOutboundMessage) => {
                        return workflowOutboundMessage.fullName;
                    });
                }
            }
            if (!_.isNil(workFlowObj.rules)) {
                if (!Array.isArray(workFlowObj.rules)) {
                    members['WorkflowRule'] = [workFlowObj.rules.fullName];
                }
                else {
                    members['WorkflowRule'] = workFlowObj.rules.map((workflowRule) => {
                        return workflowRule.fullName;
                    });
                }
            }
            if (!_.isNil(workFlowObj.tasks)) {
                if (!Array.isArray(workFlowObj.tasks)) {
                    members['WorkflowTask'] = [workFlowObj.tasks.fullName];
                }
                else {
                    members['WorkflowTask'] = workFlowObj.tasks.map((workflowTask) => {
                        return workflowTask.fullName;
                    });
                }
            }
        }
        return members;
    }
    static buildNewWorkflowObj(workflowObj1, workflowObj2) {
        workflowObj1 = WorkflowDiff.ensureArray(workflowObj1);
        workflowObj2 = WorkflowDiff.ensureArray(workflowObj2);
        let newWorkflowObj = {
            $: { xmlns: 'http://soap.sforce.com/2006/04/metadata' },
            alerts: [],
            fieldUpdates: [],
            knowledgePublishes: [],
            outboundMessages: [],
            rules: [],
            tasks: [],
        };
        let deletedWorkflowObj = {
            $: { xmlns: 'http://soap.sforce.com/2006/04/metadata' },
            alerts: [],
            fieldUpdates: [],
            knowledgePublishes: [],
            outboundMessages: [],
            rules: [],
            tasks: [],
        };
        if (workflowObj1.fullName !== undefined || workflowObj2.fullName !== undefined) {
            newWorkflowObj.fullName = workflowObj2.fullName;
        }
        //Email alerts
        let addedDeleted = diffUtil_1.default.getChangedOrAdded(workflowObj1.alerts, workflowObj2.alerts, 'fullName');
        newWorkflowObj.alerts = addedDeleted.addedEdited;
        deletedWorkflowObj.alerts = addedDeleted.deleted;
        //Field Update
        addedDeleted = diffUtil_1.default.getChangedOrAdded(workflowObj1.fieldUpdates, workflowObj2.fieldUpdates, 'fullName');
        newWorkflowObj.fieldUpdates = addedDeleted.addedEdited;
        deletedWorkflowObj.fieldUpdates = addedDeleted.deleted;
        //Knowledge Publishes
        addedDeleted = diffUtil_1.default.getChangedOrAdded(workflowObj1.knowledgePublishes, workflowObj2.knowledgePublishes, 'label');
        newWorkflowObj.knowledgePublishes = addedDeleted.addedEdited;
        deletedWorkflowObj.knowledgePublishes = addedDeleted.deleted;
        //Outbound Messages
        addedDeleted = diffUtil_1.default.getChangedOrAdded(workflowObj1.outboundMessages, workflowObj2.outboundMessages, 'fullName');
        newWorkflowObj.outboundMessages = addedDeleted.addedEdited;
        deletedWorkflowObj.outboundMessages = addedDeleted.deleted;
        //Rules
        addedDeleted = diffUtil_1.default.getChangedOrAdded(workflowObj1.rules, workflowObj2.rules, 'fullName');
        newWorkflowObj.rules = addedDeleted.addedEdited;
        deletedWorkflowObj.rules = addedDeleted.deleted;
        //Task
        addedDeleted = diffUtil_1.default.getChangedOrAdded(workflowObj1.tasks, workflowObj2.tasks, 'fullName');
        newWorkflowObj.tasks = addedDeleted.addedEdited;
        deletedWorkflowObj.tasks = addedDeleted.deleted;
        return {
            addedEdited: newWorkflowObj,
            deleted: deletedWorkflowObj,
        };
    }
    static buildDestructiveChangesObj(deletedWorkflows, destructivePackageObj, objectName) {
        destructivePackageObj = WorkflowDiff.buildDestructiveType(destructivePackageObj, deletedWorkflows.alerts, 'WorkflowAlert', objectName);
        destructivePackageObj = WorkflowDiff.buildDestructiveType(destructivePackageObj, deletedWorkflows.fieldUpdates, 'WorkflowFieldUpdate', objectName);
        destructivePackageObj = WorkflowDiff.buildDestructiveType(destructivePackageObj, deletedWorkflows.knowledgePublishes, 'WorkflowKnowledgePublish', objectName);
        destructivePackageObj = WorkflowDiff.buildDestructiveType(destructivePackageObj, deletedWorkflows.outboundMessages, 'WorkflowOutboundMessage', objectName);
        destructivePackageObj = WorkflowDiff.buildDestructiveType(destructivePackageObj, deletedWorkflows.rules, 'WorkflowRule', objectName);
        destructivePackageObj = WorkflowDiff.buildDestructiveType(destructivePackageObj, deletedWorkflows.tasks, 'WorkflowTask', objectName);
        return destructivePackageObj;
    }
    static buildDestructiveType(destructivePackageObj, list, typeLabel, objectName) {
        let metaType = _.find(destructivePackageObj, function (metaType) {
            return metaType.name === typeLabel;
        });
        if (metaType === undefined && list !== undefined && list.length > 0) {
            metaType = {
                name: typeLabel,
                members: [],
            };
            destructivePackageObj.push(metaType);
        }
        if (list !== undefined) {
            list.forEach((elem) => {
                metaType.members.push(objectName + '.' + elem.fullName);
            });
        }
        return destructivePackageObj;
    }
    static writeWorkflow(newWorkflowObj, outputFilePath) {
        const builder = new xml2js.Builder({
            xmldec: { version: '1.0', encoding: 'UTF-8', standalone: null },
        });
        let workflowObj = {
            Workflow: newWorkflowObj,
        };
        let xml = builder.buildObject(workflowObj);
        fs.writeFileSync(outputFilePath, xml);
    }
}
exports.default = WorkflowDiff;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2Zsb3dEaWZmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2ltcGwvZGlmZi93b3JrZmxvd0RpZmYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDZDQUErQjtBQUMvQiwrQ0FBaUM7QUFDakMsMkNBQTZCO0FBQzdCLDBEQUFrQztBQUNsQyxNQUFNLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7QUFFNUIsTUFBTSxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQzdCLGFBQWEsRUFBRSxLQUFLO0lBQ3BCLGVBQWUsRUFBRTtRQUNiLFVBQVUsSUFBSTtZQUNWLElBQUksTUFBZSxDQUFDO1lBQ3BCLElBQUksSUFBSSxLQUFLLE1BQU07Z0JBQUUsTUFBTSxHQUFHLElBQUksQ0FBQztZQUNuQyxJQUFJLElBQUksS0FBSyxPQUFPO2dCQUFFLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDckMsT0FBTyxNQUFNLENBQUM7UUFDbEIsQ0FBQztLQUNKO0NBQ0osQ0FBQyxDQUFDO0FBRUgsTUFBcUIsWUFBWTtJQUN0QixNQUFNLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUNuQyxZQUFvQixFQUNwQixZQUFvQixFQUNwQixjQUFzQixFQUN0QixVQUFrQixFQUNsQixxQkFBNEIsRUFDNUIsWUFBbUIsRUFDbkIsYUFBc0I7UUFFdEIsSUFBSSxZQUFZLEdBQVEsRUFBRSxDQUFDO1FBQzNCLElBQUksWUFBWSxHQUFRLEVBQUUsQ0FBQztRQUUzQixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQTBELENBQUM7UUFFaEgsSUFBSSxZQUFZLEtBQUssRUFBRSxFQUFFLENBQUM7WUFDdEIsSUFBSSxXQUFXLEdBQUcsTUFBTSxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDbEQsWUFBWSxHQUFHLFdBQVcs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