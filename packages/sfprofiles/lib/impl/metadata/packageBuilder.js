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
exports.BuildConfig = exports.Packagexml = void 0;
const xml2js = __importStar(require("xml2js"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const fileutils_1 = __importDefault(require("../../utils/fileutils"));
const sfp_logger_1 = __importStar(require("@flxbl-io/sfp-logger"));
if (Symbol['asyncIterator'] === undefined) {
    // tslint:disable-next-line:no-any
    Symbol['asyncIterator'] = Symbol.for('asyncIterator');
}
const STANDARD_VALUE_SETS = [
    'AccountContactMultiRoles',
    'AccountContactRole',
    'AccountOwnership',
    'AccountRating',
    'AccountType',
    'AddressCountryCode',
    'AddressStateCode',
    'AssetStatus',
    'CampaignMemberStatus',
    'CampaignStatus',
    'CampaignType',
    'CaseContactRole',
    'CaseOrigin',
    'CasePriority',
    'CaseReason',
    'CaseStatus',
    'CaseType',
    'ContactRole',
    'ContractContactRole',
    'ContractStatus',
    'EntitlementType',
    'EventSubject',
    'EventType',
    'FiscalYearPeriodName',
    'FiscalYearPeriodPrefix',
    'FiscalYearQuarterName',
    'FiscalYearQuarterPrefix',
    'IdeaCategory',
    'IdeaMultiCategory',
    'IdeaStatus',
    'IdeaThemeStatus',
    'Industry',
    'InvoiceStatus',
    'LeadSource',
    'LeadStatus',
    'OpportunityCompetitor',
    'OpportunityStage',
    'OpportunityType',
    'OrderStatus',
    'OrderType',
    'PartnerRole',
    'Product2Family',
    'QuestionOrigin',
    'QuickTextCategory',
    'QuickTextChannel',
    'QuoteStatus',
    'SalesTeamRole',
    'Salutation',
    'ServiceContractApprovalStatus',
    'SocialPostClassification',
    'SocialPostEngagementLevel',
    'SocialPostReviewedStatus',
    'SolutionStatus',
    'TaskPriority',
    'TaskStatus',
    'TaskSubject',
    'TaskType',
    'WorkOrderLineItemStatus',
    'WorkOrderPriority',
    'WorkOrderStatus',
];
/**
 * This code was adapted from github:sfdx-jayree-plugin project which was
 * based on the original github:sfdx-hydrate project
 */
class Packagexml {
    constructor(conn, configs) {
        this.packageTypes = {};
        this.conn = conn;
        this.configs = configs;
        this.result = [];
    }
    async build() {
        if (this.configs.excludeFilters.length > 0 && this.configs.includeFilters.length > 0) {
            let conflict = this.configs.excludeFilters.filter((element) => this.configs.includeFilters.includes(element));
            if (conflict.length > 0) {
                throw new Error(`Unable to process the request, found ${conflict} in both include and exlude list`);
            }
        }
        try {
            await this.buildInstalledPackageRegex();
            await this.describeMetadata();
            this.setStandardValueset();
            let packageXml = this.generateXml();
            let dir = path.parse(this.configs.outputFile).dir;
            if (!fs.existsSync(dir)) {
                fileutils_1.default.mkDirByPathSync(dir);
            }
            fs.writeFileSync(this.configs.outputFile, packageXml);
            sfp_logger_1.default.log(`Mainfest ${this.configs.outputFile} is created successfully `, sfp_logger_1.LoggerLevel.INFO);
            return packageXml;
        }
        catch (err) {
            sfp_logger_1.default.log(err, sfp_logger_1.LoggerLevel.ERROR);
        }
    }
    setStandardValueset() {
        if ((this.configs.excludeFilters.length === 0 || !this.configs.excludeFilters.includes('StandardValueSet')) &&
            (this.configs.includeFilters.length === 0 || this.configs.includeFilters.includes('StandardValueSet'))) {
            if (!this.packageTypes['StandardValueSet']) {
                this.packageTypes['StandardValueSet'] = [];
            }
            STANDARD_VALUE_SETS.forEach((member) => {
                this.packageTypes['StandardValueSet'].push(member);
                this.result.push({
                    type: 'StandardValueSet',
                    fullName: member,
                });
            });
        }
    }
    async buildInstalledPackageRegex() {
        // fetch and execute installed package promise to build regex
        let ipRegexStr = '^(';
        let instPack = await this.conn.metadata.list({
            type: 'InstalledPackage',
        }, this.configs.apiVersion);
        try {
            instPack.forEach((pkg) => {
                ipRegexStr += pkg.namespacePrefix + '|';
            });
            ipRegexStr += ')+__';
            this.ipRegex = RegExp(ipRegexStr);
        }
        catch (err) {
            this.ipRegex = RegExp('');
        }
    }
    async describeMetadata() {
        const describe = await this.conn.metadata.describe(this.configs.apiVersion);
        for (const object of describe.metadataObjects) {
            if (this.configs.excludeFilters.length > 0 && this.configs.excludeFilters.includes(object.xmlName)) {
                continue;
            }
            else if (this.configs.includeFilters.length > 0 && !this.isAvailableinIncludeList(object.xmlName)) {
                continue;
            }
            if (object.inFolder) {
                await this.handleFolderObject(object);
            }
            else {
                await this.handleNonFolderObject(object);
            }
        }
    }
    async handleFolderObject(object) {
        const folderType = object.xmlName.replace('Template', '');
        let folderdescribeRes = await this.conn.metadata.list({
            type: `${folderType}Folder`,
        }, this.configs.apiVersion);
        try {
            //Handle Folder
            let folderDescribeItems = this.convertToArray(folderdescribeRes);
            folderDescribeItems.forEach(async (FolderMetadataEntries) => {
                this.addMember(FolderMetadataEntries.type, FolderMetadataEntries);
                //Handle Folder Item
                let folderItemsRes = await this.conn.metadata.list({
                    type: object.xmlName,
                    folder: FolderMetadataEntries.fullName,
                }, this.configs.apiVersion);
                try {
                    //Handle Folder
                    let folderItems = this.convertToArray(folderItemsRes);
                    folderItems.forEach((FolderItemMetadataEntries) => {
                        this.addMember(FolderItemMetadataEntries.type, FolderItemMetadataEntries);
                    });
                }
                catch (err) {
                    sfp_logger_1.default.log(`Error in processing Type ${object.xmlName} ${err}`, sfp_logger_1.LoggerLevel.ERROR);
                }
            });
        }
        catch (err) {
            sfp_logger_1.default.log(`Error in processing Type ${folderType} ${err}`, sfp_logger_1.LoggerLevel.ERROR);
        }
    }
    async handleNonFolderObject(object) {
        let unfolderItemsRes = await this.conn.metadata.list({
            type: object.xmlName,
        }, this.configs.apiVersion);
        try {
            //Handle Parent
            let unfolderItems = this.convertToArray(unfolderItemsRes);
            let filterunfolderItems = this.filterItems(unfolderItems);
            filterunfolderItems.forEach((metadataEntries) => {
                this.addMember(metadataEntries.type, metadataEntries);
            });
            //Handle Child
            if (object.childXmlNames && object.childXmlNames.length > 0 && this.configs.includeChilds) {
                for (let child of object.childXmlNames) {
                    if (child === 'ManagedTopic') {
                        continue;
                    }
                    let unfolderChildItemsRes = await this.conn.metadata.list({
                        type: child,
                    }, this.configs.apiVersion);
                    try {
                        let unfolderChilItems = this.convertToArray(unfolderChildItemsRes);
                        let filterunfolderChildItems = this.filterChildItems(unfolderChilItems, object.xmlName);
                        filterunfolderChildItems.forEach((metadataEntries) => {
                            this.addMember(metadataEntries.type, metadataEntries);
                        });
                    }
                    catch (err) {
                        sfp_logger_1.default.log(`Error in processing Type ${child} ${err}`, sfp_logger_1.LoggerLevel.ERROR);
                    }
                }
            }
        }
        catch (err) {
            sfp_logger_1.default.log(`Error in processing Type ${object.xmlName} ${err}`, sfp_logger_1.LoggerLevel.ERROR);
        }
    }
    isAvailableinIncludeList(type, member = '') {
        let found = false;
        for (let includeFilter of this.configs.includeFilters) {
            if (!includeFilter.includes(':') && includeFilter === type) {
                found = true;
                break;
            }
            else if (includeFilter.includes(':') &&
                includeFilter.split(':')[0] === type &&
                (member === '' || includeFilter.split(':')[1] === member)) {
                found = true;
                break;
            }
        }
        return found;
    }
    convertToArray(item) {
        if (!item) {
            return [];
        }
        else if (Array.isArray(item)) {
            return item;
        }
        else {
            return [item];
        }
    }
    filterItems(itemsArray) {
        return itemsArray.filter((element) => (this.configs.excludeFilters.length === 0 ||
            !this.configs.excludeFilters.includes(element.type + ':' + element.fullName)) &&
            (this.configs.includeFilters.length === 0 ||
                this.isAvailableinIncludeList(element.type, element.fullName)));
    }
    filterChildItems(itemsArray, parentType) {
        return itemsArray.filter((element) => ((this.configs.excludeFilters.length === 0 ||
            !this.configs.excludeFilters.includes(element.type + ':' + element.fullName)) &&
            (this.configs.includeFilters.length === 0 ||
                this.isAvailableinIncludeList(element.type, element.fullName))) ||
            this.isAvailableinIncludeList(parentType, this.getParentName(element.fullName)));
    }
    getParentName(fullName) {
        return fullName.includes('.') ? fullName.split('.')[0] : '';
    }
    generateXml() {
        const packageJson = {
            $: { xmlns: 'http://soap.sforce.com/2006/04/metadata' },
            types: [],
            version: this.configs.apiVersion,
        };
        let mdtypes = Object.keys(this.packageTypes);
        mdtypes.sort();
        mdtypes.forEach((mdtype) => {
            packageJson.types.push({
                name: mdtype,
                members: this.packageTypes[mdtype].sort(),
            });
        });
        const builder = new xml2js.Builder({
            xmldec: { version: '1.0', encoding: 'utf-8' },
        });
        let packageObj = {
            Package: packageJson,
        };
        let packageXml = builder.buildObject(packageObj);
        return packageXml;
    }
    addMember(type, member) {
        /**
         * Managed package - fullName starts with 'namespacePrefix__' || namespacePrefix is not null || manageableState = installed
         * Unmanaged package - manageableState = unmanaged
         * Regular custom objects - manageableState = unmanaged or undefined
         */
        if (type && !this.isManagePackageIgnored(member)) {
            try {
                //Handle Object Translation
                if (member.fileName.includes('ValueSetTranslation')) {
                    const x = member.fileName.split('.')[1].substring(0, 1).toUpperCase() +
                        member.fileName.split('.')[1].substring(1);
                    if (!this.packageTypes[x]) {
                        this.packageTypes[x] = [];
                    }
                    this.packageTypes[x].push(member.fullName);
                    this.result.push(member);
                }
                else {
                    if (!this.packageTypes[type]) {
                        this.packageTypes[type] = [];
                    }
                    //Handle Layout
                    if (member.type === 'Layout' && member.namespacePrefix && member.manageableState === 'installed') {
                        const { fullName, namespacePrefix } = member;
                        let objectName = fullName.substr(0, fullName.indexOf('-'));
                        let layoutName = fullName.substr(fullName.indexOf('-') + 1);
                        this.packageTypes[type].push(objectName + '-' + namespacePrefix + '__' + layoutName);
                        this.result.push(member);
                    }
                    else {
                        this.packageTypes[type].push(member.fullName);
                        this.result.push(member);
                    }
                }
            }
            catch (ex) {
                sfp_logger_1.default.log(`Error in adding Type ${type} ${ex.message}`, sfp_logger_1.LoggerLevel.ERROR);
            }
        }
    }
    isManagePackageIgnored(member) {
        return (this.configs.excludeManaged &&
            (this.ipRegex.test(member.fullName) || member.namespacePrefix || member.manageableState === 'installed'));
    }
}
exports.Packagexml = Packagexml;
class BuildConfig {
    constructor(flags, apiVersion) {
        // flags always take precendence over configs from file
        this.excludeManaged = flags['excludemanaged'];
        this.includeChilds = flags['includechilds'];
        this.apiVersion = flags['apiversion'] || apiVersion;
        this.excludeFilters = flags['excludefilter']
            ? flags['excludefilter'].split(',').map((elem) => {
                return elem.trim();
            })
            : [];
        if (flags['quickfilter']) {
            flags['quickfilter'].split(',').map((elem) => {
                if (!this.excludeFilters.includes(elem.trim())) {
                    this.excludeFilters.push(elem.trim());
                }
            });
        }
        this.includeFilters = flags['includefilter']
            ? flags['includefilter'].split(',').map((elem) => {
                return elem.trim();
            })
            : [];
        this.outputFile = flags['outputfile'] || 'package.xml';
    }
}
exports.BuildConfig = BuildConfig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFja2FnZUJ1aWxkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvaW1wbC9tZXRhZGF0YS9wYWNrYWdlQnVpbGRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLCtDQUFpQztBQUNqQyw2Q0FBK0I7QUFDL0IsMkNBQTZCO0FBQzdCLGdFQUF3QztBQUN4QyxtRUFBNkQ7QUFLN0QsSUFBSSxNQUFNLENBQUMsZUFBZSxDQUFDLEtBQUssU0FBUyxFQUFFLENBQUM7SUFDeEMsa0NBQWtDO0lBQ2pDLE1BQWMsQ0FBQyxlQUFlLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBQ25FLENBQUM7QUFFRCxNQUFNLG1CQUFtQixHQUFHO0lBQ3hCLDBCQUEwQjtJQUMxQixvQkFBb0I7SUFDcEIsa0JBQWtCO0lBQ2xCLGVBQWU7SUFDZixhQUFhO0lBQ2Isb0JBQW9CO0lBQ3BCLGtCQUFrQjtJQUNsQixhQUFhO0lBQ2Isc0JBQXNCO0lBQ3RCLGdCQUFnQjtJQUNoQixjQUFjO0lBQ2QsaUJBQWlCO0lBQ2pCLFlBQVk7SUFDWixjQUFjO0lBQ2QsWUFBWTtJQUNaLFlBQVk7SUFDWixVQUFVO0lBQ1YsYUFBYTtJQUNiLHFCQUFxQjtJQUNyQixnQkFBZ0I7SUFDaEIsaUJBQWlCO0lBQ2pCLGNBQWM7SUFDZCxXQUFXO0lBQ1gsc0JBQXNCO0lBQ3RCLHdCQUF3QjtJQUN4Qix1QkFBdUI7SUFDdkIseUJBQXlCO0lBQ3pCLGNBQWM7SUFDZCxtQkFBbUI7SUFDbkIsWUFBWTtJQUNaLGlCQUFpQjtJQUNqQixVQUFVO0lBQ1YsZUFBZTtJQUNmLFlBQVk7SUFDWixZQUFZO0lBQ1osdUJBQXVCO0lBQ3ZCLGtCQUFrQjtJQUNsQixpQkFBaUI7SUFDakIsYUFBYTtJQUNiLFdBQVc7SUFDWCxhQUFhO0lBQ2IsZ0JBQWdCO0lBQ2hCLGdCQUFnQjtJQUNoQixtQkFB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