import Profile from '../schema';
export default class ProfileWriter {
    writeProfile(profileObj: Profile, filePath: string): void;
    toXml(profileObj: Profile): any;
    toProfile(profileObj: any): Profile;
    private removeArrayNatureOnValue;
}
//# sourceMappingURL=profileWriter.d.ts.map