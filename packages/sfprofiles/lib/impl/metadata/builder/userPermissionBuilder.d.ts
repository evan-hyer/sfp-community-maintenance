import { ProfileObjectPermissions, ProfileUserPermission } from '../schema';
export default class UserPermissionBuilder {
    constructor();
    addPermissionDependencies(profileOrPermissionSet: any): void;
    private mergeObjectAccess;
    private addAccess;
    private addRequiredObjectAccess;
    handlePermissionDependency(profileOrPermissionSet: {
        objectPermissions?: ProfileObjectPermissions[];
        userPermissions?: ProfileUserPermission[];
    }, supportedPermissions: string[]): any;
    private enablePermission;
    private hasPermission;
}
//# sourceMappingURL=userPermissionBuilder.d.ts.map