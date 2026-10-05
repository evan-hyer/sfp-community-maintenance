"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chunkArray = void 0;
function chunkArray(perChunk, inputArray) {
    let chunks = [], i = 0, n = inputArray.length;
    while (i < n) {
        chunks.push(inputArray.slice(i, (i += perChunk)));
    }
    return chunks;
}
exports.chunkArray = chunkArray;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2h1bmtBcnJheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9jaHVua0FycmF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLFNBQWdCLFVBQVUsQ0FBQyxRQUFnQixFQUFFLFVBQWlCO0lBQzFELElBQUksTUFBTSxHQUFHLEVBQUUsRUFDWCxDQUFDLEdBQUcsQ0FBQyxFQUNMLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDO0lBRTFCLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1FBQ1gsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEQsQ0FBQztJQUVELE9BQU8sTUFBTSxDQUFDO0FBQ2xCLENBQUM7QUFWRCxnQ0FVQyJ9