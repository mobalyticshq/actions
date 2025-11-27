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
exports.TimeoutError = void 0;
exports.spawnWithTimeout = spawnWithTimeout;
const child_process_1 = require("child_process");
const core = __importStar(require("@actions/core"));
exports.TimeoutError = 'TIMEOUT_ERROR';
function makeSpawnPromise(input) {
    const { command, args, timeoutMs, env } = input;
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)(command, args, {
            env: { ...process.env, ...env },
            shell: true,
            stdio: 'inherit',
        });
        let stderr = '';
        child.stdout?.on('data', data => {
            core.info(data.toString());
        });
        child.stderr?.on('data', data => {
            stderr += data.toString();
            core.warning(data.toString());
        });
        const timeout = setTimeout(() => {
            core.warning(`Command timeout reached (${timeoutMs}ms), killing process...`);
            child.kill('SIGTERM');
            // Даем процессу время на корректное завершение
            setTimeout(() => {
                if (!child.killed) {
                    child.kill('SIGKILL');
                }
            }, 5000);
            reject(new Error(exports.TimeoutError));
        }, timeoutMs);
        child.on('close', (code, signal) => {
            clearTimeout(timeout);
            if (code === 0) {
                resolve('Command completed successfully');
            }
            else if (signal === 'SIGTERM') {
                reject(new Error(exports.TimeoutError));
            }
            else {
                reject(new Error(`Process exited with code ${code}. stderr: ${stderr}`));
            }
        });
        child.on('error', error => {
            clearTimeout(timeout);
            reject(error);
        });
    });
}
function spawnWithTimeout(input) {
    const { extraConditionPromise, ...restInput } = input;
    const spawnPromise = makeSpawnPromise(restInput);
    if (extraConditionPromise) {
        return Promise.race([spawnPromise, extraConditionPromise]);
    }
    return spawnPromise;
}
//# sourceMappingURL=exec.utils.js.map