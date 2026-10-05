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
const core_1 = require("@salesforce/core");
const sfpowerkit_1 = require("../../utils/sfpowerkit");
const sfp_logger_1 = __importStar(require("@flxbl-io/sfp-logger"));
const worker_threads_1 = require("worker_threads");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const xml2js = __importStar(require("xml2js"));
const util = __importStar(require("util"));
const profileWriter_1 = __importDefault(require("../metadata/writer/profileWriter"));
const profileComponentReconciler_1 = __importDefault(require("./profileComponentReconciler"));
const source_deploy_retrieve_1 = require("@salesforce/source-deploy-retrieve");
class ReconcileWorker {
    constructor(targetOrg, isSourceOnly) {
        this.targetOrg = targetOrg;
        this.isSourceOnly = isSourceOnly;
    }
    async reconcile(profilesToReconcile, destFolder) {
        //Init Cache for each worker thread from file system
        sfpowerkit_1.Sfpowerkit.initCache();
        if (this.targetOrg) {
            const org = await core_1.Org.create({ aliasOrUsername: this.targetOrg });
            this.conn = org.getConnection();
        }
        else {
            //Load all local components from source to database
            await this.loadAllLocalComponents();
        }
        let result = [];
        for (let count = 0; count < profilesToReconcile.length; count++) {
            let reconciledProfile = await this.reconcileProfileJob(profilesToReconcile[count], destFolder);
            result.push(reconciledProfile[0]);
        }
        return result;
    }
    async loadAllLocalComponents() {
        const resolver = new source_deploy_retrieve_1.MetadataResolver();
        const project = await core_1.SfProject.resolve();
        let packageDirectories = project.getPackageDirectories();
        for (const packageDirectory of packageDirectories) {
            const components = resolver.getComponentsFromPath(packageDirectory.path);
            for (const component of components) {
                this.loadComponentsTocache(component);
            }
        }
    }
    loadComponentsTocache(component) {
        sfpowerkit_1.Sfpowerkit.addToCache(`SOURCE_${component.type.name}_${component.fullName}`, true);
        sfpowerkit_1.Sfpowerkit.addToCache(`${component.type.name}_SOURCE_CACHE_AVAILABLE`, true);
        let children = component.getChildren();
        for (const child of children) {
            this.loadComponentsTocache(child);
        }
    }
    reconcileProfileJob(profileComponent, destFolder) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let reconcilePromise = new Promise((resolve, reject) => {
            let result = []; // Handle result of command execution
            let profileXmlString = fs.readFileSync(profileComponent.path);
            const parser = new xml2js.Parser({ explicitArray: true });
            const parseString = util.promisify(parser.parseString);
            parseString(profileXmlString)
                .then((parseResult) => {
                let profileWriter = new profileWriter_1.default();
                const profileObj = profileWriter.toProfile(parseResult.Profile); // as Profile
                return profileObj;
            })
                .then((profileObj) => {
                return new profileComponentReconciler_1.default(this.conn, this.isSourceOnly).reconcileProfileComponents(profileObj, profileComponent.name);
            })
                .then((profileObj) => {
                //write profile back
                let outputFile = profileComponent.path;
                if (destFolder != null) {
                    outputFile = path.join(destFolder, path.basename(profileComponent.path));
                }
                let profileWriter = new profileWriter_1.default();
                profileWriter.writeProfile(profileObj, outputFile);
                result.push(outputFile);
                resolve(result);
                return result;
            })
                .catch((error) => {
                sfp_logger_1.default.log(`Error while processing file ${profileComponent.path}.\n${error}`, sfp_logger_1.LoggerLevel.ERROR);
            });
        });
        return reconcilePromise;
    }
}
exports.default = ReconcileWorker;
sfpowerkit_1.Sfpowerkit.setLogLevel(worker_threads_1.workerData.loglevel, worker_threads_1.workerData.isJsonFormatEnabled);
let reconcileWorker = new ReconcileWorker(worker_threads_1.workerData.targetOrg, worker_threads_1.workerData.isSourceOnly);
reconcileWorker.reconcile(worker_threads_1.workerData.profileChunk, worker_threads_1.workerData.destFolder).then((result) => {
    worker_threads_1.parentPort.postMessage(result);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVjb25jaWxlV29ya2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2ltcGwvc291cmNlL3JlY29uY2lsZVdvcmtlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkNBQThEO0FBQzlELGtEQUErQztBQUMvQyxtRUFBNkQ7QUFDN0QsbURBQXdEO0FBQ3hELDZDQUErQjtBQUMvQiwyQ0FBNkI7QUFDN0IsK0NBQWlDO0FBQ2pDLDJDQUE2QjtBQUM3Qix3RkFBZ0U7QUFHaEUsOEZBQXNFO0FBQ3RFLCtFQUF1RjtBQUl2RixNQUFxQixlQUFlO0lBRWhDLFlBQTJCLFNBQWlCLEVBQVUsWUFBcUI7UUFBaEQsY0FBUyxHQUFULFNBQVMsQ0FBUTtRQUFVLGlCQUFZLEdBQVosWUFBWSxDQUFTO0lBQUcsQ0FBQztJQUV4RSxLQUFLLENBQUMsU0FBUyxDQUFDLG1CQUF3QyxFQUFFLFVBQWtCO1FBQy9FLG9EQUFvRDtRQUVwRCx1QkFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBRXZCLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ2pCLE1BQU0sR0FBRyxHQUFHLE1BQU0sVUFBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLGVBQWUsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztZQUNsRSxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUNwQyxDQUFDO2FBQU0sQ0FBQztZQUNKLG1EQUFtRDtZQUNuRCxNQUFNLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1FBQ3hDLENBQUM7UUFFRCxJQUFJLE1BQU0sR0FBYSxFQUFFLENBQUM7UUFDMUIsS0FBSyxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUUsS0FBSyxHQUFHLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDO1lBQzlELElBQUksaUJBQWlC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