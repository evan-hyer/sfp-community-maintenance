export default class MetadataFiles {
    static sourceOnly: boolean;
    forceignore: any;
    constructor();
    static getFullApiName(fileName: string): string;
    static getFullApiNameWithExtension(fileName: string): string;
    static isCustomMetadata(filepath: string, name: string): boolean;
    static getMemberNameFromFilepath(filepath: string, name: string): string;
    loadComponents(srcFolder: string, checkIgnore?: boolean): void;
    accepts(filePath: string): boolean;
    isInModuleFolder(filePath: string): Promise<boolean>;
    /**
     * Copy a file to an outpu directory. If the filePath is a Metadata file Path,
     * All the metadata requirement are also copied. For example MyApexClass.cls-meta.xml will also copy MyApexClass.cls.
     * Enforcing the .forceignore to ignire file ignored in the project.
     * @param filePath
     * @param outputFolder
     */
    static copyFile(filePath: string, outputFolder: string): void;
}
//# sourceMappingURL=metadataFiles.d.ts.map