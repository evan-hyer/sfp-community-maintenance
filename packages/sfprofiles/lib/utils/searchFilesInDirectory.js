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
exports.getFilesInDirectory = exports.searchFilesInDirectory = void 0;
const sfp_logger_1 = __importDefault(require("@flxbl-io/sfp-logger"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
function searchFilesInDirectory(dir, filter, ext) {
    if (!fs.existsSync(dir)) {
        sfp_logger_1.default.log(`Specified directory: ${dir} does not exist`);
        return;
    }
    let filesFound = [];
    // const files = fs.readdirSync(dir);
    const found = getFilesInDirectory(dir, ext);
    found.forEach((file) => {
        const fileContent = fs.readFileSync(file);
        const regex = new RegExp(filter);
        if (regex.test(fileContent.toString())) {
            filesFound.push(file);
        }
    });
    return filesFound;
}
exports.searchFilesInDirectory = searchFilesInDirectory;
// Using recursion, we find every file with the desired extention, even if its deeply nested in subfolders.
function getFilesInDirectory(dir, ext) {
    if (!fs.existsSync(dir)) {
        sfp_logger_1.default.log(`Specified directory: ${dir} does not exist`);
        return;
    }
    let files = [];
    fs.readdirSync(dir).forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.lstatSync(filePath);
        // If we hit a directory, apply our function to that dir. If we hit a file, add it to the array of files.
        if (stat.isDirectory()) {
            const nestedFiles = getFilesInDirectory(filePath, ext);
            files = files.concat(nestedFiles);
        }
        else {
            if (path.extname(file) === ext) {
                files.push(filePath);
            }
        }
    });
    return files;
}
exports.getFilesInDirectory = getFilesInDirectory;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoRmlsZXNJbkRpcmVjdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9zZWFyY2hGaWxlc0luRGlyZWN0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsc0VBQTZDO0FBQzdDLDZDQUErQjtBQUMvQiwyQ0FBNkI7QUFFN0IsU0FBZ0Isc0JBQXNCLENBQUMsR0FBVyxFQUFFLE1BQWMsRUFBRSxHQUFXO0lBQzNFLElBQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDdEIsb0JBQVMsQ0FBQyxHQUFHLENBQUMsd0JBQXdCLEdBQUcsaUJBQWlCLENBQUMsQ0FBQztRQUM1RCxPQUFPO0lBQ1gsQ0FBQztJQUVELElBQUksVUFBVSxHQUFHLEVBQUUsQ0FBQztJQUVwQixxQ0FBcUM7SUFDckMsTUFBTSxLQUFLLEdBQUcsbUJBQW1CLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBRTVDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtRQUNuQixNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRTFDLE1BQU0sS0FBSyxHQUFHLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRWpDLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQ3JDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDMUIsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxVQUFVLENBQUM7QUFDdEIsQ0FBQztBQXJCRCx3REFxQkM7QUFFRCwyR0FBMkc7QUFDM0csU0FBZ0IsbUJBQW1CLENBQUMsR0FBVyxFQUFFLEdBQVc7SUFDeEQsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUN0QixvQkFBUyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsR0FBRyxpQkFBaUIsQ0FBQyxDQUFDO1FBQzVELE9BQU87SUFDWCxDQUFDO0lBRUQsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO0lBQ2YsRUFBRSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtRQUNqQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN0QyxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXBDLHlHQUF5RztRQUN6RyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO1lBQ3JCLE1BQU0sV0FBVyxHQUFHLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUN2RCxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN0QyxDQUFDO2FBQU0sQ0FBQztZQUNKLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztnQkFDN0IsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN6QixDQUFDO1FBQ0wsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxLQUFLLENBQUM7QUFDakIsQ0FBQztBQXZCRCxrREF1QkMifQ==