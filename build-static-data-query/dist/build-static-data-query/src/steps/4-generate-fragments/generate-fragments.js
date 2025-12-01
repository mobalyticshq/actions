"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFragments = generateFragments;
const run_cursor_generation_1 = require("@shared/cursor-cli/run-cursor-generation");
const path_1 = __importDefault(require("path"));
async function generateFragments(options) {
    const { timeoutMs } = options;
    const promptFilePath = path_1.default.resolve(__dirname, 'generate-fragments.md');
    return await (0, run_cursor_generation_1.runCursorGeneration)({
        timeoutMs,
        prompt: `"Implement instructions in the file ${promptFilePath}"`,
    });
}
//# sourceMappingURL=generate-fragments.js.map