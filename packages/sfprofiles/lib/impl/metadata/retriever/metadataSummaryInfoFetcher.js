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
/* eslint-disable @typescript-eslint/no-unused-vars */
const getDefaults_1 = __importDefault(require("../../../utils/getDefaults"));
const sfp_logger_1 = __importStar(require("@flxbl-io/sfp-logger"));
const chunkArray_1 = require("../../../utils/chunkArray");
// import { ProgressBar } from '../../../ui/progressBar';
const getDefaults_2 = __importDefault(require("../../../utils/getDefaults"));
const util_1 = require("util");
const retry = require('async-retry');
class MetadataSummaryInfoFetcher {
    static async fetchMetadataSummaryFromAnOrg(conn, isDisplayProgressBar = false, filterTypes = MetadataSummaryInfoFetcher.NotSupportedTypes) {
        let metadataMap = new Map();
        let types = [];
        let result = await conn.metadata.describe(getDefaults_1.default.getApiVersion());
        result.metadataObjects.forEach((metadata) => {
            //Not supported .. ignore
            if (!this.NotSupportedTypes.includes(metadata.xmlName)) {
                types.push({ type: metadata.xmlName });
            }
            //Has childs.. check for each child and add to the list
            if (metadata.childXmlNames) {
                for (let childMetadata of metadata.childXmlNames) {
                    if (!this.NotSupportedTypes.includes(childMetadata)) {
                        types.push({ type: childMetadata });
                    }
                }
            }
        });
        sfp_logger_1.default.log(`Fetching ${types.length} Metadata Types From the Org `, sfp_logger_1.LoggerLevel.INFO);
        //Fetch Summary Info in chunks of three
        for (let typesInChunk of (0, chunkArray_1.chunkArray)(3, types)) {
            try {
                metadataMap = await this.fetchMetadataSummaryByTypesFromAnOrg(conn, typesInChunk, metadataMap);
                // progressBar.increment(typesInChunk.length);
                sfp_logger_1.default.log(`Retrieved ${metadataMap.size} of ${types.length}`, sfp_logger_1.LoggerLevel.INFO);
            }
            catch (error) {
                // TODO: Check message for typo
                if (error.message == 'Undefinded Metadata Type') {
                    sfp_logger_1.default.log(`Unknown Types ${JSON.stringify(typesInChunk)} Encountered while retrieving types from the org, Please raise an issue!`, sfp_logger_1.LoggerLevel.WARN);
                }
                else {
                    throw new Error(error);
                }
            }
        }
        sfp_logger_1.default.log(`Successfully retrieved ${metadataMap.size} Metadata Types. `);
        return metadataMap;
    }
    static async fetchMetadataSummaryByTypesFromAnOrg(conn, types, metadataMap) {
        return await retry(async (bail) => {
            let results = await conn.metadata.list(types, getDefaults_2.default.getApiVersion());
            if (!(0, util_1.isArray)(results)) {
                throw new Error('Undefinded Metadata Type');
            }
            // if (results.length > 0)
            for (let result of results) {
                metadataMap.set(result.id, {
                    id: result.id,
                    fullName: result.fullName,
                    type: result.type,
                });
            }
            return metadataMap;
        }, { retries: 3, minTimeout: 2000 });
    }
}
MetadataSummaryInfoFetcher.NotSupportedTypes = [
    'AccountForecastSettings',
    'Icon',
    'GlobalValueSet',
    'StandardValueSet',
    'CustomPermission',
    'EscalationRules',
    'RecordActionDeployment',
    'EscalationRule',
    'ApprovalProcess',
    'SiteDotCom',
    'BrandingSet',
    'NetworkBranding',
    'AuthProvider',
    'ContentAsset',
    'CustomSite',
    'EmbeddedServiceConfig',
    'UIObjectRelationConfig',
    'CareProviderSearchConfig',
    'EmbeddedServiceBranding',
    'EmbeddedServiceFlowConfig',
    'EmbeddedServiceMenuSettings',
    'SalesAgreementSettings',
    'ActionLinkGroupTemplate',
    'TransactionSecurityPolicy',
    'SynonymDictionary',
    'RecommendationStrategy',
    'UserCriteria',
    'ModerationRule',
    'CMSConnectSource',
    'FlowCategory',
    'Settings',
    'PlatformCachePartition',
    'LightningBolt',
    'LightningExperienceTheme',
    'LightningOnboardingConfig',
    'CorsWhitelistOrigin',
    'CustomHelpMenuSection',
    'Prompt',
    'Report',
    'Dashboard',
    'AnalyticSnapshot',
    'Role',
    'Group',
    'Community',
    'ChatterExtension',
    'PlatformEventChannel',
    'CommunityThemeDefinition',
    'CommunityTemplateDefinition',
    'NavigationMenu',
    'ManagedTopics',
    'ManagedTopic',
    'KeywordList',
    'InstalledPackage',
    'Scontrol',
    'Certificate',
    'LightningMessageChannel',
    'CaseSubjectParticle',
    'ExternalDataSource',
    'ExternalServiceRegistration',
    'Index',
    'CustomFeedFilter',
    'PostTemplate',
    'ProfilePasswordPolicy',
    'ProfileSessionSetting',
    'MyDomainDiscoverableLogin',
    'OauthCustomScope',
    'LeadConvertSettings',
    'DataCategoryGroup',
    'RemoteSiteSetting',
    'CspTrustedSite',
    'RedirectWhitelistUrl',
    'CleanDataService',
    'Skill',
    'ServiceChannel',
    'QueueRoutingConfig',
    'ServicePresenceStatus',
    'PresenceDeclineReason',
    'PresenceUserConfig',
    'EclairGeoData',
    'ChannelLayout',
    'CallCenter',
    'TimeSheetTemplate',
    'CanvasMetadata',
    'MobileApplicationDetail',
    'CustomNotificationType',
    'NotificationTypeConfig',
    'DelegateGroup',
    'ManagedContentType',
    'EmailServicesFunction',
    'SamlSsoConfig',
    'EmbeddedServiceLiveAgent',
];
exports.default = MetadataSummaryInfoFetcher;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YWRhdGFTdW1tYXJ5SW5mb0ZldGNoZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvaW1wbC9tZXRhZGF0YS9yZXRyaWV2ZXIvbWV0YWRhdGFTdW1tYXJ5SW5mb0ZldGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHNEQUFzRDtBQUN0RCxxRUFBNkM7QUFDN0MsbUVBQTZEO0FBRTdELGtEQUErQztBQUMvQyx5REFBeUQ7QUFDekQscUVBQTZDO0FBQzdDLCtCQUErQjtBQUUvQixNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7QUFFckMsTUFBcUIsMEJBQTBCO0lBK0ZwQyxNQUFNLENBQUMsS0FBSyxDQUFDLDZCQUE2QixDQUM3QyxJQUFnQixFQUNoQixvQkFBb0IsR0FBRyxLQUFLLEVBQzVCLGNBQXdCLDBCQUEwQixDQUFDLGlCQUFpQjtRQUVwRSxJQUFJLFdBQVcsR0FBaUMsSUFBSSxHQUFHLEVBQTJCLENBQUM7UUFDbkYsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO1FBRWYsSUFBSSxNQUFNLEdBQTJCLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMscUJBQVcsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDO1FBRS9GLE1BQU0sQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUU7WUFDeEMseUJBQXlCO1lBQ3pCLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNyRCxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQzNDLENBQUM7WUFFRCx1REFBdUQ7WUFDdkQsSUFBSSxRQUFRLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JB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