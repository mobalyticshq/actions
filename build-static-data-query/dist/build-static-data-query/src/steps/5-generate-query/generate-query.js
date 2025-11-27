"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQuery = generateQuery;
const run_cursor_generation_1 = require("@shared/cursor-cli/run-cursor-generation");
const path_1 = __importDefault(require("path"));
async function generateQuery(options) {
    const { timeoutMs } = options;
    const promptFilePath = path_1.default.resolve(process.cwd(), './generate-query.md');
    return await (0, run_cursor_generation_1.runCursorGeneration)({
        timeoutMs,
        prompt: `"Implement instructions in the file ${promptFilePath}"`,
    });
}
//# sourceMappingURL=generate-query.js.map