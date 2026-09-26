export default class SQLITEKeyValue {
    private path;
    private sqlite;
    constructor(path: string);
    init(): void;
    get(key: string): any;
    set(key: string, value: any): void;
}
//# sourceMappingURL=sqlitekv.d.ts.map