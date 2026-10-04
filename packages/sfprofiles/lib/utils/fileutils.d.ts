export declare const PLUGIN_CACHE_FOLDER = "sfpowerkit";
export default class FileUtils {
    /**
     * Delete file or directories recursively from the project
     * @param deletedComponents Files or directories to delete
     */
    static deleteComponents(deletedComponents: string[]): void;
    /**
     * Load all files from the given folder with the given extension
     * @param folder the folder from which files wille be loaded
     * @param extension File extension to load.
     */
    static getAllFilesSync(folder: string, extension?: string): string[];
    static getGlobalCacheDir(): string;
    /**
     * Get the cache path for the given cache file name
     * @param fileName
     */
    static getGlobalCachePath(fileName: string): string;
    /**
     * Get the cache path for local working directory
     * @param fileName
     */
    static getLocalCachePath(fileName: string): string;
    /**
     * Create a folder path recursively
     * @param targetDir
     * @param param1
     */
    static mkDirByPathSync(targetDir: string, { isRelativeToScript }?: {
        isRelativeToScript?: boolean;
    }): void;
    /**
     * Get the file name withoud extension
     * @param filePath file path
     * @param extension extension
     */
    static getFileNameWithoutExtension(filePath: string, extension?: string): string;
    /**
     * Copu folder recursively
     * @param src source folder to copy
     * @param dest destination folder
     */
    static copyRecursiveSync(src: any, dest: any): void;
    /**
     * Get path to a given folder base on the parent folder
     * @param src  Parent folder
     * @param foldername folder to build the path to
     */
    static getFolderPath(src: any, foldername: any): string;
    /**
     * Delete a folder and its content recursively
     * @param folder folder to delete
     */
    static deleteFolderRecursive(folder: any): void;
    static makefolderid(length: any): string;
}
//# sourceMappingURL=fileutils.d.ts.map