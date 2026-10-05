import { AnyJson } from '@salesforce/ts-types';
import Profile from '../impl/metadata/schema';
export default class XmlUtil {
    static xmlToJSON(directory: string): Promise<{
        Profile: Profile;
    }>;
    static jSONToXML(obj: AnyJson): any;
}
//# sourceMappingURL=xmlUtil.d.ts.map