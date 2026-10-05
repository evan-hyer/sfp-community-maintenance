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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROFILE_PERMISSIONSET_EXTENSION = exports.UNSPLITED_METADATA = exports.METADATA_INFO = exports.MetadataInfo = exports.SOURCE_EXTENSION_REGEX = void 0;
const _ = __importStar(require("lodash"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
exports.SOURCE_EXTENSION_REGEX = /\.[a-zA-Z]+-meta\.xml/;
const SPLITED_TYPES = {
    CustomField: {
        suffix: 'field',
        folder: 'fields',
    },
    BusinessProcess: {
        suffix: 'businessProcess',
        folder: 'businessProcesses',
    },
    CompactLayout: {
        suffix: 'compactLayout',
        folder: 'compactLayouts',
    },
    FieldSet: {
        suffix: 'fieldSet',
        folder: 'fieldSets',
    },
    RecordType: {
        suffix: 'recordType',
        folder: 'recordTypes',
    },
    ListView: {
        suffix: 'listView',
        folder: 'listViews',
    },
    SharingReason: {
        suffix: 'sharingReason',
        folder: 'sharingReasons',
    },
    ValidationRule: {
        suffix: 'validationRule',
        folder: 'validationRules',
    },
    WebLink: {
        suffix: 'webLink',
        folder: 'webLinks',
    },
};
class MetadataInfo {
    static loadMetadataInfo() {
        let metadataInfo = {};
        let resourcePath = path.join(__dirname, '..', '..', '..', 'resources', 'metadatainfo.json');
        const fileData = fs.readFileSync(resourcePath, 'utf8');
        let metadataInfoJSON = JSON.parse(fileData);
        metadataInfoJSON.metadataObjects.forEach((metadata) => {
            let metadataDescribe = metadata;
            if (_.isNil(metadata.suffix)) {
                if (metadata.xmlName === 'AuraDefinitionBundle') {
                    metadata.suffix = 'cmp';
                    metadataDescribe.suffix = 'cmp';
                }
                else if (metadata.xmlName == 'LightningComponentBundle') {
                    metadata.suffix = 'js';
                    metadataDescribe.suffix = 'js';
                }
            }
            metadataDescribe.sourceExtension = `.${metadata.suffix}-meta.xml`;
            if (metadata.inFolder) {
                let folderExtensionPrefix = metadata.suffix;
                if (_.isNil(metadata.suffix)) {
                    folderExtensionPrefix = metadata.xmlName.charAt(0).toLowerCase + metadata.xmlName.slice(1);
                }
                metadataDescribe.folderExtension = `.${folderExtensionPrefix}Folder-meta.xml`;
            }
            //Generate Describe of cheildItems if exists
            if (!_.isNil(metadata.childXmlNames)) {
                metadata.childXmlNames.forEach((element) => {
                    let splitedElement = SPLITED_TYPES[element];
                    if (!_.isNil(splitedElement)) {
                        let childDescribe = {};
                        childDescribe.directoryName = SPLITED_TYPES[element].folder;
                        childDescribe.suffix = SPLITED_TYPES[element].suffix;
                        childDescribe.xmlName = element;
                        childDescribe.inFolder = false;
                        childDescribe.metaFile = false;
                        childDescribe.isChildComponent = true;
                        childDescribe.sourceExtension = `.${SPLITED_TYPES[element].suffix}-meta.xml`;
                        metadataInfo[childDescribe.xmlName] = childDescribe;
                    }
                });
            }
            metadataInfo[metadataDescribe.xmlName] = metadataDescribe;
        });
        return metadataInfo;
    }
    static getMetadataName(metadataFile, validateSourceExtension = true) {
        let matcher = metadataFile.match(exports.SOURCE_EXTENSION_REGEX);
        let extension = '';
        if (matcher) {
            extension = matcher[0];
        }
        else {
            extension = path.parse(metadataFile).ext;
        }
        //SfPowerKit.ux.log(extension);
        let metadataName = '';
        const auraRegExp = new RegExp('aura');
        const lwcRegExp = new RegExp('lwc');
        const staticResourceRegExp = new RegExp('staticresources');
        const experienceBundleRegExp = new RegExp('experiences');
        const documentRegExp = new RegExp('documents');
        if (auraRegExp.test(metadataFile) && (exports.SOURCE_EXTENSION_REGEX.test(metadataFile) || !validateSourceExtension)) {
            metadataName = exports.METADATA_INFO.AuraDefinitionBundle.xmlName;
        }
        else if (lwcRegExp.test(metadataFile) &&
            (exports.SOURCE_EXTENSION_REGEX.test(metadataFile) || !validateSourceExtension)) {
            metadataName = exports.METADATA_INFO.LightningComponentBundle.xmlName;
        }
        else if (staticResourceRegExp.test(metadataFile) &&
            (exports.SOURCE_EXTENSION_REGEX.test(metadataFile) || !validateSourceExtension)) {
            metadataName = exports.METADATA_INFO.StaticResource.xmlName;
        }
        else if (experienceBundleRegExp.test(metadataFile) &&
            (exports.SOURCE_EXTENSION_REGEX.test(metadataFile) || !validateSourceExtension)) {
            metadataName = exports.METADATA_INFO.ExperienceBundle.xmlName;
        }
        else if (documentRegExp.test(metadataFile) &&
            (exports.SOURCE_EXTENSION_REGEX.test(metadataFile) || !validateSourceExtension)) {
            metadataName = exports.METADATA_INFO.Document.xmlName;
        }
        else {
            let keys = Object.keys(exports.METADATA_INFO);
            for (let i = 0; i < keys.length; i++) {
                let metaDescribe = exports.METADATA_INFO[keys[i]];
                if (metaDescribe.sourceExtension === extension ||
                    ('.' + metaDescribe.suffix === extension && !validateSourceExtension) ||
                    metaDescribe.folderExtension === extension) {
                    metadataName = metaDescribe.xmlName;
                    break;
                }
            }
        }
        return metadataName;
    }
}
exports.MetadataInfo = MetadataInfo;
exports.METADATA_INFO = MetadataInfo.loadMetadataInfo();
exports.UNSPLITED_METADATA = [
    exports.METADATA_INFO.Workflow,
    exports.METADATA_INFO.SharingRules,
    exports.METADATA_INFO.CustomLabels,
    exports.METADATA_INFO.Profile,
    exports.METADATA_INFO.PermissionSet,
];
exports.PROFILE_PERMISSIONSET_EXTENSION = [exports.METADATA_INFO.Profile, exports.METADATA_INFO.PermissionSet];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YWRhdGFJbmZvLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2ltcGwvbWV0YWRhdGEvbWV0YWRhdGFJbmZvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMENBQTRCO0FBQzVCLDJDQUE2QjtBQUM3Qiw2Q0FBK0I7QUFFbEIsUUFBQSxzQkFBc0IsR0FBRyx1QkFBdUIsQ0FBQztBQUM5RCxNQUFNLGFBQWEsR0FBRztJQUNsQixXQUFXLEVBQUU7UUFDVCxNQUFNLEVBQUUsT0FBTztRQUNmLE1BQU0sRUFBRSxRQUFRO0tBQ25CO0lBQ0QsZUFBZSxFQUFFO1FBQ2IsTUFBTSxFQUFFLGlCQUFpQjtRQUN6QixNQUFNLEVBQUUsbUJBQW1CO0tBQzlCO0lBQ0QsYUFBYSxFQUFFO1FBQ1gsTUFBTSxFQUFFLGVBQWU7UUFDdkIsTUFBTSxFQUFFLGdCQUFnQjtLQUMzQjtJQUNELFFBQVEsRUFBRTtRQUNOLE1BQU0sRUFBRSxVQUFVO1FBQ2xCLE1BQU0sRUFBRSxXQUFXO0tBQ3RCO0lBQ0QsVUFBVSxFQUFFO1FBQ1IsTUFBTSxFQUFFLFlBQVk7UUFDcEIsTUFBTSxFQUFFLGFBQWE7S0FDeEI7SUFDRCxRQUFRLEVBQUU7UUFDTixNQUFNLEVBQUUsVUFBVTtRQUNsQixNQUFNLEVBQUUsV0FBVztLQUN0QjtJQUNELGFBQWEsRUFBRTtRQUNYLE1BQU0sRUFBRSxlQUFlO1FBQ3ZCLE1BQU0sRUFBRSxnQkFBZ0I7S0FDM0I7SUFDRCxjQUFjLEVBQUU7UUFDWixNQUFNLEVBQUUsZ0JBQWdCO1FBQ3hCLE1BQU0sRUFBRSxpQkFBaUI7S0FDNUI7SUFDRCxPQUFPLEVBQUU7UUFDTCxNQUFNLEVBQUUsU0FBUztRQUNqQixNQUFNLEVBQUUsVUFBVTtLQUNyQjtDQUNKLENBQUM7QUF5REYsTUFBYSxZQUFZO0lBQ3JCLE1BQU0sQ0FBQyxnQkFBZ0I7UUFDbkIsSUFBSSxZQUFZLEdBQWlCLEVBQUUs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