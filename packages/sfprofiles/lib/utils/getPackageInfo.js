"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultPackageInfo = exports.getPackageInfo = void 0;
//Returns the info about a requested package
function getPackageInfo(packageJson, packageName) {
    //Find the default package or passed package as the parameter
    const packageDirectories = packageJson.get('packageDirectories') || [];
    let packageInfo;
    if (packageName) {
        packageInfo = packageDirectories.filter((it) => {
            return it['package'] === packageName;
        })[0];
        if (packageInfo == undefined) {
            throw new Error('Invalid Package');
        }
    }
    else
        throw new Error('Package Name is empty');
    return packageInfo;
}
exports.getPackageInfo = getPackageInfo;
//Returns the info about a requested package
function getDefaultPackageInfo(packageJson) {
    //Find the default package or passed package as the parameter
    const packageDirectories = packageJson.get('packageDirectories') || [];
    let packageInfo;
    packageInfo = packageDirectories.filter((it) => {
        return it['default'] == true;
    })[0];
    if (packageInfo == undefined) {
        throw new Error('Default Package not found');
    }
    return packageInfo;
}
exports.getDefaultPackageInfo = getDefaultPackageInfo;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0UGFja2FnZUluZm8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbHMvZ2V0UGFja2FnZUluZm8udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBSUEsNENBQTRDO0FBQzVDLFNBQWdCLGNBQWMsQ0FBQyxXQUEwQixFQUFFLFdBQW1CO0lBQzFFLDZEQUE2RDtJQUM3RCxNQUFNLGtCQUFrQixHQUFJLFdBQVcsQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQWUsSUFBSSxFQUFFLENBQUM7SUFDdEYsSUFBSSxXQUFXLENBQUM7SUFDaEIsSUFBSSxXQUFXLEVBQUUsQ0FBQztRQUNkLFdBQVcsR0FBRyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRTtZQUMzQyxPQUFPLEVBQUUsQ0FBQyxTQUFTLENBQUMsS0FBSyxXQUFXLENBQUM7UUFDekMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFTixJQUFJLFdBQVcsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUMzQixNQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDdkMsQ0FBQztJQUNMLENBQUM7O1FBQU0sTUFBTSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0lBQ2hELE9BQU8sV0FBVyxDQUFDO0FBQ3ZCLENBQUM7QUFkRCx3Q0FjQztBQUVELDRDQUE0QztBQUM1QyxTQUFnQixxQkFBcUIsQ0FBQyxXQUEwQjtJQUM1RCw2REFBNkQ7SUFDN0QsTUFBTSxrQkFBa0IsR0FBSSxXQUFXLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFlLElBQUksRUFBRSxDQUFDO0lBQ3RGLElBQUksV0FBVyxDQUFDO0lBRWhCLFdBQVcsR0FBRyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRTtRQUMzQyxPQUFPLEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxJQUFJLENBQUM7SUFDakMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFTixJQUFJLFdBQVcsSUFBSSxTQUFTLEVBQUUsQ0FBQztRQUMzQixNQUFNLElBQUksS0FBSyxDQUFDLDJCQUEyQixDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVELE9BQU8sV0FBVyxDQUFDO0FBQ3ZCLENBQUM7QUFkRCxzREFjQyJ9