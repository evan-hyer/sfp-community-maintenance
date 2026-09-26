//Adapted from https://github.com/nickadam/kv
//Original Author Nick Vissari
'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
class SQLITEKeyValue {
    constructor(path) {
        this.path = path;
    }
    init() {
        // connect to sqlite
        this.sqlite = new better_sqlite3_1.default(this.path);
        // initialize kv table
        this.sqlite.exec('CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)');
    }
    get(key) {
        let q = 'SELECT * FROM kv WHERE k = ?';
        let data = [];
        // eslint-disable-next-line no-constant-condition
        while (true) {
            try {
                data = this.sqlite.prepare(q).all(key);
                break;
            }
            catch (err) {
                continue;
            }
        }
        // parse the values
        data = data.map((x) => {
            x.v = JSON.parse(x.v);
            return x;
        });
        if (data.length == 0) {
            return null;
        }
        return data[0].v;
    }
    set(key, value) {
        let q = 'INSERT INTO kv (k,v) VALUES (@k, @v) ON CONFLICT(k) DO UPDATE SET v=@v,timestamp=CURRENT_TIMESTAMP';
        const data = {
            k: key,
            v: JSON.stringify(value),
        };
        // eslint-disable-next-line no-constant-condition
        while (true) {
            try {
                this.sqlite.prepare(q).run(data);
                break;
            }
            catch (err) {
                continue;
            }
        }
    }
}
exports.default = SQLITEKeyValue;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3FsaXRla3YuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbHMvc3FsaXRla3YudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsNkNBQTZDO0FBQzdDLDhCQUE4QjtBQUU5QixZQUFZLENBQUM7Ozs7O0FBQ2Isb0VBQTRDO0FBRTVDLE1BQXFCLGNBQWM7SUFHL0IsWUFBb0IsSUFBWTtRQUFaLFNBQUksR0FBSixJQUFJLENBQVE7SUFBRyxDQUFDO0lBRTdCLElBQUk7UUFDUCxvQkFBb0I7UUFDcEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLHdCQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVDLHNCQUFzQjtRQUN0QixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FDWiwwR0FBMEcsQ0FDN0csQ0FBQztJQUNOLENBQUM7SUFFTSxHQUFHLENBQUMsR0FBVztRQUNsQixJQUFJLENBQUMsR0FBRyw4QkFBOEIsQ0FBQztRQUV2QyxJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7UUFFZCxpREFBaUQ7UUFDakQsT0FBTyxJQUFJLEVBQUUsQ0FBQztZQUNWLElBQUksQ0FBQztnQkFDRCxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN2QyxNQUFNO1lBQ1YsQ0FBQztZQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7Z0JBQ1gsU0FBUztZQUNiLENBQUM7UUFDTCxDQUFDO1FBRUQsbUJBQW1CO1FBQ25CLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7WUFDbEIsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QixPQUFPLENBQUMsQ0FBQztRQUNiLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ25CLE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFRCxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDckIsQ0FBQztJQUVNLEdBQUcsQ0FBQyxHQUFXLEVBQUUsS0FBVTtRQUM5QixJQUFJLENBQUMsR0FBRyxvR0FBb0csQ0FBQztRQUM3RyxNQUFNLElBQUksR0FBRztZQUNULENBQUMsRUFBRSxHQUFHO1lBQ04sQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDO1NBQzNCLENBQUM7UUFFRixpREFBaUQ7UUFDakQsT0FBTyxJQUFJLEVBQUUsQ0FBQztZQUNWLElBQUksQ0FBQztnQkFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2pDLE1BQU07WUFDVixDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDWCxTQUFTO1lBQ2IsQ0FBQztRQUNMLENBQUM7SUFDTCxDQUFDO0NBQ0o7QUEzREQsaUNBMkRDIn0=