"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstalledPackages = void 0;
let retry = require('async-retry');
async function getInstalledPackages(conn, fetchLicenses) {
    let packageDetails = [];
    let installedPackagesQuery = 'SELECT Id, SubscriberPackageId, SubscriberPackage.NamespacePrefix, SubscriberPackage.Name, ' +
        'SubscriberPackageVersion.Id, SubscriberPackageVersion.Name, SubscriberPackageVersion.MajorVersion, SubscriberPackageVersion.MinorVersion, ' +
        'SubscriberPackageVersion.PatchVersion, SubscriberPackageVersion.BuildNumber, SubscriberPackageVersion.Package2ContainerOptions, SubscriberPackageVersion.IsOrgDependent FROM InstalledSubscriberPackage ' +
        'ORDER BY SubscriberPackageId';
    let packageNamespacePrefixList = [];
    return await retry(async (bail) => {
        let results = await conn.tooling.query(installedPackagesQuery);
        const records = results.records;
        if (records && records.length > 0) {
            records.forEach((record) => {
                const packageDetail = {};
                packageDetail.packageName = record['SubscriberPackage']['Name'];
                packageDetail.subcriberPackageId = record['SubscriberPackageId'];
                packageDetail.packageNamespacePrefix = record['SubscriberPackage']['NamespacePrefix'];
                packageDetail.packageVersionId = record['SubscriberPackageVersion']['Id'];
                packageDetail.packageVersionNumber = `${record['SubscriberPackageVersion']['MajorVersion']}.${record['SubscriberPackageVersion']['MinorVersion']}.${record['SubscriberPackageVersion']['PatchVersion']}.${record['SubscriberPackageVersion']['BuildNumber']}`;
                packageDetail.type = record['SubscriberPackageVersion']['Package2ContainerOptions'];
                packageDetail.IsOrgDependent = record['SubscriberPackageVersion']['IsOrgDependent'];
                packageDetails.push(packageDetail);
                if (packageDetail.packageNamespacePrefix) {
                    packageNamespacePrefixList.push("'" + packageDetail.packageNamespacePrefix + "'");
                }
            });
        }
        if (fetchLicenses) {
            let licenseMap = new Map();
            if (packageNamespacePrefixList.length > 0) {
                let packageLicensingQuery = `SELECT AllowedLicenses, UsedLicenses,ExpirationDate, NamespacePrefix, IsProvisioned, Status FROM PackageLicense  WHERE NamespacePrefix IN (${packageNamespacePrefixList})`;
                await conn.query(packageLicensingQuery).then((queryResult) => {
                    if (queryResult.records && queryResult.records.length > 0) {
                        queryResult.records.forEach((record) => {
                            let licenseDetailObj = {};
                            licenseDetailObj.allowedLicenses =
                                record['AllowedLicenses'] > 0 ? record['AllowedLicenses'] : 0;
                            licenseDetailObj.usedLicenses = record['UsedLicenses'];
                            licenseDetailObj.expirationDate = record['ExpirationDate'];
                            licenseDetailObj.status = record['Status'];
                            licenseMap.set(record['NamespacePrefix'], licenseDetailObj);
                        });
                    }
                });
            }
            if (packageDetails.length > 0 && licenseMap.size > 0) {
                packageDetails.forEach((detail) => {
                    if (detail.packageNamespacePrefix && licenseMap.has(detail.packageNamespacePrefix)) {
                        let licDetail = licenseMap.get(detail.packageNamespacePrefix);
                        detail.allowedLicenses = licDetail.allowedLicenses;
                        detail.usedLicenses = licDetail.usedLicenses;
                        detail.expirationDate = licDetail.expirationDate;
                        detail.status = licDetail.status;
                    }
                });
            }
        }
        return packageDetails;
    }, { retries: 3, minTimeout: 3000 });
}
exports.getInstalledPackages = getInstalledPackages;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFja2FnZVV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWxzL3BhY2thZ2VVdGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7QUFFNUIsS0FBSyxVQUFVLG9CQUFvQixDQUFDLElBQWdCLEVBQUUsYUFBc0I7SUFDL0UsSUFBSSxjQUFjLEdBQUcsRUFBRSxDQUFDO0lBRXhCLElBQUksc0JBQXNCLEdBQ3RCLDZGQUE2RjtRQUM3Riw0SUFBNEk7UUFDNUksME1BQTBNO1FBQzFNLDhCQUE4QixDQUFDO0lBRW5DLElBQUksMEJBQTBCLEdBQUcsRUFBRSxDQUFDO0lBRXBDLE9BQU8sTUFBTSxLQUFLLENBQ2QsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFO1FBQ1gsSUFBSSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQy9ELE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7UUFFaEMsSUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNoQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUU7Z0JBQ3ZCLE1BQU0sYUFBYSxHQUFHLEVBQW1CLENBQUM7Z0JBQzFDLGFBQWEsQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLG1CQUFtQixDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ2hFLGFBQWEsQ0FBQyxrQkFBa0IsR0FBRyxNQUFNLENBQUMscUJBQXFCLENBQUMsQ0FBQztnQkFDakUsYUFBYSxDQUFDLHNCQUFzQixHQUFHLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUM7Z0JBQ3RGLGFBQWEsQ0FBQyxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsMEJBQTBCLENB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