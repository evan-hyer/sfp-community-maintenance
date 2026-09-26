export declare const SOURCE_EXTENSION_REGEX: RegExp;
export interface MetadataDescribe {
    directoryName?: string;
    inFolder?: boolean;
    metaFile?: boolean;
    suffix?: string;
    xmlName?: string;
    sourceExtension?: string;
    childXmlNames?: string[];
    folderExtension?: string;
    files?: string[];
    components?: string[];
    isChildComponent?: boolean;
}
export interface MetadataInfo {
    CustomApplication?: MetadataDescribe;
    ApexClass?: MetadataDescribe;
    ApexPage?: MetadataDescribe;
    CustomField?: MetadataDescribe;
    CustomObject?: MetadataDescribe;
    CustomPermission?: MetadataDescribe;
    ExternalDataSource?: MetadataDescribe;
    ExperienceBundle?: MetadataDescribe;
    Flow?: MetadataDescribe;
    RecordType?: MetadataDescribe;
    ListView?: MetadataDescribe;
    WebLink?: MetadataDescribe;
    ValidationRule?: MetadataDescribe;
    CompactLayout?: MetadataDescribe;
    BujsinessProcess?: MetadataDescribe;
    CustomTab?: MetadataDescribe;
    Layout?: MetadataDescribe;
    Profile?: MetadataDescribe;
    Translations?: MetadataDescribe;
    CustomLabel?: MetadataDescribe;
    CustomLabels?: MetadataDescribe;
    GlobalValueSet?: MetadataDescribe;
    CustomMetadata?: MetadataDescribe;
    Document?: MetadataDescribe;
    Queue?: MetadataDescribe;
    Group?: MetadataDescribe;
    Role?: MetadataDescribe;
    Report?: MetadataDescribe;
    Dashboard?: MetadataDescribe;
    EmailTemplate?: MetadataDescribe;
    CustomSite?: MetadataDescribe;
    PermissionSet?: MetadataDescribe;
    StaticResource?: MetadataDescribe;
    CustomObjectTranslation?: MetadataDescribe;
    AuraDefinitionBundle?: MetadataDescribe;
    Workflow?: MetadataDescribe;
    SharingRules?: MetadataDescribe;
    LightningComponentBundle?: MetadataDescribe;
}
export declare class MetadataInfo {
    static loadMetadataInfo(): MetadataInfo;
    static getMetadataName(metadataFile: string, validateSourceExtension?: boolean): string;
}
export declare const METADATA_INFO: MetadataInfo;
export declare const UNSPLITED_METADATA: MetadataDescribe[];
export declare const PROFILE_PERMISSIONSET_EXTENSION: MetadataDescribe[];
//# sourceMappingURL=metadataInfo.d.ts.map