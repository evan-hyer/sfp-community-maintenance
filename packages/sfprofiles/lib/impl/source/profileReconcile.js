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
const sfpowerkit_1 = require("../../utils/sfpowerkit");
const path = __importStar(require("path"));
const _ = __importStar(require("lodash"));
const profileActions_1 = __importDefault(require("./profileActions"));
const fileutils_1 = __importDefault(require("../../utils/fileutils"));
const fs = __importStar(require("fs-extra"));
const worker_threads_1 = require("worker_threads");
const sfp_logger_1 = __importStar(require("@flxbl-io/sfp-logger"));
const metadataFiles_1 = __importDefault(require("../metadata/metadataFiles"));
class ProfileReconcile extends profileActions_1.default {
    async reconcile(srcFolders, profileList, destFolder) {
        //Get supported permissions from the org
        try {
            this.createDestinationFolder(destFolder);
            sfp_logger_1.default.log(`ProfileList ${JSON.stringify(profileList)}`, sfp_logger_1.LoggerLevel.DEBUG);
            if (_.isNil(srcFolders) || srcFolders.length === 0) {
                srcFolders = await sfpowerkit_1.Sfpowerkit.getProjectDirectories();
            }
            sfp_logger_1.default.log(`Project Directories ${JSON.stringify(srcFolders)}`, sfp_logger_1.LoggerLevel.TRACE);
            let localProfiles = await this.loadProfileFromPackageDirectories(srcFolders);
            //Find Profiles to Reconcile
            let profilesToReconcile = this.findProfilesToReconcile(profileList, localProfiles);
            sfp_logger_1.default.log(`Profiles Found in Project Directory ${profilesToReconcile.length}`, sfp_logger_1.LoggerLevel.INFO);
            let reconciledProfiles = [];
            //Reconcile one first, then do the rest later to use cache for subsequent one
            if (profilesToReconcile.length > 1) {
                reconciledProfiles = await this.runWorkers([profilesToReconcile[0]], destFolder);
                profilesToReconcile.shift();
            }
            reconciledProfiles = reconciledProfiles.concat(await this.runWorkers(profilesToReconcile, destFolder));
            return reconciledProfiles;
        }
        catch (err) {
            console.error(err);
            throw err;
        }
    }
    runWorkers(profilesToReconcile, destFolder) {
        let workerCount = 0;
        let finishedWorkerCount = 0;
        let chunk = 10; // One worker to process 10 profiles
        let i;
        let profileCount = profilesToReconcile.length;
        let result = [];
        let workerPromise = new Promise((resolve, reject) => {
            var _a;
            try {
                for (i = 0; i < profileCount; i += chunk) {
                    workerCount++;
                    let temparray = profilesToReconcile.slice(i, i + chunk);
                    sfp_logger_1.default.log(`Initiated Profile reconcile thread :${workerCount}  with a chunk of ${temparray.length} profiles`, sfp_logger_1.LoggerLevel.INFO);
                    sfp_logger_1.default.log(`Profiles queued in thread :${workerCount} :`, sfp_logger_1.LoggerLevel.INFO);
                    let reconcileWorkerFile;
                    //Switch to typescript while run locally using sfdx link, for debugging, else switch to js
                    if (fs.existsSync(path.resolve(__dirname, `./reconcileWorker.js`))) {
                        reconcileWorkerFile = `./reconcileWorker.js`;
                    }
                    else {
                        reconcileWorkerFile = `./reconcileWorker.ts`;
                    }
                    sfp_logger_1.default.log(`reconcileWorkerFile: ${reconcileWorkerFile}`, sfp_logger_1.LoggerLevel.TRACE);
                    const workerData = {
                        profileChunk: temparray,
                        destFolder: destFolder,
                        targetOrg: (_a = this.org) === null || _a === void 0 ? void 0 : _a.getUsername(), //Org can be null during source only reconcile
                        loglevel: sfp_logger_1.default.logLevel,
                        isJsonFormatEnabled: sfpowerkit_1.Sfpowerkit.isJsonFormatEnabled,
                        isSourceOnly: metadataFiles_1.default.sourceOnly,
                        path: reconcileWorkerFile,
                    };
                    const worker = new worker_threads_1.Worker(path.resolve(__dirname, './worker.js'), {
                        workerData
                    });
                    worker.on('message', (data) => {
                        // eslint-disable-next-line @typescript-eslint/no-array-constructor
                        sfp_logger_1.default.log(`Message received: ${data}`, sfp_logger_1.LoggerLevel.TRACE);
                        let completedProfiles = new Array();
                        completedProfiles.push(...data);
                        for (const profile of completedProfiles) {
                            sfp_logger_1.default.log(`Reconciled Profile ${profile}`, sfp_logger_1.LoggerLevel.INFO);
                        }
                        result.push(...data);
                    });
                    worker.on('error', (err) => {
                        sfp_logger_1.default.log(`Error while running worker ${err}`, sfp_logger_1.LoggerLevel.ERROR);
                        reject(err);
                    });
                    worker.on('exit', (code) => {
                        finishedWorkerCount++;
                        sfp_logger_1.default.log(`Worker stopped with exit code ${code}`, sfp_logger_1.LoggerLevel.TRACE);
                        if (code !== 0)
                            //reject(new Error(`Worker stopped with exit code ${code}`));
                            sfp_logger_1.default.log(`Worker stopped with exit code ${code}`, sfp_logger_1.LoggerLevel.ERROR);
                        if (workerCount === finishedWorkerCount) {
                            resolve(result);
                        }
                    });
                }
            }
            catch (err) {
                console.error(err);
                throw err;
            }
        });
        return workerPromise;
    }
    findProfilesToReconcile(profileList, localProfiles) {
        let profilesToReconcile;
        if (profileList.length > 0) {
            profilesToReconcile = localProfiles.filter((elem) => {
                if (profileList.includes(elem.name))
                    return true;
            });
        }
        else {
            profilesToReconcile = localProfiles;
        }
        return profilesToReconcile;
    }
    createDestinationFolder(destFolder) {
        if (!_.isNil(destFolder)) {
            fileutils_1.default.mkDirByPathSync(destFolder);
        }
    }
}
exports.default = ProfileReconcile;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZmlsZVJlY29uY2lsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9pbXBsL3NvdXJjZS9wcm9maWxlUmVjb25jaWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxrREFBK0M7QUFDL0MsMkNBQTZCO0FBQzdCLDBDQUE0QjtBQUM1QixzRUFBcUU7QUFDckUsaUVBQXlDO0FBQ3pDLDZDQUErQjtBQUMvQixtREFBd0M7QUFDeEMsbUVBQThEO0FBQzlELGlGQUF5RDtBQUV6RCxNQUFxQixnQkFBaUIsU0FBUSx3QkFBYztJQUNqRCxLQUFLLENBQUMsU0FBUyxDQUFDLFVBQW9CLEVBQUUsV0FBcUIsRUFBRSxVQUFrQjtRQUNsRix3Q0FBd0M7UUFDeEMsSUFBSSxDQUFDO1lBQ0QsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3pDLG9CQUFTLENBQUMsR0FBRyxDQUFDLGVBQWUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLHdCQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFL0UsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ2pELFVBQVUsR0FBRyxNQUFNLHVCQUFVLENBQUMscUJBQXFCLEVBQUUsQ0FBQztZQUMxRCxDQUFDO1lBRUQsb0JBQVMsQ0FBQyxHQUFHLENBQUMsdUJBQXVCLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSx3QkFBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RGLElBQUksYUFBYSxHQUFHLE1BQU0sSUFBSSxDQUFDLGlDQUFpQyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRTdFLDRCQUE0QjtZQUM1QixJQUFJLG1CQUFtQixHQUF3QixJQUFJLENBQUMsdUJBQXVCLENBQUMs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