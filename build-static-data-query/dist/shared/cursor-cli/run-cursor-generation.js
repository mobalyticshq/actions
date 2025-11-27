"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCursorGeneration = runCursorGeneration;
const core = __importStar(require("@actions/core"));
const exec_utils_1 = require("../utils/exec.utils");
async function runCursorGeneration(input) {
    try {
        const { timeoutMs, model = 'sonnet-4.5', prompt } = input;
        core.info(`Cursor-agent generation starts with prompt: ${prompt}`);
        try {
            await (0, exec_utils_1.spawnWithTimeout)({ command: 'which cursor-agent', args: [], timeoutMs });
            core.info('cursor-agent is installed');
        }
        catch {
            core.info('Installing cursor-cli...');
            await (0, exec_utils_1.spawnWithTimeout)({ command: 'curl -fsSL https://cursor.com/install | bash', args: [], timeoutMs });
            core.addPath(`${process.env.HOME}/.cursor/bin`);
            core.info('Installation completed');
        }
        // Get CURSOR_API_KEY from environment (GitHub Actions secrets)
        const cursorApiKey = process.env.CURSOR_API_KEY;
        if (!cursorApiKey) {
            core.setFailed('CURSOR_API_KEY environment variable is not set');
            process.exit(1);
        }
        const command = 'cursor-agent';
        const args = ['-p', '--force', `--model=${model}`, '--output-format', 'text', prompt];
        core.info(`Executing cursor-agent with timeout: ${timeoutMs}ms`);
        // Execute command with timeout
        try {
            await (0, exec_utils_1.spawnWithTimeout)({
                command,
                args,
                timeoutMs,
                env: {
                    ...process.env,
                    CURSOR_API_KEY: cursorApiKey,
                },
            });
            core.info(`✓ Generation completed successfully`);
            return;
        }
        catch (error) {
            if (error instanceof Error && error.message === exec_utils_1.TimeoutError) {
                core.setFailed(`cursor-agent execution timed out after ${timeoutMs}ms`);
            }
            else {
                core.setFailed(`Failed to execute cursor-agent: ${error instanceof Error ? error.message : String(error)}`);
            }
            process.exit(1);
        }
    }
    catch (error) {
        core.setFailed(`Unexpected error in cursor generation: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}
//# sourceMappingURL=run-cursor-generation.js.map