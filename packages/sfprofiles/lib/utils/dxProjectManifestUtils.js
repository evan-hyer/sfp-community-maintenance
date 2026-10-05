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
exports.DXProjectManifestUtils = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
class DXProjectManifestUtils {
    constructor(projectFolder) {
        this.projectFolder = projectFolder;
    }
    removePackagesNotInDirectory() {
        //Validate projectJson Path
        let sfdxProjectManifestPath = path.join(this.projectFolder, 'sfdx-project.json');
        if (!fs.existsSync(sfdxProjectManifestPath))
            throw new Error(`sfdx-project.json doesn't exist at ${sfdxProjectManifestPath}`);
        // Read sfdx-projec.json
        const sfdxProjectManifest = fs.readFileSync(sfdxProjectManifestPath, 'utf8');
        this.sfdxProjectManifestJSON = JSON.parse(sfdxProjectManifest);
        //Filter sfdx-project.json of unwanted directories
        this.sfdxProjectManifestJSON.packageDirectories = this.sfdxProjectManifestJSON.packageDirectories.filter((el) => this.isElementExists(el));
        //write back sfdx-project.json back
        fs.writeJSONSync(sfdxProjectManifestPath, this.sfdxProjectManifestJSON);
    }
    isElementExists(element) {
        return fs.existsSync(path.join(this.projectFolder, element.path));
    }
}
exports.DXProjectManifestUtils = DXProjectManifestUtils;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHhQcm9qZWN0TWFuaWZlc3RVdGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9keFByb2plY3RNYW5pZmVzdFV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkNBQTZCO0FBQzdCLDZDQUErQjtBQUUvQixNQUFhLHNCQUFzQjtJQUcvQixZQUEyQixhQUFxQjtRQUFyQixrQkFBYSxHQUFiLGFBQWEsQ0FBUTtJQUFHLENBQUM7SUFFN0MsNEJBQTRCO1FBQy9CLDJCQUEyQjtRQUMzQixJQUFJLHVCQUF1QixHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBRWpGLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLHVCQUF1QixDQUFDO1lBQ3ZDLE1BQU0sSUFBSSxLQUFLLENBQUMsc0NBQXNDLHVCQUF1QixFQUFFLENBQUMsQ0FBQztRQUVyRix3QkFBd0I7UUFDeEIsTUFBTSxtQkFBbUIsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLHVCQUF1QixFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzdFLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFFL0Qsa0RBQWtEO1FBQ2xELElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FDNUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FDM0IsQ0FBQztRQUVGLG1DQUFtQztRQUNuQyxFQUFFLENBQUMsYUFBYSxDQUFDLHVCQUF1QixFQUFFLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0lBQzVFLENBQUM7SUFFTyxlQUFlLENBQUMsT0FBTztRQUMzQixPQUFPLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3RFLENBQUM7Q0FDSjtBQTVCRCx3REE0QkMifQ==