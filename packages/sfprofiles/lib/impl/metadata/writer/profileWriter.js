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
const fs = __importStar(require("fs-extra"));
const xml2js = __importStar(require("xml2js"));
const format = require('xml-formatter');
const nonArayProperties = ['custom', 'description', 'fullName', 'userLicense', '$'];
const PROFILE_NAMESPACE = 'http://soap.sforce.com/2006/04/metadata';
class ProfileWriter {
    writeProfile(profileObj, filePath) {
        //Delete eampty arrays
        for (let key in profileObj) {
            if (Array.isArray(profileObj[key])) {
                //All top element must be arays exept non arrayProperties
                if (!nonArayProperties.includes(key) && profileObj[key].length === 0) {
                    delete profileObj[key];
                }
            }
        }
        let builder = new xml2js.Builder({
            rootName: 'Profile',
            xmldec: { version: '1.0', encoding: 'UTF-8' },
        });
        profileObj['$'] = {
            xmlns: PROFILE_NAMESPACE,
        };
        let xml = builder.buildObject(profileObj);
        let formattedXml = format(xml, {
            indentation: '    ',
            filter: (node) => node.type !== 'Comment',
            collapseContent: true,
            lineSeparator: '\n',
        });
        //console.log(formattedXml);
        fs.writeFileSync(filePath, formattedXml);
    }
    toXml(profileObj) {
        //Delete eampty arrays
        for (let key in profileObj) {
            if (Array.isArray(profileObj[key])) {
                //All top element must be arays exept non arrayProperties
                if (!nonArayProperties.includes(key) && profileObj[key].length === 0) {
                    delete profileObj[key];
                }
            }
        }
        let builder = new xml2js.Builder({
            rootName: 'Profile',
            xmldec: { version: '1.0', encoding: 'UTF-8' },
        });
        profileObj['$'] = {
            xmlns: PROFILE_NAMESPACE,
        };
        let xml = builder.buildObject(profileObj);
        let formattedXml = format(xml, {
            indentation: '    ',
            filter: (node) => node.type !== 'Comment',
            collapseContent: true,
            lineSeparator: '\n',
        });
        return formattedXml;
    }
    toProfile(profileObj) {
        let convertedObject = {};
        for (let key in profileObj) {
            if (Array.isArray(profileObj[key])) {
                //All top element must be arays exept non arrayProperties
                if (nonArayProperties.includes(key)) {
                    convertedObject[key] =
                        profileObj[key][0] === 'true'
                            ? true
                            : profileObj[key][0] === 'false'
                                ? false
                                : profileObj[key][0];
                }
                else {
                    let data = [];
                    for (let i = 0; i < profileObj[key].length; i++) {
                        let element = this.removeArrayNatureOnValue(profileObj[key][i]);
                        if (element !== '') {
                            data.push(element);
                        }
                    }
                    convertedObject[key] = data;
                }
            }
            else if (nonArayProperties.includes(key)) {
                convertedObject[key] = profileObj[key];
            }
            else {
                convertedObject[key] = [profileObj[key]];
            }
        }
        return convertedObject;
    }
    removeArrayNatureOnValue(obj) {
        let toReturn = {};
        for (let key in obj) {
            if (Array.isArray(obj[key]) && obj[key].length > 0) {
                //All top element must be arays exept non arrayProperties
                toReturn[key] = obj[key][0] === 'true' ? true : obj[key][0] === 'false' ? false : obj[key][0];
            }
            else {
                toReturn[key] = obj[key];
            }
        }
        return toReturn;
    }
}
exports.default = ProfileWriter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvZmlsZVdyaXRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9pbXBsL21ldGFkYXRhL3dyaXRlci9wcm9maWxlV3JpdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSw2Q0FBK0I7QUFDL0IsK0NBQWlDO0FBQ2pDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUV4QyxNQUFNLGlCQUFpQixHQUFHLENBQUMsUUFBUSxFQUFFLGFBQWEsRUFBRSxVQUFVLEVBQUUsYUFBYSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ3BGLE1BQU0saUJBQWlCLEdBQUcseUNBQXlDLENBQUM7QUFFcEUsTUFBcUIsYUFBYTtJQUN2QixZQUFZLENBQUMsVUFBbUIsRUFBRSxRQUFnQjtRQUNyRCxzQkFBc0I7UUFDdEIsS0FBSyxJQUFJLEdBQUcsSUFBSSxVQUFVLEVBQUUsQ0FBQztZQUN6QixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDakMseURBQXlEO2dCQUN6RCxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7b0JBQ25FLE9BQU8sVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMzQixDQUFDO1lBQ0wsQ0FBQztRQUNMLENBQUM7UUFFRCxJQUFJLE9BQU8sR0FBRyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUM7WUFDN0IsUUFBUSxFQUFFLFNBQVM7WUFDbkIsTUFBTSxFQUFFLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFO1NBQ2hELENBQUMsQ0FBQztRQUNILFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRztZQUNkLEtBQUss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