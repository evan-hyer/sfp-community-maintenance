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
const sfpowerkit_1 = require("../../../utils/sfpowerkit");
const _ = __importStar(require("lodash"));
const queryExecutor_1 = __importDefault(require("../../../utils/queryExecutor"));
const metadataOperation_1 = __importDefault(require("../../../utils/metadataOperation"));
const source_deploy_retrieve_1 = require("@salesforce/source-deploy-retrieve");
const sfp_logger_1 = __importStar(require("@flxbl-io/sfp-logger"));
class MetadataRetriever {
    constructor(conn, componentType) {
        this._conn = conn;
        this._componentType = componentType;
    }
    get componentType() {
        return this._componentType;
    }
    async getComponents(parent) {
        let key = parent ? this._componentType + '_' + parent : this._componentType;
        if (!this._conn) {
            return [];
        }
        if (!sfpowerkit_1.Sfpowerkit.getFromCache(key)) {
            let items;
            if (this._componentType === 'UserLicense') {
                items = await this.getUserLicense();
            }
            else if (this._componentType === source_deploy_retrieve_1.registry.types.customobject.name) {
                items = await this.getCustomObjects();
            }
            else if (this._componentType === 'ObjectPermissions') {
                items = await this.getObjectPermissions();
            }
            else if (this._componentType === source_deploy_retrieve_1.registry.types.customobject.children.types.customfield.name) {
                items = await this.getFieldsByObjectName(parent);
            }
            else if (this._componentType === 'UserPermissions') {
                items = await this.getUserPermissions();
            }
            else if (this._componentType === source_deploy_retrieve_1.registry.types.layout.name) {
                items = await this.getLayouts();
            }
            else if (this._componentType === source_deploy_retrieve_1.registry.types.customtab.name) {
                items = await this.getTabs();
            }
            else if (this._componentType === source_deploy_retrieve_1.registry.types.customobject.children.types.recordtype.name) {
                items = await this.getRecordTypes();
            }
            else {
                items = await new metadataOperation_1.default(this._conn).getComponentsFromOrgUsingListMetadata(this._componentType);
            }
            //Set Full..
            sfpowerkit_1.Sfpowerkit.addToCache(key, items);
            for (const item of items) {
                sfpowerkit_1.Sfpowerkit.addToCache(`${this.componentType}_${item.fullName}`, true);
            }
        }
        return sfpowerkit_1.Sfpowerkit.getFromCache(key);
    }
    async getUserLicense() {
        let query = `Select Id, Name, LicenseDefinitionKey From UserLicense`;
        let queryUtil = new queryExecutor_1.default(this._conn);
        let items = await queryUtil.executeQuery(query, false);
        if (items === undefined || items === null) {
            items = [];
        }
        return items.map((lic) => {
            lic.fullName = lic.Name;
            return lic;
        });
    }
    async getTabs() {
        let query = `SELECT Id,  Name, SobjectName, DurableId, IsCustom, Label FROM TabDefinition`;
        let queryUtil = new queryExecutor_1.default(this._conn);
        let items = await queryUtil.executeQuery(query, false);
        if (items === undefined || items === null) {
            items = [];
        }
        items.map((tab) => {
            tab.fullName = tab.Name;
            return tab;
        });
        let listMetadataItems = await new metadataOperation_1.default(this._conn).getComponentsFromOrgUsingListMetadata(this._componentType);
        if (listMetadataItems.length > 0) {
            items = items.concat(listMetadataItems);
        }
        return items;
    }
    async isComponentExistsInTheOrg(item, parent) {
        let items = await this.getComponents(parent);
        //Do a cache hit before deep interospection
        let foundItem = item ? sfpowerkit_1.Sfpowerkit.getFromCache(`${this.componentType}_${item}`) : null;
        if (_.isNil(foundItem) && !_.isNil(items) && Array.isArray(items)) {
            foundItem = items.find((p) => {
                return (p === null || p === void 0 ? void 0 : p.fullName) === item;
            });
            foundItem = !_.isNil(foundItem);
        }
        return foundItem;
    }
    async isComponentExistsInProjectDirectory(item) {
        let found = false;
        if (!_.isNil(sfpowerkit_1.Sfpowerkit.getFromCache(`SOURCE_${this.componentType}_${item}`))) {
            found = true;
        }
        return found;
    }
    async isComponentExistsInProjectDirectoryOrInOrg(item, parent) {
        let found = false;
        //First check in directory
        found = await this.isComponentExistsInProjectDirectory(item);
        if (found === false) {
            found = await this.isComponentExistsInTheOrg(item, parent);
            sfp_logger_1.default.log(`Found in Org? ${item} ${found}`, sfp_logger_1.LoggerLevel.TRACE);
        }
        return found;
    }
    async getCustomObjects() {
        let results = await this._conn.describeGlobal();
        let entities = results.sobjects.map((sObject) => {
            return {
                QualifiedApiName: sObject.name,
                fullName: sObject.name,
            };
        });
        return entities;
    }
    async getUserPermissions() {
        let describeResult = await this._conn.sobject('PermissionSet').describe();
        let supportedPermissions = [];
        describeResult.fields.forEach((field) => {
            let fieldName = field['name'];
            if (fieldName.startsWith('Permissions')) {
                supportedPermissions.push({
                    fullName: fieldName.replace('Permissions', '').trim(),
                });
            }
        });
        return supportedPermissions;
    }
    async getObjectPermissions() {
        let objectForPermission = [];
        let res = await this._conn.query('SELECT SobjectType, count(Id) From ObjectPermissions Group By sObjectType');
        if (res !== undefined) {
            objectForPermission = res.records.map((elem) => {
                return { fullName: elem['SobjectType'] };
            });
        }
        if (!objectForPermission.includes('PersonAccount')) {
            objectForPermission.push({ fullName: 'PersonAccount' });
        }
        return objectForPermission;
    }
    async getFieldsByObjectName(objectName) {
        let fields = [];
        try {
            sfp_logger_1.default.log(`Fetching Field of Object ${objectName}`, sfp_logger_1.LoggerLevel.TRACE);
            let query = `SELECT Id, QualifiedApiName, EntityDefinitionId, DeveloperName, NameSpacePrefix FROM FieldDefinition WHERE EntityDefinition.QualifiedApiName='${objectName}'`;
            let queryUtil = new queryExecutor_1.default(this._conn);
            fields = await queryUtil.executeQuery(query, true);
            fields = fields.map((field) => {
                return { fullName: `${objectName}.${field.QualifiedApiName}` };
            });
        }
        catch (error) {
            sfp_logger_1.default.log(`Object not found ${objectName}..skipping`, sfp_logger_1.LoggerLevel.TRACE);
        }
        return fields;
    }
    async getRecordTypes() {
        let recordTypes = [];
        try {
            sfp_logger_1.default.log(`Fetching RecordTypes`, sfp_logger_1.LoggerLevel.TRACE);
            let queryUtil = new queryExecutor_1.default(this._conn);
            let isPersonAccountFieldDefinitionQuery = `SELECT QualifiedApiName FROM FieldDefinition WHERE EntityDefinition.QualifiedApiName='Account' AND QualifiedApiName='IsPersonAccount'`;
            let isPersonAccountFieldDefinitionRecords = await queryUtil.executeQuery(isPersonAccountFieldDefinitionQuery, true);
            let recordTypeQuery;
            if (isPersonAccountFieldDefinitionRecords.length > 0)
                recordTypeQuery = `SELECT Name, DeveloperName, SobjectType, NameSpacePrefix, IsPersonType FROM RecordType`;
            else
                recordTypeQuery = `SELECT Name, DeveloperName, SobjectType, NameSpacePrefix FROM RecordType`;
            recordTypes = await queryUtil.executeQuery(recordTypeQuery, false);
            recordTypes = recordTypes.map((recordType) => {
                let namespace = '';
                if (recordType.NamespacePrefix !== undefined &&
                    recordType.NamespacePrefix !== '' &&
                    recordType.NamespacePrefix !== null &&
                    recordType.NamespacePrefix !== 'null') {
                    namespace = recordType.NamespacePrefix + '__';
                }
                let rtObj = {
                    fullName: `${recordType.SobjectType}.${namespace}${recordType.DeveloperName}`,
                };
                if (recordType.IsPersonType) {
                    rtObj = {
                        fullName: `PersonAccount.${namespace}${recordType.DeveloperName}`,
                    };
                }
                return rtObj;
            });
        }
        catch (error) {
            sfp_logger_1.default.log(`Error fetching record types...`, sfp_logger_1.LoggerLevel.DEBUG);
            sfp_logger_1.default.log(error.message, sfp_logger_1.LoggerLevel.DEBUG);
        }
        return recordTypes;
    }
    async getLayouts() {
        sfp_logger_1.default.log(`Fetching Layouts`, sfp_logger_1.LoggerLevel.TRACE);
        let apiversion = await sfpowerkit_1.Sfpowerkit.getApiVersion();
        let layouts = await this._conn.metadata.list({
            type: source_deploy_retrieve_1.registry.types.layout.name,
        }, apiversion);
        if (layouts != undefined && layouts.length > 0) {
            for (let i = 0; i < layouts.length; i++) {
                if (layouts[i].namespacePrefix !== undefined &&
                    layouts[i].namespacePrefix !== '' &&
                    layouts[i].namespacePrefix !== null &&
                    layouts[i].namespacePrefix !== 'null') {
                    //apend namespacePrefix in layout
                    layouts[i].fullName = layouts[i].fullName.replace('-', `-${layouts[i].namespacePrefix}__`);
                }
            }
        }
        else {
            layouts = [];
        }
        return layouts;
    }
}
exports.default = MetadataRetriever;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YWRhdGFSZXRyaWV2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvaW1wbC9tZXRhZGF0YS9yZXRyaWV2ZXIvbWV0YWRhdGFSZXRyaWV2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGtEQUErQztBQUMvQywwQ0FBNEI7QUFFNUIseUVBQWlEO0FBQ2pELGlGQUF5RDtBQUN6RCwrRUFBOEQ7QUFDOUQsbUVBQTZEO0FBRTdELE1BQXFCLGlCQUFpQjtJQUlsQyxZQUFtQixJQUFnQixFQUFFLGFBQXFCO1FBQ3RELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxjQUFjLEdBQUcsYUFBYSxDQUFDO0lBQ3hDLENBQUM7SUFFRCxJQUFXLGFBQWE7UUFDcEIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDO0lBQy9CLENBQUM7SUFFTSxLQUFLLENBQUMsYUFBYSxDQUFDLE1BQWU7UUFDdEMsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxHQUFHLEdBQUcsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUM7UUFFNUUsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNkLE9BQU8sRUFBRSxDQUFDO1FBQ2QsQ0FBQztRQUVELElBQUksQ0FBQyx1QkFBVSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ2hDLElBQUksS0FBSyxDQUFDO1lBQ1YsSUFBSSxJQUFJLENBQUMsY0FBYyxLQUFLLGFBQWEsRUFBRSxDQUFDO2dCQUN4QyxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDeEMsQ0FBQztpQkFBTSxJQUFJLElBQUksQ0FBQyxjQUFjLEtBQUssaUNBQVEsQ0FBQyxLQUFLLENBQUMsWUFBWSxD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