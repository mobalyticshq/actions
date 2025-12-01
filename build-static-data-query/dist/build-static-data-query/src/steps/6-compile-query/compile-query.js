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
exports.compileQuery = compileQuery;
const babel = __importStar(require("@babel/core"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const core = __importStar(require("@actions/core"));
const graphqlTagPlugin = require('babel-plugin-graphql-tag');
const queryDir = 'build/gql/query';
async function compileQuery() {
    const absoluteQueryDir = path.resolve(process.cwd(), queryDir);
    if (!fs.existsSync(absoluteQueryDir)) {
        throw new Error(`Query directory does not exist: ${absoluteQueryDir}`);
    }
    // Find all .gql.ts files
    const queryFiles = findGqlFiles(absoluteQueryDir);
    core.info(`Found ${queryFiles.length} GraphQL query files to compile`);
    if (queryFiles.length === 0) {
        const errorMessage = 'No GraphQL query files found';
        core.setFailed(errorMessage);
        throw new Error(errorMessage);
    }
    // Compile each file
    for (const filePath of queryFiles) {
        try {
            core.info(`Compiling: ${path.relative(process.cwd(), filePath)}`);
            const sourceCode = fs.readFileSync(filePath, 'utf-8');
            const result = await babel.transformAsync(sourceCode, {
                filename: filePath,
                plugins: [[graphqlTagPlugin]],
                presets: [
                    [
                        '@babel/preset-typescript',
                        {
                            isTSX: false,
                            allExtensions: false,
                        },
                    ],
                ],
            });
            const compiledCode = result?.code;
            if (!compiledCode) {
                const errorMessage = 'Babel transformation returned no code';
                core.setFailed(errorMessage);
                throw new Error(errorMessage);
            }
            // Create compiled file path with -compiled postfix
            const parsedPath = path.parse(filePath);
            const compiledFilePath = path.join(parsedPath.dir, `${parsedPath.name.replace('.gql', '-compiled.gql')}${parsedPath.ext}`);
            // Write compiled code to new file
            fs.writeFileSync(compiledFilePath, compiledCode, 'utf-8');
            core.info(`✓ Compiled: ${path.relative(process.cwd(), compiledFilePath)}`);
        }
        catch (error) {
            const relativePath = path.relative(process.cwd(), filePath);
            const errorMessage = `Failed to compile ${relativePath}: ${error instanceof Error ? error.message : String(error)}`;
            core.setFailed(errorMessage);
            throw error instanceof Error ? error : new Error(errorMessage);
        }
    }
    core.info(`✓ Successfully compiled ${queryFiles.length} GraphQL query files`);
}
/**
 * Recursively find all .gql.ts files
 */
function findGqlFiles(dirPath, files = []) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            findGqlFiles(fullPath, files);
        }
        else if (entry.isFile() && entry.name.endsWith('.gql.ts')) {
            files.push(fullPath);
        }
    }
    return files;
}
//# sourceMappingURL=compile-query.js.map