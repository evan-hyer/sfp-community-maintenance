"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const worker_threads_1 = require("worker_threads");
if (worker_threads_1.workerData.path.endsWith('.ts'))
    require('ts-node').register();
try {
    require((0, path_1.resolve)(__dirname, worker_threads_1.workerData.path));
}
catch (err) {
    console.log(err);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2ltcGwvc291cmNlL3dvcmtlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLCtCQUErQjtBQUMvQixtREFBNEM7QUFFNUMsSUFBSSwyQkFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO0lBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBRW5FLElBQUksQ0FBQztJQUNELE9BQU8sQ0FBQyxJQUFBLGNBQU8sRUFBQyxTQUFTLEVBQUUsMkJBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ2pELENBQUM7QUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0lBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUNwQixDQUFDIn0=