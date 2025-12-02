/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 317:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.toPlatformPath = exports.toWin32Path = exports.toPosixPath = void 0;
const path = __importStar(__webpack_require__(6928));
/**
 * toPosixPath converts the given path to the posix form. On Windows, \\ will be
 * replaced with /.
 *
 * @param pth. Path to transform.
 * @return string Posix path.
 */
function toPosixPath(pth) {
    return pth.replace(/[\\]/g, '/');
}
exports.toPosixPath = toPosixPath;
/**
 * toWin32Path converts the given path to the win32 form. On Linux, / will be
 * replaced with \\.
 *
 * @param pth. Path to transform.
 * @return string Win32 path.
 */
function toWin32Path(pth) {
    return pth.replace(/[/]/g, '\\');
}
exports.toWin32Path = toWin32Path;
/**
 * toPlatformPath converts the given path to a platform-specific path. It does
 * this by replacing instances of / and \ with the platform-specific path
 * separator.
 *
 * @param pth The path to platformize.
 * @return string The platform-specific path.
 */
function toPlatformPath(pth) {
    return pth.replace(/[/\\]/g, path.sep);
}
exports.toPlatformPath = toPlatformPath;
//# sourceMappingURL=path-utils.js.map

/***/ }),

/***/ 857:
/***/ ((module) => {

module.exports = require("os");

/***/ }),

/***/ 985:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateFragments = void 0;
var generate_fragments_1 = __webpack_require__(9258);
Object.defineProperty(exports, "generateFragments", ({ enumerable: true, get: function () { return generate_fragments_1.generateFragments; } }));


/***/ }),

/***/ 1039:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateGqlTypes = void 0;
var generate_gql_types_1 = __webpack_require__(9005);
Object.defineProperty(exports, "generateGqlTypes", ({ enumerable: true, get: function () { return generate_gql_types_1.generateGqlTypes; } }));


/***/ }),

/***/ 1040:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.summary = exports.markdownSummary = exports.SUMMARY_DOCS_URL = exports.SUMMARY_ENV_VAR = void 0;
const os_1 = __webpack_require__(857);
const fs_1 = __webpack_require__(9896);
const { access, appendFile, writeFile } = fs_1.promises;
exports.SUMMARY_ENV_VAR = 'GITHUB_STEP_SUMMARY';
exports.SUMMARY_DOCS_URL = 'https://docs.github.com/actions/using-workflows/workflow-commands-for-github-actions#adding-a-job-summary';
class Summary {
    constructor() {
        this._buffer = '';
    }
    /**
     * Finds the summary file path from the environment, rejects if env var is not found or file does not exist
     * Also checks r/w permissions.
     *
     * @returns step summary file path
     */
    filePath() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._filePath) {
                return this._filePath;
            }
            const pathFromEnv = process.env[exports.SUMMARY_ENV_VAR];
            if (!pathFromEnv) {
                throw new Error(`Unable to find environment variable for $${exports.SUMMARY_ENV_VAR}. Check if your runtime environment supports job summaries.`);
            }
            try {
                yield access(pathFromEnv, fs_1.constants.R_OK | fs_1.constants.W_OK);
            }
            catch (_a) {
                throw new Error(`Unable to access summary file: '${pathFromEnv}'. Check if the file has correct read/write permissions.`);
            }
            this._filePath = pathFromEnv;
            return this._filePath;
        });
    }
    /**
     * Wraps content in an HTML tag, adding any HTML attributes
     *
     * @param {string} tag HTML tag to wrap
     * @param {string | null} content content within the tag
     * @param {[attribute: string]: string} attrs key-value list of HTML attributes to add
     *
     * @returns {string} content wrapped in HTML element
     */
    wrap(tag, content, attrs = {}) {
        const htmlAttrs = Object.entries(attrs)
            .map(([key, value]) => ` ${key}="${value}"`)
            .join('');
        if (!content) {
            return `<${tag}${htmlAttrs}>`;
        }
        return `<${tag}${htmlAttrs}>${content}</${tag}>`;
    }
    /**
     * Writes text in the buffer to the summary buffer file and empties buffer. Will append by default.
     *
     * @param {SummaryWriteOptions} [options] (optional) options for write operation
     *
     * @returns {Promise<Summary>} summary instance
     */
    write(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const overwrite = !!(options === null || options === void 0 ? void 0 : options.overwrite);
            const filePath = yield this.filePath();
            const writeFunc = overwrite ? writeFile : appendFile;
            yield writeFunc(filePath, this._buffer, { encoding: 'utf8' });
            return this.emptyBuffer();
        });
    }
    /**
     * Clears the summary buffer and wipes the summary file
     *
     * @returns {Summary} summary instance
     */
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.emptyBuffer().write({ overwrite: true });
        });
    }
    /**
     * Returns the current summary buffer as a string
     *
     * @returns {string} string of summary buffer
     */
    stringify() {
        return this._buffer;
    }
    /**
     * If the summary buffer is empty
     *
     * @returns {boolen} true if the buffer is empty
     */
    isEmptyBuffer() {
        return this._buffer.length === 0;
    }
    /**
     * Resets the summary buffer without writing to summary file
     *
     * @returns {Summary} summary instance
     */
    emptyBuffer() {
        this._buffer = '';
        return this;
    }
    /**
     * Adds raw text to the summary buffer
     *
     * @param {string} text content to add
     * @param {boolean} [addEOL=false] (optional) append an EOL to the raw text (default: false)
     *
     * @returns {Summary} summary instance
     */
    addRaw(text, addEOL = false) {
        this._buffer += text;
        return addEOL ? this.addEOL() : this;
    }
    /**
     * Adds the operating system-specific end-of-line marker to the buffer
     *
     * @returns {Summary} summary instance
     */
    addEOL() {
        return this.addRaw(os_1.EOL);
    }
    /**
     * Adds an HTML codeblock to the summary buffer
     *
     * @param {string} code content to render within fenced code block
     * @param {string} lang (optional) language to syntax highlight code
     *
     * @returns {Summary} summary instance
     */
    addCodeBlock(code, lang) {
        const attrs = Object.assign({}, (lang && { lang }));
        const element = this.wrap('pre', this.wrap('code', code), attrs);
        return this.addRaw(element).addEOL();
    }
    /**
     * Adds an HTML list to the summary buffer
     *
     * @param {string[]} items list of items to render
     * @param {boolean} [ordered=false] (optional) if the rendered list should be ordered or not (default: false)
     *
     * @returns {Summary} summary instance
     */
    addList(items, ordered = false) {
        const tag = ordered ? 'ol' : 'ul';
        const listItems = items.map(item => this.wrap('li', item)).join('');
        const element = this.wrap(tag, listItems);
        return this.addRaw(element).addEOL();
    }
    /**
     * Adds an HTML table to the summary buffer
     *
     * @param {SummaryTableCell[]} rows table rows
     *
     * @returns {Summary} summary instance
     */
    addTable(rows) {
        const tableBody = rows
            .map(row => {
            const cells = row
                .map(cell => {
                if (typeof cell === 'string') {
                    return this.wrap('td', cell);
                }
                const { header, data, colspan, rowspan } = cell;
                const tag = header ? 'th' : 'td';
                const attrs = Object.assign(Object.assign({}, (colspan && { colspan })), (rowspan && { rowspan }));
                return this.wrap(tag, data, attrs);
            })
                .join('');
            return this.wrap('tr', cells);
        })
            .join('');
        const element = this.wrap('table', tableBody);
        return this.addRaw(element).addEOL();
    }
    /**
     * Adds a collapsable HTML details element to the summary buffer
     *
     * @param {string} label text for the closed state
     * @param {string} content collapsable content
     *
     * @returns {Summary} summary instance
     */
    addDetails(label, content) {
        const element = this.wrap('details', this.wrap('summary', label) + content);
        return this.addRaw(element).addEOL();
    }
    /**
     * Adds an HTML image tag to the summary buffer
     *
     * @param {string} src path to the image you to embed
     * @param {string} alt text description of the image
     * @param {SummaryImageOptions} options (optional) addition image attributes
     *
     * @returns {Summary} summary instance
     */
    addImage(src, alt, options) {
        const { width, height } = options || {};
        const attrs = Object.assign(Object.assign({}, (width && { width })), (height && { height }));
        const element = this.wrap('img', null, Object.assign({ src, alt }, attrs));
        return this.addRaw(element).addEOL();
    }
    /**
     * Adds an HTML section heading element
     *
     * @param {string} text heading text
     * @param {number | string} [level=1] (optional) the heading level, default: 1
     *
     * @returns {Summary} summary instance
     */
    addHeading(text, level) {
        const tag = `h${level}`;
        const allowedTag = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)
            ? tag
            : 'h1';
        const element = this.wrap(allowedTag, text);
        return this.addRaw(element).addEOL();
    }
    /**
     * Adds an HTML thematic break (<hr>) to the summary buffer
     *
     * @returns {Summary} summary instance
     */
    addSeparator() {
        const element = this.wrap('hr', null);
        return this.addRaw(element).addEOL();
    }
    /**
     * Adds an HTML line break (<br>) to the summary buffer
     *
     * @returns {Summary} summary instance
     */
    addBreak() {
        const element = this.wrap('br', null);
        return this.addRaw(element).addEOL();
    }
    /**
     * Adds an HTML blockquote to the summary buffer
     *
     * @param {string} text quote text
     * @param {string} cite (optional) citation url
     *
     * @returns {Summary} summary instance
     */
    addQuote(text, cite) {
        const attrs = Object.assign({}, (cite && { cite }));
        const element = this.wrap('blockquote', text, attrs);
        return this.addRaw(element).addEOL();
    }
    /**
     * Adds an HTML anchor tag to the summary buffer
     *
     * @param {string} text link text/content
     * @param {string} href hyperlink
     *
     * @returns {Summary} summary instance
     */
    addLink(text, href) {
        const element = this.wrap('a', text, { href });
        return this.addRaw(element).addEOL();
    }
}
const _summary = new Summary();
/**
 * @deprecated use `core.summary`
 */
exports.markdownSummary = _summary;
exports.summary = _summary;
//# sourceMappingURL=summary.js.map

/***/ }),

/***/ 1253:
/***/ ((module) => {

module.exports = require("graphql");

/***/ }),

/***/ 1922:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.cleanSchema = void 0;
var clean_schema_1 = __webpack_require__(8323);
Object.defineProperty(exports, "cleanSchema", ({ enumerable: true, get: function () { return clean_schema_1.cleanSchema; } }));


/***/ }),

/***/ 2517:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateQuery = void 0;
var generate_query_1 = __webpack_require__(5419);
Object.defineProperty(exports, "generateQuery", ({ enumerable: true, get: function () { return generate_query_1.generateQuery; } }));


/***/ }),

/***/ 2911:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.checkSchemaVersion = void 0;
var check_schema_version_1 = __webpack_require__(6058);
Object.defineProperty(exports, "checkSchemaVersion", ({ enumerable: true, get: function () { return check_schema_version_1.checkSchemaVersion; } }));


/***/ }),

/***/ 3076:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateScopes = generateScopes;
const fs = __importStar(__webpack_require__(9896));
const graphql_1 = __webpack_require__(1253);
const core = __importStar(__webpack_require__(6977));
function generateScopes(options) {
    try {
        const { schemaPath, gameField } = options;
        core.info(`Reading schema from: ${schemaPath}`);
        // Step 1: Read the schema file
        if (!fs.existsSync(schemaPath)) {
            const errorMessage = `Schema file not found: ${schemaPath}`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
        // Step 2: Parse the schema
        let schema;
        try {
            schema = (0, graphql_1.buildSchema)(schemaContent);
        }
        catch (error) {
            const errorMessage = `Failed to parse schema: ${error instanceof Error ? error.message : String(error)}`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        // Step 3: Extract root types
        const queryType = schema.getQueryType();
        const mutationType = schema.getMutationType();
        const subscriptionType = schema.getSubscriptionType();
        // Get field names from each type
        const queryNamespaces = [];
        const mutationNamespaces = [];
        const subscriptionNamespaces = [];
        if (queryType) {
            const fields = queryType.getFields();
            queryNamespaces.push(...Object.keys(fields).sort());
        }
        if (mutationType) {
            const fields = mutationType.getFields();
            mutationNamespaces.push(...Object.keys(fields).sort());
        }
        if (subscriptionType) {
            const fields = subscriptionType.getFields();
            subscriptionNamespaces.push(...Object.keys(fields).sort());
        }
        core.info(`Extracted ${queryNamespaces.length} query fields`);
        core.info(`Extracted ${mutationNamespaces.length} mutation fields`);
        core.info(`Extracted ${subscriptionNamespaces.length} subscription fields`);
        // Step 4: Extract game-specific fields if gameField is provided
        let targetGameQueryFields = [];
        let targetGameQueryTypeName;
        if (gameField && queryType) {
            const fields = queryType.getFields();
            const gameFieldObj = fields[gameField];
            if (gameFieldObj) {
                // Get the type of this field (unwrap NonNull and List wrappers)
                let fieldType = gameFieldObj.type;
                // Unwrap NonNull and List types to get to the named type
                while ('ofType' in fieldType && fieldType.ofType) {
                    fieldType = fieldType.ofType;
                }
                // Check if it's an object type and get its fields
                if ((0, graphql_1.isObjectType)(fieldType)) {
                    const gameTypeFields = fieldType.getFields();
                    targetGameQueryFields = Object.keys(gameTypeFields).sort();
                    targetGameQueryTypeName = fieldType.name;
                    core.info(`✓ Extracted ${targetGameQueryFields.length} fields from ${gameField} type (${targetGameQueryTypeName})`);
                }
                else {
                    core.warning(`Field '${gameField}' is not an object type`);
                }
            }
            else {
                core.warning(`Field '${gameField}' not found in Query type`);
            }
        }
        core.info(`✓ Successfully generated scopes`);
        if (targetGameQueryFields.length > 0) {
            core.info(`  Target game (${gameField}) fields: ${targetGameQueryFields.length}`);
            core.info(`  Target game type name: ${targetGameQueryTypeName}`);
        }
        return {
            queryNamespaces,
            mutationNamespaces,
            subscriptionNamespaces,
            targetGameQueryFields,
            targetGameQueryTypeName,
        };
    }
    catch (error) {
        const errorMessage = `Unexpected error in generateScopes: ${error instanceof Error ? error.message : String(error)}`;
        core.setFailed(errorMessage);
        throw error instanceof Error ? error : new Error(errorMessage);
    }
}


/***/ }),

/***/ 3380:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.compileQuery = compileQuery;
const babel = __importStar(__webpack_require__(6346));
const fs = __importStar(__webpack_require__(9896));
const path = __importStar(__webpack_require__(6928));
const core = __importStar(__webpack_require__(6977));
const graphqlTagPlugin = __webpack_require__(8561);
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


/***/ }),

/***/ 3621:
/***/ ((__unused_webpack_module, exports) => {


// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.toCommandProperties = exports.toCommandValue = void 0;
/**
 * Sanitizes an input into a string so it can be passed into issueCommand safely
 * @param input input to sanitize into a string
 */
function toCommandValue(input) {
    if (input === null || input === undefined) {
        return '';
    }
    else if (typeof input === 'string' || input instanceof String) {
        return input;
    }
    return JSON.stringify(input);
}
exports.toCommandValue = toCommandValue;
/**
 *
 * @param annotationProperties
 * @returns The command properties to send with the actual annotation command
 * See IssueCommandProperties: https://github.com/actions/runner/blob/main/src/Runner.Worker/ActionCommandManager.cs#L646
 */
function toCommandProperties(annotationProperties) {
    if (!Object.keys(annotationProperties).length) {
        return {};
    }
    return {
        title: annotationProperties.title,
        file: annotationProperties.file,
        line: annotationProperties.startLine,
        endLine: annotationProperties.endLine,
        col: annotationProperties.startColumn,
        endColumn: annotationProperties.endColumn
    };
}
exports.toCommandProperties = toCommandProperties;
//# sourceMappingURL=utils.js.map

/***/ }),

/***/ 3869:
/***/ ((module) => {

module.exports = require("@google-cloud/storage");

/***/ }),

/***/ 4017:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.downloadSchema = downloadSchema;
const cli_1 = __webpack_require__(7404);
const rimraf_1 = __webpack_require__(9485);
const path = __importStar(__webpack_require__(6928));
const fs = __importStar(__webpack_require__(9896));
const core = __importStar(__webpack_require__(6977));
const outputPath = '_generated/schema.graphql';
const headers = {
    'xmoba-no-cache': '1',
};
async function downloadSchema(options) {
    try {
        const { endpoint } = options;
        // Resolve the absolute path for the output
        const absoluteOutputPath = path.resolve(process.cwd(), outputPath);
        const outputDir = path.dirname(absoluteOutputPath);
        // Step 1: Clean up old schema files in the output directory
        // This mimics the behavior of: rimraf ./src/**/*schema.graphql
        try {
            const schemaPattern = path.join(outputDir, '**/*schema.graphql');
            await (0, rimraf_1.rimraf)(schemaPattern);
            core.info('Cleaned up old schema files');
        }
        catch (error) {
            // If cleanup fails, log but continue - directory might not exist yet
            core.warning(`Could not clean up old schema files: ${error instanceof Error ? error.message : String(error)}`);
        }
        // Step 2: Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            core.info(`Created output directory: ${outputDir}`);
        }
        // Step 3: Configure and execute graphql-codegen
        const config = {
            schema: [
                {
                    [endpoint]: {
                        headers,
                    },
                },
            ],
            generates: {
                [absoluteOutputPath]: {
                    plugins: ['schema-ast'],
                    config: {
                        includeDirectives: true,
                        commentDescriptions: true,
                    },
                },
            },
        };
        // Step 4: Execute the code generation
        core.info(`Downloading schema from: ${endpoint}`);
        try {
            await (0, cli_1.generate)(config, true);
        }
        catch (error) {
            const errorMessage = `Failed to download schema from ${endpoint}: ${error instanceof Error ? error.message : String(error)}`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        // Verify the file was created
        if (!fs.existsSync(absoluteOutputPath)) {
            const errorMessage = `Schema file was not created at expected path: ${absoluteOutputPath}`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        core.info(`✓ Schema successfully saved to: ${absoluteOutputPath}`);
        return absoluteOutputPath;
    }
    catch (error) {
        // Catch any unexpected errors
        const errorMessage = `Unexpected error in downloadSchema: ${error instanceof Error ? error.message : String(error)}`;
        core.setFailed(errorMessage);
        throw error instanceof Error ? error : new Error(errorMessage);
    }
}


/***/ }),

/***/ 4304:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.compileQuery = void 0;
var compile_query_1 = __webpack_require__(3380);
Object.defineProperty(exports, "compileQuery", ({ enumerable: true, get: function () { return compile_query_1.compileQuery; } }));


/***/ }),

/***/ 4861:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.issue = exports.issueCommand = void 0;
const os = __importStar(__webpack_require__(857));
const utils_1 = __webpack_require__(7089);
/**
 * Commands
 *
 * Command Format:
 *   ::name key=value,key=value::message
 *
 * Examples:
 *   ::warning::This is the message
 *   ::set-env name=MY_VAR::some value
 */
function issueCommand(command, properties, message) {
    const cmd = new Command(command, properties, message);
    process.stdout.write(cmd.toString() + os.EOL);
}
exports.issueCommand = issueCommand;
function issue(name, message = '') {
    issueCommand(name, {}, message);
}
exports.issue = issue;
const CMD_STRING = '::';
class Command {
    constructor(command, properties, message) {
        if (!command) {
            command = 'missing.command';
        }
        this.command = command;
        this.properties = properties;
        this.message = message;
    }
    toString() {
        let cmdStr = CMD_STRING + this.command;
        if (this.properties && Object.keys(this.properties).length > 0) {
            cmdStr += ' ';
            let first = true;
            for (const key in this.properties) {
                if (this.properties.hasOwnProperty(key)) {
                    const val = this.properties[key];
                    if (val) {
                        if (first) {
                            first = false;
                        }
                        else {
                            cmdStr += ',';
                        }
                        cmdStr += `${key}=${escapeProperty(val)}`;
                    }
                }
            }
        }
        cmdStr += `${CMD_STRING}${escapeData(this.message)}`;
        return cmdStr;
    }
}
function escapeData(s) {
    return (0, utils_1.toCommandValue)(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A');
}
function escapeProperty(s) {
    return (0, utils_1.toCommandValue)(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A')
        .replace(/:/g, '%3A')
        .replace(/,/g, '%2C');
}
//# sourceMappingURL=command.js.map

/***/ }),

/***/ 5015:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OidcClient = void 0;
const http_client_1 = __webpack_require__(9736);
const auth_1 = __webpack_require__(8159);
const core_1 = __webpack_require__(6977);
class OidcClient {
    static createHttpClient(allowRetry = true, maxRetry = 10) {
        const requestOptions = {
            allowRetries: allowRetry,
            maxRetries: maxRetry
        };
        return new http_client_1.HttpClient('actions/oidc-client', [new auth_1.BearerCredentialHandler(OidcClient.getRequestToken())], requestOptions);
    }
    static getRequestToken() {
        const token = process.env['ACTIONS_ID_TOKEN_REQUEST_TOKEN'];
        if (!token) {
            throw new Error('Unable to get ACTIONS_ID_TOKEN_REQUEST_TOKEN env variable');
        }
        return token;
    }
    static getIDTokenUrl() {
        const runtimeUrl = process.env['ACTIONS_ID_TOKEN_REQUEST_URL'];
        if (!runtimeUrl) {
            throw new Error('Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable');
        }
        return runtimeUrl;
    }
    static getCall(id_token_url) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const httpclient = OidcClient.createHttpClient();
            const res = yield httpclient
                .getJson(id_token_url)
                .catch(error => {
                throw new Error(`Failed to get ID Token. \n 
        Error Code : ${error.statusCode}\n 
        Error Message: ${error.message}`);
            });
            const id_token = (_a = res.result) === null || _a === void 0 ? void 0 : _a.value;
            if (!id_token) {
                throw new Error('Response json body do not have ID Token field');
            }
            return id_token;
        });
    }
    static getIDToken(audience) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // New ID Token is requested from action service
                let id_token_url = OidcClient.getIDTokenUrl();
                if (audience) {
                    const encodedAudience = encodeURIComponent(audience);
                    id_token_url = `${id_token_url}&audience=${encodedAudience}`;
                }
                (0, core_1.debug)(`ID token url is ${id_token_url}`);
                const id_token = yield OidcClient.getCall(id_token_url);
                (0, core_1.setSecret)(id_token);
                return id_token;
            }
            catch (error) {
                throw new Error(`Error message: ${error.message}`);
            }
        });
    }
}
exports.OidcClient = OidcClient;
//# sourceMappingURL=oidc-utils.js.map

/***/ }),

/***/ 5185:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getDetails = exports.isLinux = exports.isMacOS = exports.isWindows = exports.arch = exports.platform = void 0;
const os_1 = __importDefault(__webpack_require__(857));
const exec = __importStar(__webpack_require__(8545));
const getWindowsInfo = () => __awaiter(void 0, void 0, void 0, function* () {
    const { stdout: version } = yield exec.getExecOutput('powershell -command "(Get-CimInstance -ClassName Win32_OperatingSystem).Version"', undefined, {
        silent: true
    });
    const { stdout: name } = yield exec.getExecOutput('powershell -command "(Get-CimInstance -ClassName Win32_OperatingSystem).Caption"', undefined, {
        silent: true
    });
    return {
        name: name.trim(),
        version: version.trim()
    };
});
const getMacOsInfo = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const { stdout } = yield exec.getExecOutput('sw_vers', undefined, {
        silent: true
    });
    const version = (_b = (_a = stdout.match(/ProductVersion:\s*(.+)/)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : '';
    const name = (_d = (_c = stdout.match(/ProductName:\s*(.+)/)) === null || _c === void 0 ? void 0 : _c[1]) !== null && _d !== void 0 ? _d : '';
    return {
        name,
        version
    };
});
const getLinuxInfo = () => __awaiter(void 0, void 0, void 0, function* () {
    const { stdout } = yield exec.getExecOutput('lsb_release', ['-i', '-r', '-s'], {
        silent: true
    });
    const [name, version] = stdout.trim().split('\n');
    return {
        name,
        version
    };
});
exports.platform = os_1.default.platform();
exports.arch = os_1.default.arch();
exports.isWindows = exports.platform === 'win32';
exports.isMacOS = exports.platform === 'darwin';
exports.isLinux = exports.platform === 'linux';
function getDetails() {
    return __awaiter(this, void 0, void 0, function* () {
        return Object.assign(Object.assign({}, (yield (exports.isWindows
            ? getWindowsInfo()
            : exports.isMacOS
                ? getMacOsInfo()
                : getLinuxInfo()))), { platform: exports.platform,
            arch: exports.arch,
            isWindows: exports.isWindows,
            isMacOS: exports.isMacOS,
            isLinux: exports.isLinux });
    });
}
exports.getDetails = getDetails;
//# sourceMappingURL=platform.js.map

/***/ }),

/***/ 5317:
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),

/***/ 5384:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  getCleanedSchemaByGame: () => (/* binding */ getCleanedSchemaByGame)
});

;// external "node:fs"
const external_node_fs_namespaceObject = require("node:fs");
// EXTERNAL MODULE: external "graphql"
var external_graphql_ = __webpack_require__(1253);
;// external "microfiber"
const external_microfiber_namespaceObject = require("microfiber");
;// ./codegen/utils/graphql-tools/Interfaces.js
var MapperKind;
(function (MapperKind) {
  MapperKind['TYPE'] = 'MapperKind.TYPE';
  MapperKind['SCALAR_TYPE'] = 'MapperKind.SCALAR_TYPE';
  MapperKind['ENUM_TYPE'] = 'MapperKind.ENUM_TYPE';
  MapperKind['COMPOSITE_TYPE'] = 'MapperKind.COMPOSITE_TYPE';
  MapperKind['OBJECT_TYPE'] = 'MapperKind.OBJECT_TYPE';
  MapperKind['INPUT_OBJECT_TYPE'] = 'MapperKind.INPUT_OBJECT_TYPE';
  MapperKind['ABSTRACT_TYPE'] = 'MapperKind.ABSTRACT_TYPE';
  MapperKind['UNION_TYPE'] = 'MapperKind.UNION_TYPE';
  MapperKind['INTERFACE_TYPE'] = 'MapperKind.INTERFACE_TYPE';
  MapperKind['ROOT_OBJECT'] = 'MapperKind.ROOT_OBJECT';
  MapperKind['QUERY'] = 'MapperKind.QUERY';
  MapperKind['MUTATION'] = 'MapperKind.MUTATION';
  MapperKind['SUBSCRIPTION'] = 'MapperKind.SUBSCRIPTION';
  MapperKind['DIRECTIVE'] = 'MapperKind.DIRECTIVE';
  MapperKind['FIELD'] = 'MapperKind.FIELD';
  MapperKind['COMPOSITE_FIELD'] = 'MapperKind.COMPOSITE_FIELD';
  MapperKind['OBJECT_FIELD'] = 'MapperKind.OBJECT_FIELD';
  MapperKind['ROOT_FIELD'] = 'MapperKind.ROOT_FIELD';
  MapperKind['QUERY_ROOT_FIELD'] = 'MapperKind.QUERY_ROOT_FIELD';
  MapperKind['MUTATION_ROOT_FIELD'] = 'MapperKind.MUTATION_ROOT_FIELD';
  MapperKind['SUBSCRIPTION_ROOT_FIELD'] = 'MapperKind.SUBSCRIPTION_ROOT_FIELD';
  MapperKind['INTERFACE_FIELD'] = 'MapperKind.INTERFACE_FIELD';
  MapperKind['INPUT_OBJECT_FIELD'] = 'MapperKind.INPUT_OBJECT_FIELD';
  MapperKind['ARGUMENT'] = 'MapperKind.ARGUMENT';
  MapperKind['ENUM_VALUE'] = 'MapperKind.ENUM_VALUE';
})(MapperKind || (MapperKind = {}));

;// ./codegen/utils/graphql-tools/getObjectTypeFromTypeMap.js

function getObjectTypeFromTypeMap(typeMap, type) {
  if (type) {
    const maybeObjectType = typeMap[type.name];
    if ((0,external_graphql_.isObjectType)(maybeObjectType)) {
      return maybeObjectType;
    }
  }
}

;// ./codegen/utils/graphql-tools/stub.js

function createNamedStub(name, type) {
  let constructor;
  if (type === 'object') {
    constructor = GraphQLObjectType;
  } else if (type === 'interface') {
    constructor = GraphQLInterfaceType;
  } else {
    constructor = GraphQLInputObjectType;
  }
  return new constructor({
    name,
    fields: {
      _fake: {
        type: GraphQLString,
      },
    },
  });
}
function createStub(node, type) {
  switch (node.kind) {
    case Kind.LIST_TYPE:
      return new GraphQLList(createStub(node.type, type));
    case Kind.NON_NULL_TYPE:
      return new GraphQLNonNull(createStub(node.type, type));
    default:
      if (type === 'output') {
        return createNamedStub(node.name.value, 'object');
      }
      return createNamedStub(node.name.value, 'input');
  }
}
function isNamedStub(type) {
  if ('getFields' in type) {
    const fields = type.getFields();
    // eslint-disable-next-line no-unreachable-loop
    for (const fieldName in fields) {
      const field = fields[fieldName];
      return field.name === '_fake';
    }
  }
  return false;
}
function getBuiltInForStub(type) {
  switch (type.name) {
    case external_graphql_.GraphQLInt.name:
      return external_graphql_.GraphQLInt;
    case external_graphql_.GraphQLFloat.name:
      return external_graphql_.GraphQLFloat;
    case external_graphql_.GraphQLString.name:
      return external_graphql_.GraphQLString;
    case external_graphql_.GraphQLBoolean.name:
      return external_graphql_.GraphQLBoolean;
    case external_graphql_.GraphQLID.name:
      return external_graphql_.GraphQLID;
    default:
      return type;
  }
}

;// ./codegen/utils/graphql-tools/rewire.js


function rewireTypes(originalTypeMap, directives) {
  const referenceTypeMap = Object.create(null);
  for (const typeName in originalTypeMap) {
    referenceTypeMap[typeName] = originalTypeMap[typeName];
  }
  const newTypeMap = Object.create(null);
  for (const typeName in referenceTypeMap) {
    const namedType = referenceTypeMap[typeName];
    if (namedType == null || typeName.startsWith('__')) {
      continue;
    }
    const newName = namedType.name;
    if (newName.startsWith('__')) {
      continue;
    }
    if (newTypeMap[newName] != null) {
      console.warn(`Duplicate schema type name ${newName} found; keeping the existing one found in the schema`);
      continue;
    }
    newTypeMap[newName] = namedType;
  }
  for (const typeName in newTypeMap) {
    newTypeMap[typeName] = rewireNamedType(newTypeMap[typeName]);
  }
  const newDirectives = directives.map(directive => rewireDirective(directive));
  return {
    typeMap: newTypeMap,
    directives: newDirectives,
  };
  function rewireDirective(directive) {
    if ((0,external_graphql_.isSpecifiedDirective)(directive)) {
      return directive;
    }
    const directiveConfig = directive.toConfig();
    directiveConfig.args = rewireArgs(directiveConfig.args);
    return new external_graphql_.GraphQLDirective(directiveConfig);
  }
  function rewireArgs(args) {
    const rewiredArgs = {};
    for (const argName in args) {
      const arg = args[argName];
      const rewiredArgType = rewireType(arg.type);
      if (rewiredArgType != null) {
        arg.type = rewiredArgType;
        rewiredArgs[argName] = arg;
      }
    }
    return rewiredArgs;
  }
  function rewireNamedType(type) {
    if ((0,external_graphql_.isObjectType)(type)) {
      const config = type.toConfig();
      const newConfig = {
        ...config,
        fields: () => rewireFields(config.fields),
        interfaces: () => rewireNamedTypes(config.interfaces),
      };
      return new external_graphql_.GraphQLObjectType(newConfig);
    } else if ((0,external_graphql_.isInterfaceType)(type)) {
      const config = type.toConfig();
      const newConfig = {
        ...config,
        fields: () => rewireFields(config.fields),
      };
      if ('interfaces' in newConfig) {
        newConfig.interfaces = () => rewireNamedTypes(config.interfaces);
      }
      return new external_graphql_.GraphQLInterfaceType(newConfig);
    } else if ((0,external_graphql_.isUnionType)(type)) {
      const config = type.toConfig();
      const newConfig = {
        ...config,
        types: () => rewireNamedTypes(config.types),
      };
      return new external_graphql_.GraphQLUnionType(newConfig);
    } else if ((0,external_graphql_.isInputObjectType)(type)) {
      const config = type.toConfig();
      const newConfig = {
        ...config,
        fields: () => rewireInputFields(config.fields),
      };
      return new external_graphql_.GraphQLInputObjectType(newConfig);
    } else if ((0,external_graphql_.isEnumType)(type)) {
      const enumConfig = type.toConfig();
      return new external_graphql_.GraphQLEnumType(enumConfig);
    } else if ((0,external_graphql_.isScalarType)(type)) {
      if ((0,external_graphql_.isSpecifiedScalarType)(type)) {
        return type;
      }
      const scalarConfig = type.toConfig();
      return new external_graphql_.GraphQLScalarType(scalarConfig);
    }
    throw new Error(`Unexpected schema type: ${type}`);
  }
  function rewireFields(fields) {
    const rewiredFields = {};
    for (const fieldName in fields) {
      const field = fields[fieldName];
      const rewiredFieldType = rewireType(field.type);
      if (rewiredFieldType != null && field.args) {
        field.type = rewiredFieldType;
        field.args = rewireArgs(field.args);
        rewiredFields[fieldName] = field;
      }
    }
    return rewiredFields;
  }
  function rewireInputFields(fields) {
    const rewiredFields = {};
    for (const fieldName in fields) {
      const field = fields[fieldName];
      const rewiredFieldType = rewireType(field.type);
      if (rewiredFieldType != null) {
        field.type = rewiredFieldType;
        rewiredFields[fieldName] = field;
      }
    }
    return rewiredFields;
  }
  function rewireNamedTypes(namedTypes) {
    const rewiredTypes = [];
    for (const namedType of namedTypes) {
      const rewiredType = rewireType(namedType);
      if (rewiredType != null) {
        rewiredTypes.push(rewiredType);
      }
    }
    return rewiredTypes;
  }
  function rewireType(type) {
    if ((0,external_graphql_.isListType)(type)) {
      const rewiredType = rewireType(type.ofType);
      return rewiredType != null ? new external_graphql_.GraphQLList(rewiredType) : null;
    } else if ((0,external_graphql_.isNonNullType)(type)) {
      const rewiredType = rewireType(type.ofType);
      return rewiredType != null ? new external_graphql_.GraphQLNonNull(rewiredType) : null;
    } else if ((0,external_graphql_.isNamedType)(type)) {
      let rewiredType = referenceTypeMap[type.name];
      if (rewiredType === undefined) {
        rewiredType = isNamedStub(type) ? getBuiltInForStub(type) : rewireNamedType(type);
        newTypeMap[rewiredType.name] = referenceTypeMap[type.name] = rewiredType;
      }
      return rewiredType != null ? newTypeMap[rewiredType.name] : null;
    }
    return null;
  }
}

;// ./codegen/utils/graphql-tools/helpers.js

const URL_REGEXP = /^(https?|wss?|file):\/\//;
/**
 * Checks if the given string is a valid URL.
 *
 * @param str - The string to validate as a URL
 * @returns A boolean indicating whether the string is a valid URL
 *
 * @remarks
 * This function first attempts to use the `URL.canParse` method if available.
 * If not, it falls back to creating a new `URL` object to validate the string.
 */
function isUrl(str) {
  if (typeof str !== 'string') {
    return false;
  }
  if (!URL_REGEXP.test(str)) {
    return false;
  }
  if (URL.canParse) {
    return URL.canParse(str);
  }
  try {
    const url = new URL(str);
    return !!url;
  } catch (e) {
    return false;
  }
}
const asArray = fns => (Array.isArray(fns) ? fns : fns ? [fns] : []);
const invalidDocRegex = /\.[a-z0-9]+$/i;
/**
 * Determines if a given input is a valid GraphQL document string.
 *
 * @param str - The input to validate as a GraphQL document
 * @returns A boolean indicating whether the input is a valid GraphQL document string
 *
 * @remarks
 * This function performs several validation checks:
 * - Ensures the input is a string
 * - Filters out strings with invalid document extensions
 * - Excludes URLs
 * - Attempts to parse the string as a GraphQL document
 *
 * @throws {Error} If the document fails to parse and is empty except GraphQL comments
 */
function isDocumentString(str) {
  if (typeof str !== 'string') {
    return false;
  }
  // XXX: is-valid-path or is-glob treat SDL as a valid path
  // (`scalar Date` for example)
  // this why checking the extension is fast enough
  // and prevent from parsing the string in order to find out
  // if the string is a SDL
  if (invalidDocRegex.test(str) || isUrl(str)) {
    return false;
  }
  try {
    parse(str);
    return true;
  } catch (e) {
    if (!e.message.includes('EOF') && str.replace(/(\#[^*]*)/g, '').trim() !== '' && str.includes(' ')) {
      throw new Error(`Failed to parse the GraphQL document. ${e.message}\n${str}`);
    }
  }
  return false;
}
const invalidPathRegex = /[‘“!%^<>`\n]/;
/**
 * Checkes whether the `str` contains any path illegal characters.
 *
 * A string may sometimes look like a path but is not (like an SDL of a simple
 * GraphQL schema). To make sure we don't yield false-positives in such cases,
 * we disallow new lines in paths (even though most Unix systems support new
 * lines in file names).
 */
function isValidPath(str) {
  return typeof str === 'string' && !invalidPathRegex.test(str);
}
function compareStrings(a, b) {
  if (String(a) < String(b)) {
    return -1;
  }
  if (String(a) > String(b)) {
    return 1;
  }
  return 0;
}
function nodeToString(a) {
  let name;
  if ('alias' in a) {
    name = a.alias?.value;
  }
  if (name == null && 'name' in a) {
    name = a.name?.value;
  }
  if (name == null) {
    name = a.kind;
  }
  return name;
}
function compareNodes(a, b, customFn) {
  const aStr = nodeToString(a);
  const bStr = nodeToString(b);
  if (typeof customFn === 'function') {
    return customFn(aStr, bStr);
  }
  return compareStrings(aStr, bStr);
}
function isSome(input) {
  return input != null;
}
function assertSome(input, message = 'Value should be something') {
  if (input == null) {
    throw new Error(message);
  }
}

;// ./codegen/utils/graphql-tools/transformInputValue.js


function transformInputValue(type, value, inputLeafValueTransformer = null, inputObjectValueTransformer = null) {
  if (value == null) {
    return value;
  }
  const nullableType = (0,external_graphql_.getNullableType)(type);
  if ((0,external_graphql_.isLeafType)(nullableType)) {
    return inputLeafValueTransformer != null ? inputLeafValueTransformer(nullableType, value) : value;
  } else if ((0,external_graphql_.isListType)(nullableType)) {
    return asArray(value).map(listMember =>
      transformInputValue(nullableType.ofType, listMember, inputLeafValueTransformer, inputObjectValueTransformer)
    );
  } else if ((0,external_graphql_.isInputObjectType)(nullableType)) {
    const fields = nullableType.getFields();
    const newValue = {};
    for (const key in value) {
      const field = fields[key];
      if (field != null) {
        newValue[key] = transformInputValue(
          field.type,
          value[key],
          inputLeafValueTransformer,
          inputObjectValueTransformer
        );
      }
    }
    return inputObjectValueTransformer != null ? inputObjectValueTransformer(nullableType, newValue) : newValue;
  }
  // unreachable, no other possible return value
}
function serializeInputValue(type, value) {
  return transformInputValue(type, value, (t, v) => {
    try {
      return t.serialize(v);
    } catch {
      return v;
    }
  });
}
function parseInputValue(type, value) {
  return transformInputValue(type, value, (t, v) => {
    try {
      return t.parseValue(v);
    } catch {
      return v;
    }
  });
}
function parseInputValueLiteral(type, value) {
  return transformInputValue(type, value, (t, v) => t.parseLiteral(v, {}));
}

;// ./codegen/utils/graphql-tools/mapSchema.js





function mapSchema(schema, schemaMapper = {}) {
  const newTypeMap = mapArguments(
    mapFields(
      mapTypes(
        mapDefaultValues(
          mapEnumValues(
            mapTypes(mapDefaultValues(schema.getTypeMap(), schema, serializeInputValue), schema, schemaMapper, type =>
              (0,external_graphql_.isLeafType)(type)
            ),
            schema,
            schemaMapper
          ),
          schema,
          parseInputValue
        ),
        schema,
        schemaMapper,
        type => !(0,external_graphql_.isLeafType)(type)
      ),
      schema,
      schemaMapper
    ),
    schema,
    schemaMapper
  );
  const originalDirectives = schema.getDirectives();
  const newDirectives = mapDirectives(originalDirectives, schema, schemaMapper);
  const { typeMap, directives } = rewireTypes(newTypeMap, newDirectives);
  return new external_graphql_.GraphQLSchema({
    ...schema.toConfig(),
    query: getObjectTypeFromTypeMap(typeMap, getObjectTypeFromTypeMap(newTypeMap, schema.getQueryType())),
    mutation: getObjectTypeFromTypeMap(typeMap, getObjectTypeFromTypeMap(newTypeMap, schema.getMutationType())),
    subscription: getObjectTypeFromTypeMap(typeMap, getObjectTypeFromTypeMap(newTypeMap, schema.getSubscriptionType())),
    types: Object.values(typeMap),
    directives,
  });
}
function mapTypes(originalTypeMap, schema, schemaMapper, testFn = () => true) {
  const newTypeMap = {};
  for (const typeName in originalTypeMap) {
    if (!typeName.startsWith('__')) {
      const originalType = originalTypeMap[typeName];
      if (originalType == null || !testFn(originalType)) {
        newTypeMap[typeName] = originalType;
        continue;
      }
      const typeMapper = getTypeMapper(schema, schemaMapper, typeName);
      if (typeMapper == null) {
        newTypeMap[typeName] = originalType;
        continue;
      }
      const maybeNewType = typeMapper(originalType, schema);
      if (maybeNewType === undefined) {
        newTypeMap[typeName] = originalType;
        continue;
      }
      newTypeMap[typeName] = maybeNewType;
    }
  }
  return newTypeMap;
}
function mapEnumValues(originalTypeMap, schema, schemaMapper) {
  const enumValueMapper = getEnumValueMapper(schemaMapper);
  if (!enumValueMapper) {
    return originalTypeMap;
  }
  return mapTypes(
    originalTypeMap,
    schema,
    {
      [MapperKind.ENUM_TYPE]: type => {
        const config = type.toConfig();
        const originalEnumValueConfigMap = config.values;
        const newEnumValueConfigMap = {};
        for (const externalValue in originalEnumValueConfigMap) {
          const originalEnumValueConfig = originalEnumValueConfigMap[externalValue];
          const mappedEnumValue = enumValueMapper(originalEnumValueConfig, type.name, schema, externalValue);
          if (mappedEnumValue === undefined) {
            newEnumValueConfigMap[externalValue] = originalEnumValueConfig;
          } else if (Array.isArray(mappedEnumValue)) {
            const [newExternalValue, newEnumValueConfig] = mappedEnumValue;
            newEnumValueConfigMap[newExternalValue] =
              newEnumValueConfig === undefined ? originalEnumValueConfig : newEnumValueConfig;
          } else if (mappedEnumValue !== null) {
            newEnumValueConfigMap[externalValue] = mappedEnumValue;
          }
        }
        return correctASTNodes(
          new external_graphql_.GraphQLEnumType({
            ...config,
            values: newEnumValueConfigMap,
          })
        );
      },
    },
    type => (0,external_graphql_.isEnumType)(type)
  );
}
function mapDefaultValues(originalTypeMap, schema, fn) {
  const newTypeMap = mapArguments(originalTypeMap, schema, {
    [MapperKind.ARGUMENT]: argumentConfig => {
      if (argumentConfig.defaultValue === undefined) {
        return argumentConfig;
      }
      const maybeNewType = getNewType(originalTypeMap, argumentConfig.type);
      if (maybeNewType != null) {
        return {
          ...argumentConfig,
          defaultValue: fn(maybeNewType, argumentConfig.defaultValue),
        };
      }
    },
  });
  return mapFields(newTypeMap, schema, {
    [MapperKind.INPUT_OBJECT_FIELD]: inputFieldConfig => {
      if (inputFieldConfig.defaultValue === undefined) {
        return inputFieldConfig;
      }
      const maybeNewType = getNewType(newTypeMap, inputFieldConfig.type);
      if (maybeNewType != null) {
        return {
          ...inputFieldConfig,
          defaultValue: fn(maybeNewType, inputFieldConfig.defaultValue),
        };
      }
    },
  });
}
function getNewType(newTypeMap, type) {
  if ((0,external_graphql_.isListType)(type)) {
    const newType = getNewType(newTypeMap, type.ofType);
    return newType != null ? new external_graphql_.GraphQLList(newType) : null;
  } else if ((0,external_graphql_.isNonNullType)(type)) {
    const newType = getNewType(newTypeMap, type.ofType);
    return newType != null ? new external_graphql_.GraphQLNonNull(newType) : null;
  } else if ((0,external_graphql_.isNamedType)(type)) {
    const newType = newTypeMap[type.name];
    return newType != null ? newType : null;
  }
  return null;
}
function mapFields(originalTypeMap, schema, schemaMapper) {
  const newTypeMap = {};
  for (const typeName in originalTypeMap) {
    if (!typeName.startsWith('__')) {
      const originalType = originalTypeMap[typeName];
      if (!(0,external_graphql_.isObjectType)(originalType) && !(0,external_graphql_.isInterfaceType)(originalType) && !(0,external_graphql_.isInputObjectType)(originalType)) {
        newTypeMap[typeName] = originalType;
        continue;
      }
      const fieldMapper = getFieldMapper(schema, schemaMapper, typeName);
      if (fieldMapper == null) {
        newTypeMap[typeName] = originalType;
        continue;
      }
      const config = originalType.toConfig();
      const originalFieldConfigMap = config.fields;
      const newFieldConfigMap = {};
      for (const fieldName in originalFieldConfigMap) {
        const originalFieldConfig = originalFieldConfigMap[fieldName];
        const mappedField = fieldMapper(originalFieldConfig, fieldName, typeName, schema);
        if (mappedField === undefined) {
          newFieldConfigMap[fieldName] = originalFieldConfig;
        } else if (Array.isArray(mappedField)) {
          const [newFieldName, newFieldConfig] = mappedField;
          if (newFieldConfig.astNode != null) {
            newFieldConfig.astNode = {
              ...newFieldConfig.astNode,
              name: {
                ...newFieldConfig.astNode.name,
                value: newFieldName,
              },
            };
          }
          newFieldConfigMap[newFieldName] = newFieldConfig === undefined ? originalFieldConfig : newFieldConfig;
        } else if (mappedField !== null) {
          newFieldConfigMap[fieldName] = mappedField;
        }
      }
      if ((0,external_graphql_.isObjectType)(originalType)) {
        newTypeMap[typeName] = correctASTNodes(
          new external_graphql_.GraphQLObjectType({
            ...config,
            fields: newFieldConfigMap,
          })
        );
      } else if ((0,external_graphql_.isInterfaceType)(originalType)) {
        newTypeMap[typeName] = correctASTNodes(
          new external_graphql_.GraphQLInterfaceType({
            ...config,
            fields: newFieldConfigMap,
          })
        );
      } else {
        newTypeMap[typeName] = correctASTNodes(
          new external_graphql_.GraphQLInputObjectType({
            ...config,
            fields: newFieldConfigMap,
          })
        );
      }
    }
  }
  return newTypeMap;
}
function mapArguments(originalTypeMap, schema, schemaMapper) {
  const newTypeMap = {};
  for (const typeName in originalTypeMap) {
    if (!typeName.startsWith('__')) {
      const originalType = originalTypeMap[typeName];
      if (!(0,external_graphql_.isObjectType)(originalType) && !(0,external_graphql_.isInterfaceType)(originalType)) {
        newTypeMap[typeName] = originalType;
        continue;
      }
      const argumentMapper = getArgumentMapper(schemaMapper);
      if (argumentMapper == null) {
        newTypeMap[typeName] = originalType;
        continue;
      }
      const config = originalType.toConfig();
      const originalFieldConfigMap = config.fields;
      const newFieldConfigMap = {};
      for (const fieldName in originalFieldConfigMap) {
        const originalFieldConfig = originalFieldConfigMap[fieldName];
        const originalArgumentConfigMap = originalFieldConfig.args;
        if (originalArgumentConfigMap == null) {
          newFieldConfigMap[fieldName] = originalFieldConfig;
          continue;
        }
        const argumentNames = Object.keys(originalArgumentConfigMap);
        if (!argumentNames.length) {
          newFieldConfigMap[fieldName] = originalFieldConfig;
          continue;
        }
        const newArgumentConfigMap = {};
        for (const argumentName of argumentNames) {
          const originalArgumentConfig = originalArgumentConfigMap[argumentName];
          const mappedArgument = argumentMapper(originalArgumentConfig, fieldName, typeName, schema);
          if (mappedArgument === undefined) {
            newArgumentConfigMap[argumentName] = originalArgumentConfig;
          } else if (Array.isArray(mappedArgument)) {
            const [newArgumentName, newArgumentConfig] = mappedArgument;
            newArgumentConfigMap[newArgumentName] = newArgumentConfig;
          } else if (mappedArgument !== null) {
            newArgumentConfigMap[argumentName] = mappedArgument;
          }
        }
        newFieldConfigMap[fieldName] = {
          ...originalFieldConfig,
          args: newArgumentConfigMap,
        };
      }
      if ((0,external_graphql_.isObjectType)(originalType)) {
        newTypeMap[typeName] = new external_graphql_.GraphQLObjectType({
          ...config,
          fields: newFieldConfigMap,
        });
      } else if ((0,external_graphql_.isInterfaceType)(originalType)) {
        newTypeMap[typeName] = new external_graphql_.GraphQLInterfaceType({
          ...config,
          fields: newFieldConfigMap,
        });
      } else {
        newTypeMap[typeName] = new external_graphql_.GraphQLInputObjectType({
          ...config,
          fields: newFieldConfigMap,
        });
      }
    }
  }
  return newTypeMap;
}
function mapDirectives(originalDirectives, schema, schemaMapper) {
  const directiveMapper = getDirectiveMapper(schemaMapper);
  if (directiveMapper == null) {
    return originalDirectives.slice();
  }
  const newDirectives = [];
  for (const directive of originalDirectives) {
    const mappedDirective = directiveMapper(directive, schema);
    if (mappedDirective === undefined) {
      newDirectives.push(directive);
    } else if (mappedDirective !== null) {
      newDirectives.push(mappedDirective);
    }
  }
  return newDirectives;
}
function getTypeSpecifiers(schema, typeName) {
  const type = schema.getType(typeName);
  const specifiers = [MapperKind.TYPE];
  if ((0,external_graphql_.isObjectType)(type)) {
    specifiers.push(MapperKind.COMPOSITE_TYPE, MapperKind.OBJECT_TYPE);
    if (typeName === schema.getQueryType()?.name) {
      specifiers.push(MapperKind.ROOT_OBJECT, MapperKind.QUERY);
    } else if (typeName === schema.getMutationType()?.name) {
      specifiers.push(MapperKind.ROOT_OBJECT, MapperKind.MUTATION);
    } else if (typeName === schema.getSubscriptionType()?.name) {
      specifiers.push(MapperKind.ROOT_OBJECT, MapperKind.SUBSCRIPTION);
    }
  } else if ((0,external_graphql_.isInputObjectType)(type)) {
    specifiers.push(MapperKind.INPUT_OBJECT_TYPE);
  } else if ((0,external_graphql_.isInterfaceType)(type)) {
    specifiers.push(MapperKind.COMPOSITE_TYPE, MapperKind.ABSTRACT_TYPE, MapperKind.INTERFACE_TYPE);
  } else if ((0,external_graphql_.isUnionType)(type)) {
    specifiers.push(MapperKind.COMPOSITE_TYPE, MapperKind.ABSTRACT_TYPE, MapperKind.UNION_TYPE);
  } else if ((0,external_graphql_.isEnumType)(type)) {
    specifiers.push(MapperKind.ENUM_TYPE);
  } else if ((0,external_graphql_.isScalarType)(type)) {
    specifiers.push(MapperKind.SCALAR_TYPE);
  }
  return specifiers;
}
function getTypeMapper(schema, schemaMapper, typeName) {
  const specifiers = getTypeSpecifiers(schema, typeName);
  let typeMapper;
  const stack = [...specifiers];
  while (!typeMapper && stack.length > 0) {
    // It is safe to use the ! operator here as we check the length.
    const next = stack.pop();
    typeMapper = schemaMapper[next];
  }
  return typeMapper != null ? typeMapper : null;
}
function getFieldSpecifiers(schema, typeName) {
  const type = schema.getType(typeName);
  const specifiers = [MapperKind.FIELD];
  if ((0,external_graphql_.isObjectType)(type)) {
    specifiers.push(MapperKind.COMPOSITE_FIELD, MapperKind.OBJECT_FIELD);
    if (typeName === schema.getQueryType()?.name) {
      specifiers.push(MapperKind.ROOT_FIELD, MapperKind.QUERY_ROOT_FIELD);
    } else if (typeName === schema.getMutationType()?.name) {
      specifiers.push(MapperKind.ROOT_FIELD, MapperKind.MUTATION_ROOT_FIELD);
    } else if (typeName === schema.getSubscriptionType()?.name) {
      specifiers.push(MapperKind.ROOT_FIELD, MapperKind.SUBSCRIPTION_ROOT_FIELD);
    }
  } else if ((0,external_graphql_.isInterfaceType)(type)) {
    specifiers.push(MapperKind.COMPOSITE_FIELD, MapperKind.INTERFACE_FIELD);
  } else if ((0,external_graphql_.isInputObjectType)(type)) {
    specifiers.push(MapperKind.INPUT_OBJECT_FIELD);
  }
  return specifiers;
}
function getFieldMapper(schema, schemaMapper, typeName) {
  const specifiers = getFieldSpecifiers(schema, typeName);
  let fieldMapper;
  const stack = [...specifiers];
  while (!fieldMapper && stack.length > 0) {
    // It is safe to use the ! operator here as we check the length.
    const next = stack.pop();
    // TODO: fix this as unknown cast
    fieldMapper = schemaMapper[next];
  }
  return fieldMapper ?? null;
}
function getArgumentMapper(schemaMapper) {
  const argumentMapper = schemaMapper[MapperKind.ARGUMENT];
  return argumentMapper != null ? argumentMapper : null;
}
function getDirectiveMapper(schemaMapper) {
  const directiveMapper = schemaMapper[MapperKind.DIRECTIVE];
  return directiveMapper != null ? directiveMapper : null;
}
function getEnumValueMapper(schemaMapper) {
  const enumValueMapper = schemaMapper[MapperKind.ENUM_VALUE];
  return enumValueMapper != null ? enumValueMapper : null;
}
function correctASTNodes(type) {
  if ((0,external_graphql_.isObjectType)(type)) {
    const config = type.toConfig();
    if (config.astNode != null) {
      const fields = [];
      for (const fieldName in config.fields) {
        const fieldConfig = config.fields[fieldName];
        if (fieldConfig.astNode != null) {
          fields.push(fieldConfig.astNode);
        }
      }
      config.astNode = {
        ...config.astNode,
        kind: external_graphql_.Kind.OBJECT_TYPE_DEFINITION,
        fields,
      };
    }
    if (config.extensionASTNodes != null) {
      config.extensionASTNodes = config.extensionASTNodes.map(node => ({
        ...node,
        kind: external_graphql_.Kind.OBJECT_TYPE_EXTENSION,
        fields: undefined,
      }));
    }
    return new external_graphql_.GraphQLObjectType(config);
  } else if ((0,external_graphql_.isInterfaceType)(type)) {
    const config = type.toConfig();
    if (config.astNode != null) {
      const fields = [];
      for (const fieldName in config.fields) {
        const fieldConfig = config.fields[fieldName];
        if (fieldConfig.astNode != null) {
          fields.push(fieldConfig.astNode);
        }
      }
      config.astNode = {
        ...config.astNode,
        kind: external_graphql_.Kind.INTERFACE_TYPE_DEFINITION,
        fields,
      };
    }
    if (config.extensionASTNodes != null) {
      config.extensionASTNodes = config.extensionASTNodes.map(node => ({
        ...node,
        kind: external_graphql_.Kind.INTERFACE_TYPE_EXTENSION,
        fields: undefined,
      }));
    }
    return new external_graphql_.GraphQLInterfaceType(config);
  } else if ((0,external_graphql_.isInputObjectType)(type)) {
    const config = type.toConfig();
    if (config.astNode != null) {
      const fields = [];
      for (const fieldName in config.fields) {
        const fieldConfig = config.fields[fieldName];
        if (fieldConfig.astNode != null) {
          fields.push(fieldConfig.astNode);
        }
      }
      config.astNode = {
        ...config.astNode,
        kind: external_graphql_.Kind.INPUT_OBJECT_TYPE_DEFINITION,
        fields,
      };
    }
    if (config.extensionASTNodes != null) {
      config.extensionASTNodes = config.extensionASTNodes.map(node => ({
        ...node,
        kind: external_graphql_.Kind.INPUT_OBJECT_TYPE_EXTENSION,
        fields: undefined,
      }));
    }
    return new external_graphql_.GraphQLInputObjectType(config);
  } else if ((0,external_graphql_.isEnumType)(type)) {
    const config = type.toConfig();
    if (config.astNode != null) {
      const values = [];
      for (const enumKey in config.values) {
        const enumValueConfig = config.values[enumKey];
        if (enumValueConfig.astNode != null) {
          values.push(enumValueConfig.astNode);
        }
      }
      config.astNode = {
        ...config.astNode,
        values,
      };
    }
    if (config.extensionASTNodes != null) {
      config.extensionASTNodes = config.extensionASTNodes.map(node => ({
        ...node,
        values: undefined,
      }));
    }
    return new external_graphql_.GraphQLEnumType(config);
  } else {
    return type;
  }
}

;// ./codegen/utils/graphql-tools/get-implementing-types.js

function getImplementingTypes(interfaceName, schema) {
  const allTypesMap = schema.getTypeMap();
  const result = [];
  for (const graphqlTypeName in allTypesMap) {
    const graphqlType = allTypesMap[graphqlTypeName];
    if ((0,external_graphql_.isObjectType)(graphqlType)) {
      const allInterfaces = graphqlType.getInterfaces();
      if (allInterfaces.find(int => int.name === interfaceName)) {
        result.push(graphqlType.name);
      }
    }
  }
  return result;
}

;// ./codegen/utils/graphql-tools/errors.js

const possibleGraphQLErrorProperties = (/* unused pure expression or super */ null && ([
  'message',
  'locations',
  'path',
  'nodes',
  'source',
  'positions',
  'originalError',
  'name',
  'stack',
  'extensions',
]));
function isGraphQLErrorLike(error) {
  return (
    error != null &&
    typeof error === 'object' &&
    Object.keys(error).every(key => possibleGraphQLErrorProperties.includes(key))
  );
}
function errors_createGraphQLError(message, options) {
  if (
    options?.originalError &&
    !(options.originalError instanceof Error) &&
    isGraphQLErrorLike(options.originalError)
  ) {
    options.originalError = errors_createGraphQLError(options.originalError.message, options.originalError);
  }
  if (versionInfo.major >= 17) {
    return new GraphQLError(message, options);
  }
  return new GraphQLError(
    message,
    options?.nodes,
    options?.source,
    options?.positions,
    options?.path,
    options?.originalError,
    options?.extensions
  );
}
function relocatedError(originalError, path) {
  return errors_createGraphQLError(originalError.message, {
    nodes: originalError.nodes,
    source: originalError.source,
    positions: originalError.positions,
    path: path == null ? originalError.path : path,
    originalError,
    extensions: originalError.extensions,
  });
}

;// ./codegen/utils/graphql-tools/memoize.js
function memoize1(fn) {
  const memoize1cache = new WeakMap();
  return function memoized(a1) {
    const cachedValue = memoize1cache.get(a1);
    if (cachedValue === undefined) {
      const newValue = fn(a1);
      memoize1cache.set(a1, newValue);
      return newValue;
    }
    return cachedValue;
  };
}
function memoize2(fn) {
  const memoize2cache = new WeakMap();
  return function memoized(a1, a2) {
    let cache2 = memoize2cache.get(a1);
    if (!cache2) {
      cache2 = new WeakMap();
      memoize2cache.set(a1, cache2);
      const newValue = fn(a1, a2);
      cache2.set(a2, newValue);
      return newValue;
    }
    const cachedValue = cache2.get(a2);
    if (cachedValue === undefined) {
      const newValue = fn(a1, a2);
      cache2.set(a2, newValue);
      return newValue;
    }
    return cachedValue;
  };
}
function memoize3(fn) {
  const memoize3Cache = new WeakMap();
  return function memoized(a1, a2, a3) {
    let cache2 = memoize3Cache.get(a1);
    if (!cache2) {
      cache2 = new WeakMap();
      memoize3Cache.set(a1, cache2);
      const cache3 = new WeakMap();
      cache2.set(a2, cache3);
      const newValue = fn(a1, a2, a3);
      cache3.set(a3, newValue);
      return newValue;
    }
    let cache3 = cache2.get(a2);
    if (!cache3) {
      cache3 = new WeakMap();
      cache2.set(a2, cache3);
      const newValue = fn(a1, a2, a3);
      cache3.set(a3, newValue);
      return newValue;
    }
    const cachedValue = cache3.get(a3);
    if (cachedValue === undefined) {
      const newValue = fn(a1, a2, a3);
      cache3.set(a3, newValue);
      return newValue;
    }
    return cachedValue;
  };
}
function memoize4(fn) {
  const memoize4Cache = new WeakMap();
  return function memoized(a1, a2, a3, a4) {
    let cache2 = memoize4Cache.get(a1);
    if (!cache2) {
      cache2 = new WeakMap();
      memoize4Cache.set(a1, cache2);
      const cache3 = new WeakMap();
      cache2.set(a2, cache3);
      const cache4 = new WeakMap();
      cache3.set(a3, cache4);
      const newValue = fn(a1, a2, a3, a4);
      cache4.set(a4, newValue);
      return newValue;
    }
    let cache3 = cache2.get(a2);
    if (!cache3) {
      cache3 = new WeakMap();
      cache2.set(a2, cache3);
      const cache4 = new WeakMap();
      cache3.set(a3, cache4);
      const newValue = fn(a1, a2, a3, a4);
      cache4.set(a4, newValue);
      return newValue;
    }
    const cache4 = cache3.get(a3);
    if (!cache4) {
      const cache4 = new WeakMap();
      cache3.set(a3, cache4);
      const newValue = fn(a1, a2, a3, a4);
      cache4.set(a4, newValue);
      return newValue;
    }
    const cachedValue = cache4.get(a4);
    if (cachedValue === undefined) {
      const newValue = fn(a1, a2, a3, a4);
      cache4.set(a4, newValue);
      return newValue;
    }
    return cachedValue;
  };
}
function memoize5(fn) {
  const memoize5Cache = new WeakMap();
  return function memoized(a1, a2, a3, a4, a5) {
    let cache2 = memoize5Cache.get(a1);
    if (!cache2) {
      cache2 = new WeakMap();
      memoize5Cache.set(a1, cache2);
      const cache3 = new WeakMap();
      cache2.set(a2, cache3);
      const cache4 = new WeakMap();
      cache3.set(a3, cache4);
      const cache5 = new WeakMap();
      cache4.set(a4, cache5);
      const newValue = fn(a1, a2, a3, a4, a5);
      cache5.set(a5, newValue);
      return newValue;
    }
    let cache3 = cache2.get(a2);
    if (!cache3) {
      cache3 = new WeakMap();
      cache2.set(a2, cache3);
      const cache4 = new WeakMap();
      cache3.set(a3, cache4);
      const cache5 = new WeakMap();
      cache4.set(a4, cache5);
      const newValue = fn(a1, a2, a3, a4, a5);
      cache5.set(a5, newValue);
      return newValue;
    }
    let cache4 = cache3.get(a3);
    if (!cache4) {
      cache4 = new WeakMap();
      cache3.set(a3, cache4);
      const cache5 = new WeakMap();
      cache4.set(a4, cache5);
      const newValue = fn(a1, a2, a3, a4, a5);
      cache5.set(a5, newValue);
      return newValue;
    }
    let cache5 = cache4.get(a4);
    if (!cache5) {
      cache5 = new WeakMap();
      cache4.set(a4, cache5);
      const newValue = fn(a1, a2, a3, a4, a5);
      cache5.set(a5, newValue);
      return newValue;
    }
    const cachedValue = cache5.get(a5);
    if (cachedValue === undefined) {
      const newValue = fn(a1, a2, a3, a4, a5);
      cache5.set(a5, newValue);
      return newValue;
    }
    return cachedValue;
  };
}
function memoize2of4(fn) {
  const memoize2of4cache = new WeakMap();
  return function memoized(a1, a2, a3, a4) {
    let cache2 = memoize2of4cache.get(a1);
    if (!cache2) {
      cache2 = new WeakMap();
      memoize2of4cache.set(a1, cache2);
      const newValue = fn(a1, a2, a3, a4);
      cache2.set(a2, newValue);
      return newValue;
    }
    const cachedValue = cache2.get(a2);
    if (cachedValue === undefined) {
      const newValue = fn(a1, a2, a3, a4);
      cache2.set(a2, newValue);
      return newValue;
    }
    return cachedValue;
  };
}
function memoize2of5(fn) {
  const memoize2of4cache = new WeakMap();
  return function memoized(a1, a2, a3, a4, a5) {
    let cache2 = memoize2of4cache.get(a1);
    if (!cache2) {
      cache2 = new WeakMap();
      memoize2of4cache.set(a1, cache2);
      const newValue = fn(a1, a2, a3, a4, a5);
      cache2.set(a2, newValue);
      return newValue;
    }
    const cachedValue = cache2.get(a2);
    if (cachedValue === undefined) {
      const newValue = fn(a1, a2, a3, a4, a5);
      cache2.set(a2, newValue);
      return newValue;
    }
    return cachedValue;
  };
}

;// ./codegen/utils/graphql-tools/rootTypes.js


function getDefinedRootType(schema, operation, nodes) {
  const rootTypeMap = getRootTypeMap(schema);
  const rootType = rootTypeMap.get(operation);
  if (rootType == null) {
    throw createGraphQLError(`Schema is not configured to execute ${operation} operation.`, {
      nodes,
    });
  }
  return rootType;
}
const getRootTypeNames = memoize1(function getRootTypeNames(schema) {
  const rootTypes = getRootTypes(schema);
  return new Set([...rootTypes].map(type => type.name));
});
const getRootTypes = memoize1(function getRootTypes(schema) {
  const rootTypeMap = getRootTypeMap(schema);
  return new Set(rootTypeMap.values());
});
const getRootTypeMap = memoize1(function getRootTypeMap(schema) {
  const rootTypeMap = new Map();
  const queryType = schema.getQueryType();
  if (queryType) {
    rootTypeMap.set('query', queryType);
  }
  const mutationType = schema.getMutationType();
  if (mutationType) {
    rootTypeMap.set('mutation', mutationType);
  }
  const subscriptionType = schema.getSubscriptionType();
  if (subscriptionType) {
    rootTypeMap.set('subscription', subscriptionType);
  }
  return rootTypeMap;
});

;// ./codegen/utils/constants.js
// used to remove all types that are not related to requested game, but implement Ngf interface
const CommonNgfInterfacesPrefix = 'Ngf';

;// ./codegen/utils/graphql-tools/prune.js







/**
 * Prunes the provided schema, removing unused and empty types
 * @param schema The schema to prune
 * @param options Additional options for removing unused types from the schema
 */
function pruneSchema(schema, options = {}) {
  const {
    skipEmptyCompositeTypePruning,
    skipEmptyUnionPruning,
    skipPruning,
    skipUnimplementedInterfacesPruning,
    skipUnusedTypesPruning,
  } = options;
  let prunedTypes = []; // Pruned types during mapping
  let prunedSchema = schema;
  do {
    let visited = visitSchema(prunedSchema);
    // Custom pruning  was defined, so we need to pre-emptively revisit the schema accounting for this
    if (skipPruning) {
      const revisit = [];
      for (const typeName in prunedSchema.getTypeMap()) {
        if (typeName.startsWith('__')) {
          continue;
        }
        const type = prunedSchema.getType(typeName);
        // if we want to skip pruning for this type, add it to the list of types to revisit
        if (type && skipPruning(type)) {
          revisit.push(typeName);
        }
      }
      visited = visitQueue(revisit, prunedSchema, visited); // visit again
    }
    prunedTypes = [];
    prunedSchema = mapSchema(prunedSchema, {
      [MapperKind.TYPE]: type => {
        if (!visited.has(type.name) && !(0,external_graphql_.isSpecifiedScalarType)(type)) {
          if (
            (0,external_graphql_.isUnionType)(type) ||
            (0,external_graphql_.isInputObjectType)(type) ||
            (0,external_graphql_.isInterfaceType)(type) ||
            (0,external_graphql_.isObjectType)(type) ||
            (0,external_graphql_.isScalarType)(type)
          ) {
            // skipUnusedTypesPruning: skip pruning unused types
            if (skipUnusedTypesPruning) {
              return type;
            }
            // skipEmptyUnionPruning: skip pruning empty unions
            if ((0,external_graphql_.isUnionType)(type) && skipEmptyUnionPruning && !Object.keys(type.getTypes()).length) {
              return type;
            }
            if ((0,external_graphql_.isInputObjectType)(type) || (0,external_graphql_.isInterfaceType)(type) || (0,external_graphql_.isObjectType)(type)) {
              // skipEmptyCompositeTypePruning: skip pruning object types or interfaces with no fields
              if (skipEmptyCompositeTypePruning && !Object.keys(type.getFields()).length) {
                return type;
              }
            }
            // skipUnimplementedInterfacesPruning: skip pruning interfaces that are not implemented by any other types
            if ((0,external_graphql_.isInterfaceType)(type) && skipUnimplementedInterfacesPruning) {
              return type;
            }
          }
          prunedTypes.push(type.name);
          visited.delete(type.name);
          return null;
        }
        return type;
      },
    });
  } while (prunedTypes.length); // Might have empty types and need to prune again
  return prunedSchema;
}
function visitSchema(schema) {
  const queue = []; // queue of nodes to visit
  // Grab the root types and start there
  for (const type of getRootTypes(schema)) {
    queue.push(type.name);
  }
  return visitQueue(queue, schema);
}
function visitQueue(queue, schema, visited = new Set()) {
  // Interfaces encountered that are field return types need to be revisited to add their implementations
  const revisit = new Map();
  // Navigate all types starting with pre-queued types (root types)
  while (queue.length) {
    const typeName = queue.pop();
    // Skip types we already visited unless it is an interface type that needs revisiting
    if (visited.has(typeName) && revisit[typeName] !== true) {
      continue;
    }
    const type = schema.getType(typeName);
    if (type) {
      // Get types for union
      if ((0,external_graphql_.isUnionType)(type)) {
        queue.push(...type.getTypes().map(type => type.name));
      }
      // If it is an interface and it is a returned type, grab all implementations so we can use proper __typename in fragments
      if ((0,external_graphql_.isInterfaceType)(type) && revisit[typeName] === true) {
        if (!type.name.startsWith(CommonNgfInterfacesPrefix)) {
          queue.push(...getImplementingTypes(type.name, schema));
        }
        // No need to revisit this interface again
        revisit[typeName] = false;
      }
      if ((0,external_graphql_.isEnumType)(type)) {
        // Visit enum values directives argument types
        queue.push(...type.getValues().flatMap(value => getDirectivesArgumentsTypeNames(schema, value)));
      }
      // Visit interfaces this type is implementing if they haven't been visited yet
      if ('getInterfaces' in type) {
        // Only pushes to queue to visit but not return types
        queue.push(...type.getInterfaces().map(iface => iface.name));
      }
      // If the type has fields visit those field types
      if ('getFields' in type) {
        const fields = type.getFields();
        const entries = Object.entries(fields);
        if (!entries.length) {
          continue;
        }
        for (const [, field] of entries) {
          if ((0,external_graphql_.isObjectType)(type)) {
            // Visit arg types and arg directives arguments types
            queue.push(
              ...field.args.flatMap(arg => {
                const typeNames = [(0,external_graphql_.getNamedType)(arg.type).name];
                typeNames.push(...getDirectivesArgumentsTypeNames(schema, arg));
                return typeNames;
              })
            );
          }
          const namedType = (0,external_graphql_.getNamedType)(field.type);
          queue.push(namedType.name);
          queue.push(...getDirectivesArgumentsTypeNames(schema, field));
          // Interfaces returned on fields need to be revisited to add their implementations
          if ((0,external_graphql_.isInterfaceType)(namedType) && !(namedType.name in revisit)) {
            revisit[namedType.name] = true;
          }
        }
      }
      queue.push(...getDirectivesArgumentsTypeNames(schema, type));
      visited.add(typeName); // Mark as visited (and therefore it is used and should be kept)
    }
  }
  return visited;
}
function getDirectivesArgumentsTypeNames(schema, directableObj) {
  const argTypeNames = new Set();
  if (directableObj.astNode?.directives) {
    for (const directiveNode of directableObj.astNode.directives) {
      const directive = schema.getDirective(directiveNode.name.value);
      if (directive?.args) {
        for (const arg of directive.args) {
          const argType = (0,external_graphql_.getNamedType)(arg.type);
          argTypeNames.add(argType.name);
        }
      }
    }
  }
  if (directableObj.extensions?.['directives']) {
    for (const directiveName in directableObj.extensions['directives']) {
      const directive = schema.getDirective(directiveName);
      if (directive?.args) {
        for (const arg of directive.args) {
          const argType = (0,external_graphql_.getNamedType)(arg.type);
          argTypeNames.add(argType.name);
        }
      }
    }
  }
  return [...argTypeNames];
}

;// ./codegen/utils/clean-schema-by-game.js





const getCleanedSchemaByGame = ({ includedScopes, staticDataFieldName, scopesData, options = {} }) => {
  const { queryNamespaces, mutationNamespaces, subscriptionNamespaces, targetGameQueryFields, targetGameQueryTypeName } = scopesData;
  const queriesToRemove = queryNamespaces.filter(queryName => !includedScopes.includes(queryName));

  const cleanUpSchema = (schemaString) => {
    const fullFederatedSchema = (0,external_graphql_.buildSchema)((0,external_node_fs_namespaceObject.readFileSync)(schemaString, 'utf8'));

    const microfiber = new external_microfiber_namespaceObject.Microfiber((0,external_graphql_.introspectionFromSchema)(fullFederatedSchema));

    // remove top level nodes from other scopes - queries, mutations, subscriptions
    queriesToRemove.forEach(name => {
      microfiber.removeQuery({
        name,
        cleanup: false,
      });
    });
    mutationNamespaces.forEach(name => {
      microfiber.removeMutation({
        name,
        cleanup: false,
      });
    });
    subscriptionNamespaces.forEach(name => {
      microfiber.removeSubscription({
        name,
        cleanup: false,
      });
    });

    if (targetGameQueryTypeName && targetGameQueryFields.length > 0) {
      const fieldsToRemoveFromQuery = targetGameQueryFields.filter(field => field !== staticDataFieldName);

      fieldsToRemoveFromQuery.forEach(name => {
        microfiber.removeField({
          typeKind: 'OBJECT',
          typeName: targetGameQueryTypeName,
          fieldName: name,
          cleanup: false,
        });
      });
    }

    microfiber.cleanSchema();

    const cleanedSchema = (0,external_graphql_.buildClientSchema)(microfiber.getResponse());

    // remove rest orphan types
    return pruneSchema(cleanedSchema, options);
  };

  return cleanUpSchema;
};


/***/ }),

/***/ 5419:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateQuery = generateQuery;
const run_cursor_generation_1 = __webpack_require__(5550);
const path_1 = __importDefault(__webpack_require__(6928));
async function generateQuery(options) {
    const { timeoutMs } = options;
    const promptFilePath = path_1.default.resolve(__dirname, 'generate-query.md');
    return await (0, run_cursor_generation_1.runCursorGeneration)({
        timeoutMs,
        prompt: `"Implement instructions in the file ${promptFilePath}"`,
    });
}


/***/ }),

/***/ 5550:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.runCursorGeneration = runCursorGeneration;
const core = __importStar(__webpack_require__(7157));
const exec_utils_1 = __webpack_require__(9099);
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
            throw new Error('CURSOR_API_KEY environment variable is not set');
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
            const errorMessage = `Failed to execute cursor-agent: ${error instanceof Error ? error.message : String(error)}`;
            if (error instanceof Error && error.message === exec_utils_1.TimeoutError) {
                core.setFailed(`cursor-agent execution timed out after ${timeoutMs}ms`);
            }
            else {
                core.setFailed(errorMessage);
            }
            throw new Error(errorMessage);
        }
    }
    catch (error) {
        const errorMessage = `Failed to execute cursor-agent: ${error instanceof Error ? error.message : String(error)}`;
        core.setFailed(errorMessage);
        throw new Error(errorMessage);
    }
}


/***/ }),

/***/ 6058:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.checkSchemaVersion = checkSchemaVersion;
const core = __importStar(__webpack_require__(6977));
const version_folder_utils_1 = __webpack_require__(7924);
const headers = {
    'xmoba-no-cache': '1',
    'Content-Type': 'application/json',
};
async function fetchSchemaVersionFromGraphQL(endpoint, game) {
    const query = `
    query {
      ${game} {
        staticData {
          metadata {
            schemaVersion
          }
        }
      }
    }
  `;
    core.info(`Fetching schema version from GraphQL endpoint: ${endpoint}`);
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                query,
                variables: {},
            }),
        });
        if (!response.ok) {
            throw new Error(`GraphQL request failed with status ${response.status}: ${response.statusText}`);
        }
        const result = (await response.json());
        if (result.errors) {
            throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
        }
        const schemaVersion = result.data?.[game]?.staticData?.metadata?.schemaVersion;
        if (!schemaVersion) {
            throw new Error(`Schema version not found in GraphQL response: ${JSON.stringify(result.data)}`);
        }
        core.info(`✓ Current schema version from GraphQL: ${schemaVersion}`);
        return schemaVersion;
    }
    catch (error) {
        core.setFailed(`Failed to fetch schema version from GraphQL: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}
async function downloadConfigFromBucket(bucket, env, game) {
    const configPath = `dynamic-modules/${env}/${game}/static-data-query/config.json`;
    const bucketName = bucket.name;
    core.info(`Downloading config.json from gs://${bucketName}/${configPath}`);
    try {
        const file = bucket.file(configPath);
        // Download file
        const [fileContents] = await file.download();
        const configJson = JSON.parse(fileContents.toString('utf-8'));
        if (!configJson.schemaVersion) {
            core.warning(`Config file exists but does not contain schemaVersion field`);
            return null;
        }
        core.info(`✓ Existing schema version from config.json: ${configJson.schemaVersion}`);
        return { schemaVersion: configJson.schemaVersion };
    }
    catch (error) {
        // Handle 404 (file not found) as a normal case
        if (error?.code === 404 || error?.message?.includes('No such object')) {
            core.info(`Config file not found at gs://${bucketName}/${configPath}, continuing pipeline`);
            return null;
        }
        // For other errors, log warning but continue
        core.warning(`Failed to download config.json: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}
async function checkSchemaVersion(options) {
    try {
        const { graphqlEndpoint, bucket, env, game } = options;
        core.info(`Checking schema version for game: ${game}`);
        // Execute GraphQL query and GCS download in parallel
        const [currentSchemaVersion, existingConfig] = await Promise.all([
            fetchSchemaVersionFromGraphQL(graphqlEndpoint, game),
            downloadConfigFromBucket(bucket, env, game),
        ]);
        // Check if version folder already exists
        if (currentSchemaVersion) {
            const versionFolderExists = await (0, version_folder_utils_1.checkVersionFolderExists)(bucket, env, game, currentSchemaVersion);
            if (versionFolderExists) {
                const bucketName = bucket.name;
                const versionFolderPath = (0, version_folder_utils_1.buildVersionFolderPath)(env, game, currentSchemaVersion);
                core.info(`✓ Version folder already exists at gs://${bucketName}/${versionFolderPath}. Pipeline will be skipped.`);
                return {
                    shouldContinue: false,
                    currentSchemaVersion,
                    existingSchemaVersion: existingConfig?.schemaVersion,
                };
            }
        }
        // If config file doesn't exist, continue pipeline
        if (!existingConfig) {
            core.info(`No existing config found, continuing pipeline`);
            return {
                shouldContinue: true,
                currentSchemaVersion,
            };
        }
        const existingSchemaVersion = existingConfig.schemaVersion;
        // If we can't get schema version from the endpoint, pipeline should be stopped
        if (!currentSchemaVersion) {
            core.info(`Schema versions can't be fetched. Pipeline will be skipped.`);
            return {
                shouldContinue: false,
                currentSchemaVersion,
                existingSchemaVersion,
            };
        }
        // Compare versions
        if (currentSchemaVersion === existingSchemaVersion) {
            core.info(`✓ Schema versions match (${currentSchemaVersion}). Pipeline will be skipped.`);
            return {
                shouldContinue: false,
                currentSchemaVersion,
                existingSchemaVersion,
            };
        }
        core.info(`Schema versions differ: current=${currentSchemaVersion}, existing=${existingSchemaVersion}. Continuing pipeline.`);
        return {
            shouldContinue: true,
            currentSchemaVersion,
            existingSchemaVersion,
        };
    }
    catch (error) {
        // GraphQL errors should fail the pipeline
        core.setFailed(`Error in checkSchemaVersion: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}


/***/ }),

/***/ 6137:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.toPlatformPath = exports.toWin32Path = exports.toPosixPath = void 0;
const path = __importStar(__webpack_require__(6928));
/**
 * toPosixPath converts the given path to the posix form. On Windows, \\ will be
 * replaced with /.
 *
 * @param pth. Path to transform.
 * @return string Posix path.
 */
function toPosixPath(pth) {
    return pth.replace(/[\\]/g, '/');
}
exports.toPosixPath = toPosixPath;
/**
 * toWin32Path converts the given path to the win32 form. On Linux, / will be
 * replaced with \\.
 *
 * @param pth. Path to transform.
 * @return string Win32 path.
 */
function toWin32Path(pth) {
    return pth.replace(/[/]/g, '\\');
}
exports.toWin32Path = toWin32Path;
/**
 * toPlatformPath converts the given path to a platform-specific path. It does
 * this by replacing instances of / and \ with the platform-specific path
 * separator.
 *
 * @param pth The path to platformize.
 * @return string The platform-specific path.
 */
function toPlatformPath(pth) {
    return pth.replace(/[/\\]/g, path.sep);
}
exports.toPlatformPath = toPlatformPath;
//# sourceMappingURL=path-utils.js.map

/***/ }),

/***/ 6224:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


// For internal use, subject to change.
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.prepareKeyValueMessage = exports.issueFileCommand = void 0;
// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */
const crypto = __importStar(__webpack_require__(6982));
const fs = __importStar(__webpack_require__(9896));
const os = __importStar(__webpack_require__(857));
const utils_1 = __webpack_require__(7089);
function issueFileCommand(command, message) {
    const filePath = process.env[`GITHUB_${command}`];
    if (!filePath) {
        throw new Error(`Unable to find environment variable for file command ${command}`);
    }
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing file at path: ${filePath}`);
    }
    fs.appendFileSync(filePath, `${(0, utils_1.toCommandValue)(message)}${os.EOL}`, {
        encoding: 'utf8'
    });
}
exports.issueFileCommand = issueFileCommand;
function prepareKeyValueMessage(key, value) {
    const delimiter = `ghadelimiter_${crypto.randomUUID()}`;
    const convertedValue = (0, utils_1.toCommandValue)(value);
    // These should realistically never happen, but just in case someone finds a
    // way to exploit uuid generation let's not allow keys or values that contain
    // the delimiter.
    if (key.includes(delimiter)) {
        throw new Error(`Unexpected input: name should not contain the delimiter "${delimiter}"`);
    }
    if (convertedValue.includes(delimiter)) {
        throw new Error(`Unexpected input: value should not contain the delimiter "${delimiter}"`);
    }
    return `${key}<<${delimiter}${os.EOL}${convertedValue}${os.EOL}${delimiter}`;
}
exports.prepareKeyValueMessage = prepareKeyValueMessage;
//# sourceMappingURL=file-command.js.map

/***/ }),

/***/ 6309:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.downloadSchema = void 0;
var download_schema_1 = __webpack_require__(4017);
Object.defineProperty(exports, "downloadSchema", ({ enumerable: true, get: function () { return download_schema_1.downloadSchema; } }));


/***/ }),

/***/ 6346:
/***/ ((module) => {

module.exports = require("@babel/core");

/***/ }),

/***/ 6559:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateScopes = void 0;
var generate_scopes_1 = __webpack_require__(3076);
Object.defineProperty(exports, "generateScopes", ({ enumerable: true, get: function () { return generate_scopes_1.generateScopes; } }));


/***/ }),

/***/ 6928:
/***/ ((module) => {

module.exports = require("path");

/***/ }),

/***/ 6977:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.platform = exports.toPlatformPath = exports.toWin32Path = exports.toPosixPath = exports.markdownSummary = exports.summary = exports.getIDToken = exports.getState = exports.saveState = exports.group = exports.endGroup = exports.startGroup = exports.info = exports.notice = exports.warning = exports.error = exports.debug = exports.isDebug = exports.setFailed = exports.setCommandEcho = exports.setOutput = exports.getBooleanInput = exports.getMultilineInput = exports.getInput = exports.addPath = exports.setSecret = exports.exportVariable = exports.ExitCode = void 0;
const command_1 = __webpack_require__(4861);
const file_command_1 = __webpack_require__(6224);
const utils_1 = __webpack_require__(7089);
const os = __importStar(__webpack_require__(857));
const path = __importStar(__webpack_require__(6928));
const oidc_utils_1 = __webpack_require__(5015);
/**
 * The code to exit an action
 */
var ExitCode;
(function (ExitCode) {
    /**
     * A code indicating that the action was successful
     */
    ExitCode[ExitCode["Success"] = 0] = "Success";
    /**
     * A code indicating that the action was a failure
     */
    ExitCode[ExitCode["Failure"] = 1] = "Failure";
})(ExitCode || (exports.ExitCode = ExitCode = {}));
//-----------------------------------------------------------------------
// Variables
//-----------------------------------------------------------------------
/**
 * Sets env variable for this action and future actions in the job
 * @param name the name of the variable to set
 * @param val the value of the variable. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function exportVariable(name, val) {
    const convertedVal = (0, utils_1.toCommandValue)(val);
    process.env[name] = convertedVal;
    const filePath = process.env['GITHUB_ENV'] || '';
    if (filePath) {
        return (0, file_command_1.issueFileCommand)('ENV', (0, file_command_1.prepareKeyValueMessage)(name, val));
    }
    (0, command_1.issueCommand)('set-env', { name }, convertedVal);
}
exports.exportVariable = exportVariable;
/**
 * Registers a secret which will get masked from logs
 * @param secret value of the secret
 */
function setSecret(secret) {
    (0, command_1.issueCommand)('add-mask', {}, secret);
}
exports.setSecret = setSecret;
/**
 * Prepends inputPath to the PATH (for this action and future actions)
 * @param inputPath
 */
function addPath(inputPath) {
    const filePath = process.env['GITHUB_PATH'] || '';
    if (filePath) {
        (0, file_command_1.issueFileCommand)('PATH', inputPath);
    }
    else {
        (0, command_1.issueCommand)('add-path', {}, inputPath);
    }
    process.env['PATH'] = `${inputPath}${path.delimiter}${process.env['PATH']}`;
}
exports.addPath = addPath;
/**
 * Gets the value of an input.
 * Unless trimWhitespace is set to false in InputOptions, the value is also trimmed.
 * Returns an empty string if the value is not defined.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string
 */
function getInput(name, options) {
    const val = process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || '';
    if (options && options.required && !val) {
        throw new Error(`Input required and not supplied: ${name}`);
    }
    if (options && options.trimWhitespace === false) {
        return val;
    }
    return val.trim();
}
exports.getInput = getInput;
/**
 * Gets the values of an multiline input.  Each value is also trimmed.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string[]
 *
 */
function getMultilineInput(name, options) {
    const inputs = getInput(name, options)
        .split('\n')
        .filter(x => x !== '');
    if (options && options.trimWhitespace === false) {
        return inputs;
    }
    return inputs.map(input => input.trim());
}
exports.getMultilineInput = getMultilineInput;
/**
 * Gets the input value of the boolean type in the YAML 1.2 "core schema" specification.
 * Support boolean input list: `true | True | TRUE | false | False | FALSE` .
 * The return value is also in boolean type.
 * ref: https://yaml.org/spec/1.2/spec.html#id2804923
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   boolean
 */
function getBooleanInput(name, options) {
    const trueValue = ['true', 'True', 'TRUE'];
    const falseValue = ['false', 'False', 'FALSE'];
    const val = getInput(name, options);
    if (trueValue.includes(val))
        return true;
    if (falseValue.includes(val))
        return false;
    throw new TypeError(`Input does not meet YAML 1.2 "Core Schema" specification: ${name}\n` +
        `Support boolean input list: \`true | True | TRUE | false | False | FALSE\``);
}
exports.getBooleanInput = getBooleanInput;
/**
 * Sets the value of an output.
 *
 * @param     name     name of the output to set
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setOutput(name, value) {
    const filePath = process.env['GITHUB_OUTPUT'] || '';
    if (filePath) {
        return (0, file_command_1.issueFileCommand)('OUTPUT', (0, file_command_1.prepareKeyValueMessage)(name, value));
    }
    process.stdout.write(os.EOL);
    (0, command_1.issueCommand)('set-output', { name }, (0, utils_1.toCommandValue)(value));
}
exports.setOutput = setOutput;
/**
 * Enables or disables the echoing of commands into stdout for the rest of the step.
 * Echoing is disabled by default if ACTIONS_STEP_DEBUG is not set.
 *
 */
function setCommandEcho(enabled) {
    (0, command_1.issue)('echo', enabled ? 'on' : 'off');
}
exports.setCommandEcho = setCommandEcho;
//-----------------------------------------------------------------------
// Results
//-----------------------------------------------------------------------
/**
 * Sets the action status to failed.
 * When the action exits it will be with an exit code of 1
 * @param message add error issue message
 */
function setFailed(message) {
    process.exitCode = ExitCode.Failure;
    error(message);
}
exports.setFailed = setFailed;
//-----------------------------------------------------------------------
// Logging Commands
//-----------------------------------------------------------------------
/**
 * Gets whether Actions Step Debug is on or not
 */
function isDebug() {
    return process.env['RUNNER_DEBUG'] === '1';
}
exports.isDebug = isDebug;
/**
 * Writes debug message to user log
 * @param message debug message
 */
function debug(message) {
    (0, command_1.issueCommand)('debug', {}, message);
}
exports.debug = debug;
/**
 * Adds an error issue
 * @param message error issue message. Errors will be converted to string via toString()
 * @param properties optional properties to add to the annotation.
 */
function error(message, properties = {}) {
    (0, command_1.issueCommand)('error', (0, utils_1.toCommandProperties)(properties), message instanceof Error ? message.toString() : message);
}
exports.error = error;
/**
 * Adds a warning issue
 * @param message warning issue message. Errors will be converted to string via toString()
 * @param properties optional properties to add to the annotation.
 */
function warning(message, properties = {}) {
    (0, command_1.issueCommand)('warning', (0, utils_1.toCommandProperties)(properties), message instanceof Error ? message.toString() : message);
}
exports.warning = warning;
/**
 * Adds a notice issue
 * @param message notice issue message. Errors will be converted to string via toString()
 * @param properties optional properties to add to the annotation.
 */
function notice(message, properties = {}) {
    (0, command_1.issueCommand)('notice', (0, utils_1.toCommandProperties)(properties), message instanceof Error ? message.toString() : message);
}
exports.notice = notice;
/**
 * Writes info to log with console.log.
 * @param message info message
 */
function info(message) {
    process.stdout.write(message + os.EOL);
}
exports.info = info;
/**
 * Begin an output group.
 *
 * Output until the next `groupEnd` will be foldable in this group
 *
 * @param name The name of the output group
 */
function startGroup(name) {
    (0, command_1.issue)('group', name);
}
exports.startGroup = startGroup;
/**
 * End an output group.
 */
function endGroup() {
    (0, command_1.issue)('endgroup');
}
exports.endGroup = endGroup;
/**
 * Wrap an asynchronous function call in a group.
 *
 * Returns the same type as the function itself.
 *
 * @param name The name of the group
 * @param fn The function to wrap in the group
 */
function group(name, fn) {
    return __awaiter(this, void 0, void 0, function* () {
        startGroup(name);
        let result;
        try {
            result = yield fn();
        }
        finally {
            endGroup();
        }
        return result;
    });
}
exports.group = group;
//-----------------------------------------------------------------------
// Wrapper action state
//-----------------------------------------------------------------------
/**
 * Saves state for current action, the state can only be retrieved by this action's post job execution.
 *
 * @param     name     name of the state to store
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function saveState(name, value) {
    const filePath = process.env['GITHUB_STATE'] || '';
    if (filePath) {
        return (0, file_command_1.issueFileCommand)('STATE', (0, file_command_1.prepareKeyValueMessage)(name, value));
    }
    (0, command_1.issueCommand)('save-state', { name }, (0, utils_1.toCommandValue)(value));
}
exports.saveState = saveState;
/**
 * Gets the value of an state set by this action's main execution.
 *
 * @param     name     name of the state to get
 * @returns   string
 */
function getState(name) {
    return process.env[`STATE_${name}`] || '';
}
exports.getState = getState;
function getIDToken(aud) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield oidc_utils_1.OidcClient.getIDToken(aud);
    });
}
exports.getIDToken = getIDToken;
/**
 * Summary exports
 */
var summary_1 = __webpack_require__(1040);
Object.defineProperty(exports, "summary", ({ enumerable: true, get: function () { return summary_1.summary; } }));
/**
 * @deprecated use core.summary
 */
var summary_2 = __webpack_require__(1040);
Object.defineProperty(exports, "markdownSummary", ({ enumerable: true, get: function () { return summary_2.markdownSummary; } }));
/**
 * Path exports
 */
var path_utils_1 = __webpack_require__(317);
Object.defineProperty(exports, "toPosixPath", ({ enumerable: true, get: function () { return path_utils_1.toPosixPath; } }));
Object.defineProperty(exports, "toWin32Path", ({ enumerable: true, get: function () { return path_utils_1.toWin32Path; } }));
Object.defineProperty(exports, "toPlatformPath", ({ enumerable: true, get: function () { return path_utils_1.toPlatformPath; } }));
/**
 * Platform utilities exports
 */
exports.platform = __importStar(__webpack_require__(8117));
//# sourceMappingURL=core.js.map

/***/ }),

/***/ 6982:
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ 7089:
/***/ ((__unused_webpack_module, exports) => {


// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.toCommandProperties = exports.toCommandValue = void 0;
/**
 * Sanitizes an input into a string so it can be passed into issueCommand safely
 * @param input input to sanitize into a string
 */
function toCommandValue(input) {
    if (input === null || input === undefined) {
        return '';
    }
    else if (typeof input === 'string' || input instanceof String) {
        return input;
    }
    return JSON.stringify(input);
}
exports.toCommandValue = toCommandValue;
/**
 *
 * @param annotationProperties
 * @returns The command properties to send with the actual annotation command
 * See IssueCommandProperties: https://github.com/actions/runner/blob/main/src/Runner.Worker/ActionCommandManager.cs#L646
 */
function toCommandProperties(annotationProperties) {
    if (!Object.keys(annotationProperties).length) {
        return {};
    }
    return {
        title: annotationProperties.title,
        file: annotationProperties.file,
        line: annotationProperties.startLine,
        endLine: annotationProperties.endLine,
        col: annotationProperties.startColumn,
        endColumn: annotationProperties.endColumn
    };
}
exports.toCommandProperties = toCommandProperties;
//# sourceMappingURL=utils.js.map

/***/ }),

/***/ 7157:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.platform = exports.toPlatformPath = exports.toWin32Path = exports.toPosixPath = exports.markdownSummary = exports.summary = exports.getIDToken = exports.getState = exports.saveState = exports.group = exports.endGroup = exports.startGroup = exports.info = exports.notice = exports.warning = exports.error = exports.debug = exports.isDebug = exports.setFailed = exports.setCommandEcho = exports.setOutput = exports.getBooleanInput = exports.getMultilineInput = exports.getInput = exports.addPath = exports.setSecret = exports.exportVariable = exports.ExitCode = void 0;
const command_1 = __webpack_require__(7281);
const file_command_1 = __webpack_require__(9580);
const utils_1 = __webpack_require__(3621);
const os = __importStar(__webpack_require__(857));
const path = __importStar(__webpack_require__(6928));
const oidc_utils_1 = __webpack_require__(9659);
/**
 * The code to exit an action
 */
var ExitCode;
(function (ExitCode) {
    /**
     * A code indicating that the action was successful
     */
    ExitCode[ExitCode["Success"] = 0] = "Success";
    /**
     * A code indicating that the action was a failure
     */
    ExitCode[ExitCode["Failure"] = 1] = "Failure";
})(ExitCode || (exports.ExitCode = ExitCode = {}));
//-----------------------------------------------------------------------
// Variables
//-----------------------------------------------------------------------
/**
 * Sets env variable for this action and future actions in the job
 * @param name the name of the variable to set
 * @param val the value of the variable. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function exportVariable(name, val) {
    const convertedVal = (0, utils_1.toCommandValue)(val);
    process.env[name] = convertedVal;
    const filePath = process.env['GITHUB_ENV'] || '';
    if (filePath) {
        return (0, file_command_1.issueFileCommand)('ENV', (0, file_command_1.prepareKeyValueMessage)(name, val));
    }
    (0, command_1.issueCommand)('set-env', { name }, convertedVal);
}
exports.exportVariable = exportVariable;
/**
 * Registers a secret which will get masked from logs
 * @param secret value of the secret
 */
function setSecret(secret) {
    (0, command_1.issueCommand)('add-mask', {}, secret);
}
exports.setSecret = setSecret;
/**
 * Prepends inputPath to the PATH (for this action and future actions)
 * @param inputPath
 */
function addPath(inputPath) {
    const filePath = process.env['GITHUB_PATH'] || '';
    if (filePath) {
        (0, file_command_1.issueFileCommand)('PATH', inputPath);
    }
    else {
        (0, command_1.issueCommand)('add-path', {}, inputPath);
    }
    process.env['PATH'] = `${inputPath}${path.delimiter}${process.env['PATH']}`;
}
exports.addPath = addPath;
/**
 * Gets the value of an input.
 * Unless trimWhitespace is set to false in InputOptions, the value is also trimmed.
 * Returns an empty string if the value is not defined.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string
 */
function getInput(name, options) {
    const val = process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || '';
    if (options && options.required && !val) {
        throw new Error(`Input required and not supplied: ${name}`);
    }
    if (options && options.trimWhitespace === false) {
        return val;
    }
    return val.trim();
}
exports.getInput = getInput;
/**
 * Gets the values of an multiline input.  Each value is also trimmed.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string[]
 *
 */
function getMultilineInput(name, options) {
    const inputs = getInput(name, options)
        .split('\n')
        .filter(x => x !== '');
    if (options && options.trimWhitespace === false) {
        return inputs;
    }
    return inputs.map(input => input.trim());
}
exports.getMultilineInput = getMultilineInput;
/**
 * Gets the input value of the boolean type in the YAML 1.2 "core schema" specification.
 * Support boolean input list: `true | True | TRUE | false | False | FALSE` .
 * The return value is also in boolean type.
 * ref: https://yaml.org/spec/1.2/spec.html#id2804923
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   boolean
 */
function getBooleanInput(name, options) {
    const trueValue = ['true', 'True', 'TRUE'];
    const falseValue = ['false', 'False', 'FALSE'];
    const val = getInput(name, options);
    if (trueValue.includes(val))
        return true;
    if (falseValue.includes(val))
        return false;
    throw new TypeError(`Input does not meet YAML 1.2 "Core Schema" specification: ${name}\n` +
        `Support boolean input list: \`true | True | TRUE | false | False | FALSE\``);
}
exports.getBooleanInput = getBooleanInput;
/**
 * Sets the value of an output.
 *
 * @param     name     name of the output to set
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setOutput(name, value) {
    const filePath = process.env['GITHUB_OUTPUT'] || '';
    if (filePath) {
        return (0, file_command_1.issueFileCommand)('OUTPUT', (0, file_command_1.prepareKeyValueMessage)(name, value));
    }
    process.stdout.write(os.EOL);
    (0, command_1.issueCommand)('set-output', { name }, (0, utils_1.toCommandValue)(value));
}
exports.setOutput = setOutput;
/**
 * Enables or disables the echoing of commands into stdout for the rest of the step.
 * Echoing is disabled by default if ACTIONS_STEP_DEBUG is not set.
 *
 */
function setCommandEcho(enabled) {
    (0, command_1.issue)('echo', enabled ? 'on' : 'off');
}
exports.setCommandEcho = setCommandEcho;
//-----------------------------------------------------------------------
// Results
//-----------------------------------------------------------------------
/**
 * Sets the action status to failed.
 * When the action exits it will be with an exit code of 1
 * @param message add error issue message
 */
function setFailed(message) {
    process.exitCode = ExitCode.Failure;
    error(message);
}
exports.setFailed = setFailed;
//-----------------------------------------------------------------------
// Logging Commands
//-----------------------------------------------------------------------
/**
 * Gets whether Actions Step Debug is on or not
 */
function isDebug() {
    return process.env['RUNNER_DEBUG'] === '1';
}
exports.isDebug = isDebug;
/**
 * Writes debug message to user log
 * @param message debug message
 */
function debug(message) {
    (0, command_1.issueCommand)('debug', {}, message);
}
exports.debug = debug;
/**
 * Adds an error issue
 * @param message error issue message. Errors will be converted to string via toString()
 * @param properties optional properties to add to the annotation.
 */
function error(message, properties = {}) {
    (0, command_1.issueCommand)('error', (0, utils_1.toCommandProperties)(properties), message instanceof Error ? message.toString() : message);
}
exports.error = error;
/**
 * Adds a warning issue
 * @param message warning issue message. Errors will be converted to string via toString()
 * @param properties optional properties to add to the annotation.
 */
function warning(message, properties = {}) {
    (0, command_1.issueCommand)('warning', (0, utils_1.toCommandProperties)(properties), message instanceof Error ? message.toString() : message);
}
exports.warning = warning;
/**
 * Adds a notice issue
 * @param message notice issue message. Errors will be converted to string via toString()
 * @param properties optional properties to add to the annotation.
 */
function notice(message, properties = {}) {
    (0, command_1.issueCommand)('notice', (0, utils_1.toCommandProperties)(properties), message instanceof Error ? message.toString() : message);
}
exports.notice = notice;
/**
 * Writes info to log with console.log.
 * @param message info message
 */
function info(message) {
    process.stdout.write(message + os.EOL);
}
exports.info = info;
/**
 * Begin an output group.
 *
 * Output until the next `groupEnd` will be foldable in this group
 *
 * @param name The name of the output group
 */
function startGroup(name) {
    (0, command_1.issue)('group', name);
}
exports.startGroup = startGroup;
/**
 * End an output group.
 */
function endGroup() {
    (0, command_1.issue)('endgroup');
}
exports.endGroup = endGroup;
/**
 * Wrap an asynchronous function call in a group.
 *
 * Returns the same type as the function itself.
 *
 * @param name The name of the group
 * @param fn The function to wrap in the group
 */
function group(name, fn) {
    return __awaiter(this, void 0, void 0, function* () {
        startGroup(name);
        let result;
        try {
            result = yield fn();
        }
        finally {
            endGroup();
        }
        return result;
    });
}
exports.group = group;
//-----------------------------------------------------------------------
// Wrapper action state
//-----------------------------------------------------------------------
/**
 * Saves state for current action, the state can only be retrieved by this action's post job execution.
 *
 * @param     name     name of the state to store
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function saveState(name, value) {
    const filePath = process.env['GITHUB_STATE'] || '';
    if (filePath) {
        return (0, file_command_1.issueFileCommand)('STATE', (0, file_command_1.prepareKeyValueMessage)(name, value));
    }
    (0, command_1.issueCommand)('save-state', { name }, (0, utils_1.toCommandValue)(value));
}
exports.saveState = saveState;
/**
 * Gets the value of an state set by this action's main execution.
 *
 * @param     name     name of the state to get
 * @returns   string
 */
function getState(name) {
    return process.env[`STATE_${name}`] || '';
}
exports.getState = getState;
function getIDToken(aud) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield oidc_utils_1.OidcClient.getIDToken(aud);
    });
}
exports.getIDToken = getIDToken;
/**
 * Summary exports
 */
var summary_1 = __webpack_require__(9428);
Object.defineProperty(exports, "summary", ({ enumerable: true, get: function () { return summary_1.summary; } }));
/**
 * @deprecated use core.summary
 */
var summary_2 = __webpack_require__(9428);
Object.defineProperty(exports, "markdownSummary", ({ enumerable: true, get: function () { return summary_2.markdownSummary; } }));
/**
 * Path exports
 */
var path_utils_1 = __webpack_require__(6137);
Object.defineProperty(exports, "toPosixPath", ({ enumerable: true, get: function () { return path_utils_1.toPosixPath; } }));
Object.defineProperty(exports, "toWin32Path", ({ enumerable: true, get: function () { return path_utils_1.toWin32Path; } }));
Object.defineProperty(exports, "toPlatformPath", ({ enumerable: true, get: function () { return path_utils_1.toPlatformPath; } }));
/**
 * Platform utilities exports
 */
exports.platform = __importStar(__webpack_require__(5185));
//# sourceMappingURL=core.js.map

/***/ }),

/***/ 7281:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.issue = exports.issueCommand = void 0;
const os = __importStar(__webpack_require__(857));
const utils_1 = __webpack_require__(3621);
/**
 * Commands
 *
 * Command Format:
 *   ::name key=value,key=value::message
 *
 * Examples:
 *   ::warning::This is the message
 *   ::set-env name=MY_VAR::some value
 */
function issueCommand(command, properties, message) {
    const cmd = new Command(command, properties, message);
    process.stdout.write(cmd.toString() + os.EOL);
}
exports.issueCommand = issueCommand;
function issue(name, message = '') {
    issueCommand(name, {}, message);
}
exports.issue = issue;
const CMD_STRING = '::';
class Command {
    constructor(command, properties, message) {
        if (!command) {
            command = 'missing.command';
        }
        this.command = command;
        this.properties = properties;
        this.message = message;
    }
    toString() {
        let cmdStr = CMD_STRING + this.command;
        if (this.properties && Object.keys(this.properties).length > 0) {
            cmdStr += ' ';
            let first = true;
            for (const key in this.properties) {
                if (this.properties.hasOwnProperty(key)) {
                    const val = this.properties[key];
                    if (val) {
                        if (first) {
                            first = false;
                        }
                        else {
                            cmdStr += ',';
                        }
                        cmdStr += `${key}=${escapeProperty(val)}`;
                    }
                }
            }
        }
        cmdStr += `${CMD_STRING}${escapeData(this.message)}`;
        return cmdStr;
    }
}
function escapeData(s) {
    return (0, utils_1.toCommandValue)(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A');
}
function escapeProperty(s) {
    return (0, utils_1.toCommandValue)(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A')
        .replace(/:/g, '%3A')
        .replace(/,/g, '%2C');
}
//# sourceMappingURL=command.js.map

/***/ }),

/***/ 7404:
/***/ ((module) => {

module.exports = require("@graphql-codegen/cli");

/***/ }),

/***/ 7924:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateBasePath = generateBasePath;
exports.generateVersionFolderName = generateVersionFolderName;
exports.buildVersionFolderPath = buildVersionFolderPath;
exports.folderExists = folderExists;
exports.checkVersionFolderExists = checkVersionFolderExists;
function generateBasePath(env, game) {
    return `dynamic-modules/${env}/${game}/static-data-query`;
}
function generateVersionFolderName(schemaVersion) {
    return `v-${schemaVersion}-query`;
}
function buildVersionFolderPath(env, game, schemaVersion) {
    const basePath = generateBasePath(env, game);
    const versionFolder = generateVersionFolderName(schemaVersion);
    return `${basePath}/${versionFolder}`;
}
async function folderExists(bucket, folderPath) {
    const prefix = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
    const [files] = await bucket.getFiles({ prefix, maxResults: 1 });
    return files.length > 0;
}
async function checkVersionFolderExists(bucket, env, game, schemaVersion) {
    const versionFolderPath = buildVersionFolderPath(env, game, schemaVersion);
    return folderExists(bucket, versionFolderPath);
}


/***/ }),

/***/ 8086:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.uploadBuild = void 0;
var upload_build_1 = __webpack_require__(9108);
Object.defineProperty(exports, "uploadBuild", ({ enumerable: true, get: function () { return upload_build_1.uploadBuild; } }));


/***/ }),

/***/ 8117:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getDetails = exports.isLinux = exports.isMacOS = exports.isWindows = exports.arch = exports.platform = void 0;
const os_1 = __importDefault(__webpack_require__(857));
const exec = __importStar(__webpack_require__(8545));
const getWindowsInfo = () => __awaiter(void 0, void 0, void 0, function* () {
    const { stdout: version } = yield exec.getExecOutput('powershell -command "(Get-CimInstance -ClassName Win32_OperatingSystem).Version"', undefined, {
        silent: true
    });
    const { stdout: name } = yield exec.getExecOutput('powershell -command "(Get-CimInstance -ClassName Win32_OperatingSystem).Caption"', undefined, {
        silent: true
    });
    return {
        name: name.trim(),
        version: version.trim()
    };
});
const getMacOsInfo = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const { stdout } = yield exec.getExecOutput('sw_vers', undefined, {
        silent: true
    });
    const version = (_b = (_a = stdout.match(/ProductVersion:\s*(.+)/)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : '';
    const name = (_d = (_c = stdout.match(/ProductName:\s*(.+)/)) === null || _c === void 0 ? void 0 : _c[1]) !== null && _d !== void 0 ? _d : '';
    return {
        name,
        version
    };
});
const getLinuxInfo = () => __awaiter(void 0, void 0, void 0, function* () {
    const { stdout } = yield exec.getExecOutput('lsb_release', ['-i', '-r', '-s'], {
        silent: true
    });
    const [name, version] = stdout.trim().split('\n');
    return {
        name,
        version
    };
});
exports.platform = os_1.default.platform();
exports.arch = os_1.default.arch();
exports.isWindows = exports.platform === 'win32';
exports.isMacOS = exports.platform === 'darwin';
exports.isLinux = exports.platform === 'linux';
function getDetails() {
    return __awaiter(this, void 0, void 0, function* () {
        return Object.assign(Object.assign({}, (yield (exports.isWindows
            ? getWindowsInfo()
            : exports.isMacOS
                ? getMacOsInfo()
                : getLinuxInfo()))), { platform: exports.platform,
            arch: exports.arch,
            isWindows: exports.isWindows,
            isMacOS: exports.isMacOS,
            isLinux: exports.isLinux });
    });
}
exports.getDetails = getDetails;
//# sourceMappingURL=platform.js.map

/***/ }),

/***/ 8156:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.run = run;
const core = __importStar(__webpack_require__(6977));
const storage_1 = __webpack_require__(3869);
const _0_check_schema_version_1 = __webpack_require__(2911);
const _1_download_schema_1 = __webpack_require__(6309);
const _2_generate_scopes_1 = __webpack_require__(6559);
const _3_clean_schema_1 = __webpack_require__(1922);
const _4_generate_fragments_1 = __webpack_require__(985);
const _5_generate_query_1 = __webpack_require__(2517);
const _7_generate_gql_types_1 = __webpack_require__(1039);
const _8_upload_build_1 = __webpack_require__(8086);
const _6_compile_query_1 = __webpack_require__(4304);
/**
 * Main function for the GitHub Action
 */
async function run() {
    try {
        // Get inputs
        const game = core.getInput('game', { required: true });
        const graphqlEndpoint = core.getInput('graphql-endpoint', { required: true });
        const staticDataFieldName = core.getInput('static-data-field-name') || 'staticData';
        const timeoutMs = parseInt(core.getInput('timeout') || '600000', 10);
        const gcsBucketName = core.getInput('gcs-bucket-name', { required: true });
        const gcsProjectId = core.getInput('gcs-project-id', { required: true });
        const dynamicModulesEnv = core.getInput('dynamic-modules-env', { required: true });
        core.info(`🚀 Starting build static data query pipeline for game: ${game}`);
        // Initialize Storage and Bucket
        const storage = new storage_1.Storage({ projectId: gcsProjectId });
        const bucket = storage.bucket(gcsBucketName);
        // Step 0: Check schema version
        core.startGroup('🔍 Step 0: Checking schema version');
        const schemaVersionCheck = await (0, _0_check_schema_version_1.checkSchemaVersion)({
            graphqlEndpoint,
            bucket,
            env: dynamicModulesEnv,
            game,
        });
        core.endGroup();
        if (!schemaVersionCheck.shouldContinue) {
            core.info(`✓ Schema version has not changed (${schemaVersionCheck.currentSchemaVersion}). Pipeline skipped.`);
            return;
        }
        if (!schemaVersionCheck.currentSchemaVersion) {
            core.setFailed('Schema version is not found, pipeline will be skipped');
            return;
        }
        // Step 1: Download GraphQL schema
        core.startGroup('📥 Step 1: Downloading GraphQL schema');
        const downloadedSchemaPath = await (0, _1_download_schema_1.downloadSchema)({ endpoint: graphqlEndpoint });
        core.info(`✓ Schema downloaded to: ${downloadedSchemaPath}`);
        core.endGroup();
        // Step 2: Generate scopes
        core.startGroup('🔧 Step 2: Generating scopes');
        const scopesData = (0, _2_generate_scopes_1.generateScopes)({
            schemaPath: downloadedSchemaPath,
            gameField: game,
        });
        core.info(`✓ Scopes generated`);
        core.endGroup();
        // Step 3: Clean schema
        core.startGroup('🧹 Step 3: Cleaning schema');
        const cleanedSchemaPath = await (0, _3_clean_schema_1.cleanSchema)({
            schemaPath: downloadedSchemaPath,
            gameField: game,
            staticDataFieldName,
            scopesData,
        });
        core.info(`✓ Schema cleaned: ${cleanedSchemaPath}`);
        core.endGroup();
        // Step 4: Generate fragments
        core.startGroup('🔨 Step 4: Generating fragments');
        await (0, _4_generate_fragments_1.generateFragments)({
            timeoutMs,
        });
        core.info(`✓ Fragments generation completed`);
        core.endGroup();
        // Step 5: Generate query
        core.startGroup('🔨 Step 5: Generating query');
        await (0, _5_generate_query_1.generateQuery)({
            timeoutMs,
        });
        core.info(`✓ Query generation completed`);
        core.endGroup();
        // Step 6: Compile query
        core.startGroup('🔨 Step 6: Compiling query');
        await (0, _6_compile_query_1.compileQuery)();
        core.info(`✓ Query Compiling completed`);
        core.endGroup();
        // Step 7: Generate GraphQL types
        core.startGroup('📝 Step 7: Generating GraphQL types');
        await (0, _7_generate_gql_types_1.generateGqlTypes)();
        core.info(`✓ GraphQL types generation completed`);
        core.endGroup();
        // Step 8: Upload build to GCS
        core.startGroup('☁️ Step 8: Uploading build to GCS');
        await (0, _8_upload_build_1.uploadBuild)({
            bucket,
            env: dynamicModulesEnv,
            game: game,
            schemaVersion: schemaVersionCheck.currentSchemaVersion,
        });
        core.info(`✓ Build upload completed`);
        core.endGroup();
        core.info(`✓ Pipeline completed successfully`);
    }
    catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
        else {
            core.setFailed('An unknown error occurred');
        }
    }
}


/***/ }),

/***/ 8159:
/***/ ((module) => {

module.exports = require("@actions/http-client/lib/auth");

/***/ }),

/***/ 8323:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.cleanSchema = cleanSchema;
const cli_1 = __webpack_require__(7404);
const clean_schema_by_game_js_1 = __webpack_require__(5384);
const path = __importStar(__webpack_require__(6928));
const fs = __importStar(__webpack_require__(9896));
const core = __importStar(__webpack_require__(6977));
const OUTPUT_PATH = '_generated/cleaned-schema.graphql';
async function cleanSchema(options) {
    try {
        const { schemaPath, gameField, staticDataFieldName, scopesData } = options;
        core.info(`Cleaning schema from: ${schemaPath}`);
        core.info(`Game field: ${gameField}`);
        core.info(`Static data field: ${staticDataFieldName}`);
        // Verify input schema exists
        if (!fs.existsSync(schemaPath)) {
            const errorMessage = `Input schema file not found: ${schemaPath}`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        // Resolve the absolute path for the output
        const absoluteOutputPath = path.resolve(process.cwd(), OUTPUT_PATH);
        const outputDir = path.dirname(absoluteOutputPath);
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            core.info(`Created output directory: ${outputDir}`);
        }
        // Configure graphql-codegen with getCleanedSchemaByGame loader
        const config = {
            schema: {
                [schemaPath]: {
                    loader: (0, clean_schema_by_game_js_1.getCleanedSchemaByGame)({
                        includedScopes: [gameField],
                        staticDataFieldName,
                        scopesData,
                    }),
                },
            },
            generates: {
                [absoluteOutputPath]: {
                    plugins: ['schema-ast'],
                    config: {
                        includeDirectives: true,
                        commentDescriptions: true,
                    },
                },
            },
        };
        // Execute the code generation
        core.info('Running schema cleanup...');
        try {
            await (0, cli_1.generate)(config, true);
        }
        catch (error) {
            const errorMessage = `Failed to clean schema: ${error instanceof Error ? error.message : String(error)}`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        // Verify the file was created
        if (!fs.existsSync(absoluteOutputPath)) {
            const errorMessage = `Cleaned schema file was not created at expected path: ${absoluteOutputPath}`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        core.info(`✓ Schema successfully cleaned and saved to: ${absoluteOutputPath}`);
        return absoluteOutputPath;
    }
    catch (error) {
        const errorMessage = `Unexpected error in cleanSchema: ${error instanceof Error ? error.message : String(error)}`;
        core.setFailed(errorMessage);
        throw error instanceof Error ? error : new Error(errorMessage);
    }
}


/***/ }),

/***/ 8545:
/***/ ((module) => {

module.exports = require("@actions/exec");

/***/ }),

/***/ 8561:
/***/ ((module) => {

module.exports = require("babel-plugin-graphql-tag");

/***/ }),

/***/ 9005:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateGqlTypes = generateGqlTypes;
const cli_1 = __webpack_require__(7404);
const rimraf_1 = __webpack_require__(9485);
const path = __importStar(__webpack_require__(6928));
const fs = __importStar(__webpack_require__(9896));
const core = __importStar(__webpack_require__(6977));
async function generateGqlTypes() {
    try {
        core.info('Starting GraphQL types generation...');
        // Step 1: Clean up old gql-types directories
        const buildDir = path.resolve(process.cwd(), 'build');
        const gqlTypesPattern = path.join(buildDir, '**/gql-types');
        try {
            await (0, rimraf_1.rimraf)(gqlTypesPattern);
            core.info('Cleaned up old gql-types directories');
        }
        catch (error) {
            // If cleanup fails, log but continue - directories might not exist yet
            core.warning(`Could not clean up old gql-types directories: ${error instanceof Error ? error.message : String(error)}`);
        }
        // Step 2: Construct the codegen configuration
        core.info('Constructing codegen configuration...');
        const scalars = {
            NgfDateTime: 'string',
            Diablo4DateTime: 'string',
            NgfDocumentRichTextContentJson: 'any',
            NgfDocumentBase64Json: 'string',
            NgfDocumentContentBase64Json: 'string',
            TagsScalar: 'string[] | null',
        };
        const schemaFilePath = path.resolve(process.cwd(), '_generated/cleaned-schema.graphql');
        const documents = path.resolve(process.cwd(), 'build/gql/**/*.gql.ts');
        const typesFilePath = path.resolve(process.cwd(), 'build/gql/gql-types/types.ts');
        const typesDirPath = path.resolve(process.cwd(), 'build/gql/gql-types');
        // Config for the main types file
        const fileConfig = {
            schema: schemaFilePath,
            plugins: [
                {
                    add: {
                        content: '/* @ts-ignore */',
                    },
                },
                'typescript',
                'fragment-matcher',
            ],
            config: {
                namingConvention: 'keep',
                avoidOptionals: {
                    field: true,
                    inputValue: false,
                    object: true,
                    defaultValue: true,
                },
                skipTypename: false,
                scalars,
                enumsAsTypes: true,
            },
        };
        // Config for the directory (near-operation-file preset)
        const dirConfig = {
            schema: schemaFilePath,
            documents,
            preset: 'near-operation-file',
            presetConfig: {
                extension: '.generated.ts',
                folder: 'gql-types',
                baseTypesPath: `./types.ts`,
            },
            plugins: [
                {
                    add: {
                        content: '/* @ts-ignore */',
                    },
                },
                'typescript-operations',
                'typescript-react-apollo',
            ],
            config: {
                avoidOptionals: true,
                dedupeFragments: true,
                documentMode: 'documentNode',
                namingConvention: 'keep',
                skipTypename: false,
                dedupeOperationSuffix: true,
                omitOperationSuffix: false,
                withComponent: false,
                withHooks: true,
                withHOC: false,
                preResolveTypes: true,
                scalars,
                enumsAsTypes: true,
            },
        };
        // Config for possible-types.json
        const possibleTypesConfig = {
            schema: schemaFilePath,
            documents,
            plugins: ['fragment-matcher'],
            config: {
                module: 'commonjs',
            },
        };
        const config = {
            generates: {
                [typesFilePath]: fileConfig,
                [typesDirPath]: dirConfig,
                [`${typesDirPath}/possible-types.json`]: possibleTypesConfig,
            },
        };
        // Step 3: Execute the code generation
        core.info('Running GraphQL codegen...');
        try {
            await (0, cli_1.generate)(config, true);
        }
        catch (error) {
            const errorMessage = `Failed to generate GraphQL types: ${error instanceof Error ? error.message : String(error)}`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        // Step 4: Verify that types were generated
        const expectedTypesFile = path.resolve(process.cwd(), 'build/gql/gql-types/types.ts');
        if (!fs.existsSync(expectedTypesFile)) {
            core.warning(`Types file was not created at expected path: ${expectedTypesFile}`);
        }
        else {
            core.info(`✓ Types file generated: ${expectedTypesFile}`);
        }
        core.info(`✓ GraphQL types generation completed successfully`);
    }
    catch (error) {
        const errorMessage = `Unexpected error in generateGqlTypes: ${error instanceof Error ? error.message : String(error)}`;
        core.setFailed(errorMessage);
        throw error instanceof Error ? error : new Error(errorMessage);
    }
}


/***/ }),

/***/ 9099:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TimeoutError = void 0;
exports.spawnWithTimeout = spawnWithTimeout;
const child_process_1 = __webpack_require__(5317);
const core = __importStar(__webpack_require__(7157));
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


/***/ }),

/***/ 9108:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.uploadBuild = uploadBuild;
const fs = __importStar(__webpack_require__(9896));
const path = __importStar(__webpack_require__(6928));
const core = __importStar(__webpack_require__(6977));
const bucket_utils_1 = __webpack_require__(9328);
const version_folder_utils_1 = __webpack_require__(7924);
const buildPath = './build';
function getFilesInDirectory(dirPath, extension) {
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
        return [];
    }
    const files = [];
    const entries = fs.readdirSync(dirPath);
    for (const entry of entries) {
        const filePath = path.join(dirPath, entry);
        if (fs.statSync(filePath).isFile() && entry.endsWith(extension)) {
            files.push(filePath);
        }
    }
    return files;
}
function getAllFilesRecursive(dirPath) {
    const files = [];
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
        return files;
    }
    const entries = fs.readdirSync(dirPath);
    for (const entry of entries) {
        const filePath = path.join(dirPath, entry);
        if (fs.statSync(filePath).isDirectory()) {
            files.push(...getAllFilesRecursive(filePath));
        }
        else {
            files.push(filePath);
        }
    }
    return files;
}
async function uploadBuild(options) {
    try {
        const { bucket, env, game, schemaVersion } = options;
        const bucketName = bucket.name;
        core.info(`Starting upload of build files to GCS bucket: ${bucketName}`);
        // Step 1: Verify bucket exists
        try {
            const [exists] = await bucket.exists();
            if (!exists) {
                const errorMessage = `Bucket ${bucketName} does not exist`;
                core.setFailed(errorMessage);
                throw new Error(errorMessage);
            }
            core.info(`✓ Bucket ${bucketName} verified`);
        }
        catch (error) {
            const errorMessage = `Failed to verify bucket: ${error instanceof Error ? error.message : String(error)}`;
            core.setFailed(errorMessage);
            throw error instanceof Error ? error : new Error(errorMessage);
        }
        // Step 2: Build GCS paths
        const fullVersionPath = (0, version_folder_utils_1.buildVersionFolderPath)(env, game, schemaVersion);
        core.info(`Target path: gs://${bucketName}/${fullVersionPath}`);
        // Step 3: Check if version folder already exists
        const versionFolderExists = await (0, version_folder_utils_1.checkVersionFolderExists)(bucket, env, game, schemaVersion);
        if (versionFolderExists) {
            const errorMessage = `Folder ${fullVersionPath} already exists in bucket ${bucketName}. Cannot overwrite existing version.`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        const versionFolder = (0, version_folder_utils_1.generateVersionFolderName)(schemaVersion);
        core.info(`✓ Version folder ${versionFolder} does not exist, proceeding with upload`);
        // Step 4: Resolve build directory paths
        const buildQueryPath = path.resolve(process.cwd(), buildPath, 'gql', 'query');
        const buildFragmentsPath = path.resolve(process.cwd(), buildPath, 'gql', 'fragments');
        const buildTypesPath = path.resolve(process.cwd(), buildPath, 'gql', 'gql-types');
        const buildFragmentsTypesPath = path.resolve(process.cwd(), buildPath, 'gql', 'fragments', 'gql-types');
        const buildQueryTypesPath = path.resolve(process.cwd(), buildPath, 'gql', 'query', 'gql-types');
        // Step 5: Upload files according to new structure
        let uploadedCount = 0;
        let failedCount = 0;
        // 6.1: Upload compiled query to root
        const compiledQueryFile = path.join(buildQueryPath, `${game}-static-data-query-compiled.gql.ts`);
        if (fs.existsSync(compiledQueryFile)) {
            const destination = `${fullVersionPath}/${game}-static-data-query-compiled.gql.ts`;
            const success = await (0, bucket_utils_1.uploadFileToBucket)(bucket, compiledQueryFile, destination, bucketName, 'compiled query');
            if (success) {
                uploadedCount++;
            }
            else {
                failedCount++;
            }
        }
        else {
            core.warning(`Compiled query file not found: ${compiledQueryFile}`);
        }
        // 6.2: Upload fragments to fragments/ folder
        const fragmentFiles = getFilesInDirectory(buildFragmentsPath, '.gql.ts');
        if (fragmentFiles.length > 0) {
            for (const fragmentFile of fragmentFiles) {
                const fileName = path.basename(fragmentFile);
                const destination = `${fullVersionPath}/fragments/${fileName}`;
                const success = await (0, bucket_utils_1.uploadFileToBucket)(bucket, fragmentFile, destination, bucketName, `fragment: ${fileName}`);
                if (success) {
                    uploadedCount++;
                }
                else {
                    failedCount++;
                }
            }
        }
        else {
            core.warning(`No fragment files found in ${buildFragmentsPath}`);
        }
        // 6.3: Upload query file (without -compiled suffix) to query/ folder
        const queryFile = path.join(buildQueryPath, `${game}-static-data-query.gql.ts`);
        if (fs.existsSync(queryFile)) {
            const destination = `${fullVersionPath}/query/${game}-static-data-query.gql.ts`;
            const success = await (0, bucket_utils_1.uploadFileToBucket)(bucket, queryFile, destination, bucketName, 'query file');
            if (success) {
                uploadedCount++;
            }
            else {
                failedCount++;
            }
        }
        else {
            core.warning(`Query file not found: ${queryFile}`);
        }
        // 6.4: Upload all files from gql-types folders to types/ folder
        const typeSourcePaths = [
            { path: buildTypesPath, name: 'gql-types' },
            { path: buildFragmentsTypesPath, name: 'fragments/gql-types' },
            { path: buildQueryTypesPath, name: 'query/gql-types' },
        ];
        let hasTypeFiles = false;
        for (const sourcePath of typeSourcePaths) {
            const typeFiles = getAllFilesRecursive(sourcePath.path);
            if (typeFiles.length > 0) {
                hasTypeFiles = true;
                for (const typeFile of typeFiles) {
                    const relativePath = path.relative(sourcePath.path, typeFile);
                    const gcsPath = relativePath.split(path.sep).join('/');
                    const destination = `${fullVersionPath}/types/${gcsPath}`;
                    const description = `type file from ${sourcePath.name}: ${relativePath}`;
                    const success = await (0, bucket_utils_1.uploadFileToBucket)(bucket, typeFile, destination, bucketName, description);
                    if (success) {
                        uploadedCount++;
                    }
                    else {
                        failedCount++;
                    }
                }
            }
        }
        if (!hasTypeFiles) {
            core.warning(`No type files found in any of the gql-types directories`);
        }
        // Step 6: Report results
        core.info(`✓ Upload completed: ${uploadedCount} files uploaded, ${failedCount} files failed`);
        if (failedCount > 0) {
            const errorMessage = `Failed to upload ${failedCount} file(s)`;
            core.setFailed(errorMessage);
            throw new Error(errorMessage);
        }
        core.info(`✓ All files successfully uploaded to gs://${bucketName}/${fullVersionPath}/`);
        // Step 7: Upload config.json
        try {
            const config = {
                name: `${versionFolder}/${game}-static-data-query-compiled.gql.ts`,
                schemaVersion: schemaVersion,
            };
            const basePath = (0, version_folder_utils_1.generateBasePath)(env, game);
            const configDestination = `${basePath}/config.json`;
            const configFile = bucket.file(configDestination);
            const configJson = JSON.stringify(config, null, 2);
            core.info(`Uploading config.json to gs://${bucketName}/${configDestination}`);
            await configFile.save(configJson, {
                contentType: 'application/json',
            });
            core.info(`✓ Config.json successfully uploaded`);
        }
        catch (error) {
            const errorMessage = `Failed to upload config.json: ${error instanceof Error ? error.message : String(error)}`;
            core.setFailed(errorMessage);
            throw error instanceof Error ? error : new Error(errorMessage);
        }
    }
    catch (error) {
        const errorMessage = `Unexpected error in uploadBuild: ${error instanceof Error ? error.message : String(error)}`;
        core.setFailed(errorMessage);
        throw error instanceof Error ? error : new Error(errorMessage);
    }
}


/***/ }),

/***/ 9258:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateFragments = generateFragments;
const run_cursor_generation_1 = __webpack_require__(5550);
const path_1 = __importDefault(__webpack_require__(6928));
async function generateFragments(options) {
    const { timeoutMs } = options;
    const promptFilePath = path_1.default.resolve(__dirname, 'generate-fragments.md');
    return await (0, run_cursor_generation_1.runCursorGeneration)({
        timeoutMs,
        prompt: `"Implement instructions in the file ${promptFilePath}"`,
    });
}


/***/ }),

/***/ 9328:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.uploadFileToBucket = uploadFileToBucket;
const core = __importStar(__webpack_require__(7157));
async function uploadFileToBucket(bucket, sourcePath, destination, bucketName, description) {
    try {
        const logPrefix = description ? `${description}: ` : '';
        core.info(`Uploading: ${logPrefix}${sourcePath} -> gs://${bucketName}/${destination}`);
        await bucket.upload(sourcePath, { destination });
        const successMessage = description ? `✓ Uploaded ${description}` : `✓ Uploaded file`;
        core.info(successMessage);
        return true;
    }
    catch (error) {
        const errorMessage = description
            ? `Failed to upload ${description}: ${error instanceof Error ? error.message : String(error)}`
            : `Failed to upload file: ${error instanceof Error ? error.message : String(error)}`;
        core.error(errorMessage);
        return false;
    }
}


/***/ }),

/***/ 9428:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.summary = exports.markdownSummary = exports.SUMMARY_DOCS_URL = exports.SUMMARY_ENV_VAR = void 0;
const os_1 = __webpack_require__(857);
const fs_1 = __webpack_require__(9896);
const { access, appendFile, writeFile } = fs_1.promises;
exports.SUMMARY_ENV_VAR = 'GITHUB_STEP_SUMMARY';
exports.SUMMARY_DOCS_URL = 'https://docs.github.com/actions/using-workflows/workflow-commands-for-github-actions#adding-a-job-summary';
class Summary {
    constructor() {
        this._buffer = '';
    }
    /**
     * Finds the summary file path from the environment, rejects if env var is not found or file does not exist
     * Also checks r/w permissions.
     *
     * @returns step summary file path
     */
    filePath() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._filePath) {
                return this._filePath;
            }
            const pathFromEnv = process.env[exports.SUMMARY_ENV_VAR];
            if (!pathFromEnv) {
                throw new Error(`Unable to find environment variable for $${exports.SUMMARY_ENV_VAR}. Check if your runtime environment supports job summaries.`);
            }
            try {
                yield access(pathFromEnv, fs_1.constants.R_OK | fs_1.constants.W_OK);
            }
            catch (_a) {
                throw new Error(`Unable to access summary file: '${pathFromEnv}'. Check if the file has correct read/write permissions.`);
            }
            this._filePath = pathFromEnv;
            return this._filePath;
        });
    }
    /**
     * Wraps content in an HTML tag, adding any HTML attributes
     *
     * @param {string} tag HTML tag to wrap
     * @param {string | null} content content within the tag
     * @param {[attribute: string]: string} attrs key-value list of HTML attributes to add
     *
     * @returns {string} content wrapped in HTML element
     */
    wrap(tag, content, attrs = {}) {
        const htmlAttrs = Object.entries(attrs)
            .map(([key, value]) => ` ${key}="${value}"`)
            .join('');
        if (!content) {
            return `<${tag}${htmlAttrs}>`;
        }
        return `<${tag}${htmlAttrs}>${content}</${tag}>`;
    }
    /**
     * Writes text in the buffer to the summary buffer file and empties buffer. Will append by default.
     *
     * @param {SummaryWriteOptions} [options] (optional) options for write operation
     *
     * @returns {Promise<Summary>} summary instance
     */
    write(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const overwrite = !!(options === null || options === void 0 ? void 0 : options.overwrite);
            const filePath = yield this.filePath();
            const writeFunc = overwrite ? writeFile : appendFile;
            yield writeFunc(filePath, this._buffer, { encoding: 'utf8' });
            return this.emptyBuffer();
        });
    }
    /**
     * Clears the summary buffer and wipes the summary file
     *
     * @returns {Summary} summary instance
     */
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.emptyBuffer().write({ overwrite: true });
        });
    }
    /**
     * Returns the current summary buffer as a string
     *
     * @returns {string} string of summary buffer
     */
    stringify() {
        return this._buffer;
    }
    /**
     * If the summary buffer is empty
     *
     * @returns {boolen} true if the buffer is empty
     */
    isEmptyBuffer() {
        return this._buffer.length === 0;
    }
    /**
     * Resets the summary buffer without writing to summary file
     *
     * @returns {Summary} summary instance
     */
    emptyBuffer() {
        this._buffer = '';
        return this;
    }
    /**
     * Adds raw text to the summary buffer
     *
     * @param {string} text content to add
     * @param {boolean} [addEOL=false] (optional) append an EOL to the raw text (default: false)
     *
     * @returns {Summary} summary instance
     */
    addRaw(text, addEOL = false) {
        this._buffer += text;
        return addEOL ? this.addEOL() : this;
    }
    /**
     * Adds the operating system-specific end-of-line marker to the buffer
     *
     * @returns {Summary} summary instance
     */
    addEOL() {
        return this.addRaw(os_1.EOL);
    }
    /**
     * Adds an HTML codeblock to the summary buffer
     *
     * @param {string} code content to render within fenced code block
     * @param {string} lang (optional) language to syntax highlight code
     *
     * @returns {Summary} summary instance
     */
    addCodeBlock(code, lang) {
        const attrs = Object.assign({}, (lang && { lang }));
        const element = this.wrap('pre', this.wrap('code', code), attrs);
        return this.addRaw(element).addEOL();
    }
    /**
     * Adds an HTML list to the summary buffer
     *
     * @param {string[]} items list of items to render
     * @param {boolean} [ordered=false] (optional) if the rendered list should be ordered or not (default: false)
     *
     * @returns {Summary} summary instance
     */
    addList(items, ordered = false) {
        const tag = ordered ? 'ol' : 'ul';
        const listItems = items.map(item => this.wrap('li', item)).join('');
        const element = this.wrap(tag, listItems);
        return this.addRaw(element).addEOL();
    }
    /**
     * Adds an HTML table to the summary buffer
     *
     * @param {SummaryTableCell[]} rows table rows
     *
     * @returns {Summary} summary instance
     */
    addTable(rows) {
        const tableBody = rows
            .map(row => {
            const cells = row
                .map(cell => {
                if (typeof cell === 'string') {
                    return this.wrap('td', cell);
                }
                const { header, data, colspan, rowspan } = cell;
                const tag = header ? 'th' : 'td';
                const attrs = Object.assign(Object.assign({}, (colspan && { colspan })), (rowspan && { rowspan }));
                return this.wrap(tag, data, attrs);
            })
                .join('');
            return this.wrap('tr', cells);
        })
            .join('');
        const element = this.wrap('table', tableBody);
        return this.addRaw(element).addEOL();
    }
    /**
     * Adds a collapsable HTML details element to the summary buffer
     *
     * @param {string} label text for the closed state
     * @param {string} content collapsable content
     *
     * @returns {Summary} summary instance
     */
    addDetails(label, content) {
        const element = this.wrap('details', this.wrap('summary', label) + content);
        return this.addRaw(element).addEOL();
    }
    /**
     * Adds an HTML image tag to the summary buffer
     *
     * @param {string} src path to the image you to embed
     * @param {string} alt text description of the image
     * @param {SummaryImageOptions} options (optional) addition image attributes
     *
     * @returns {Summary} summary instance
     */
    addImage(src, alt, options) {
        const { width, height } = options || {};
        const attrs = Object.assign(Object.assign({}, (width && { width })), (height && { height }));
        const element = this.wrap('img', null, Object.assign({ src, alt }, attrs));
        return this.addRaw(element).addEOL();
    }
    /**
     * Adds an HTML section heading element
     *
     * @param {string} text heading text
     * @param {number | string} [level=1] (optional) the heading level, default: 1
     *
     * @returns {Summary} summary instance
     */
    addHeading(text, level) {
        const tag = `h${level}`;
        const allowedTag = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)
            ? tag
            : 'h1';
        const element = this.wrap(allowedTag, text);
        return this.addRaw(element).addEOL();
    }
    /**
     * Adds an HTML thematic break (<hr>) to the summary buffer
     *
     * @returns {Summary} summary instance
     */
    addSeparator() {
        const element = this.wrap('hr', null);
        return this.addRaw(element).addEOL();
    }
    /**
     * Adds an HTML line break (<br>) to the summary buffer
     *
     * @returns {Summary} summary instance
     */
    addBreak() {
        const element = this.wrap('br', null);
        return this.addRaw(element).addEOL();
    }
    /**
     * Adds an HTML blockquote to the summary buffer
     *
     * @param {string} text quote text
     * @param {string} cite (optional) citation url
     *
     * @returns {Summary} summary instance
     */
    addQuote(text, cite) {
        const attrs = Object.assign({}, (cite && { cite }));
        const element = this.wrap('blockquote', text, attrs);
        return this.addRaw(element).addEOL();
    }
    /**
     * Adds an HTML anchor tag to the summary buffer
     *
     * @param {string} text link text/content
     * @param {string} href hyperlink
     *
     * @returns {Summary} summary instance
     */
    addLink(text, href) {
        const element = this.wrap('a', text, { href });
        return this.addRaw(element).addEOL();
    }
}
const _summary = new Summary();
/**
 * @deprecated use `core.summary`
 */
exports.markdownSummary = _summary;
exports.summary = _summary;
//# sourceMappingURL=summary.js.map

/***/ }),

/***/ 9485:
/***/ ((module) => {

module.exports = require("rimraf");

/***/ }),

/***/ 9580:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


// For internal use, subject to change.
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.prepareKeyValueMessage = exports.issueFileCommand = void 0;
// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */
const crypto = __importStar(__webpack_require__(6982));
const fs = __importStar(__webpack_require__(9896));
const os = __importStar(__webpack_require__(857));
const utils_1 = __webpack_require__(3621);
function issueFileCommand(command, message) {
    const filePath = process.env[`GITHUB_${command}`];
    if (!filePath) {
        throw new Error(`Unable to find environment variable for file command ${command}`);
    }
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing file at path: ${filePath}`);
    }
    fs.appendFileSync(filePath, `${(0, utils_1.toCommandValue)(message)}${os.EOL}`, {
        encoding: 'utf8'
    });
}
exports.issueFileCommand = issueFileCommand;
function prepareKeyValueMessage(key, value) {
    const delimiter = `ghadelimiter_${crypto.randomUUID()}`;
    const convertedValue = (0, utils_1.toCommandValue)(value);
    // These should realistically never happen, but just in case someone finds a
    // way to exploit uuid generation let's not allow keys or values that contain
    // the delimiter.
    if (key.includes(delimiter)) {
        throw new Error(`Unexpected input: name should not contain the delimiter "${delimiter}"`);
    }
    if (convertedValue.includes(delimiter)) {
        throw new Error(`Unexpected input: value should not contain the delimiter "${delimiter}"`);
    }
    return `${key}<<${delimiter}${os.EOL}${convertedValue}${os.EOL}${delimiter}`;
}
exports.prepareKeyValueMessage = prepareKeyValueMessage;
//# sourceMappingURL=file-command.js.map

/***/ }),

/***/ 9659:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OidcClient = void 0;
const http_client_1 = __webpack_require__(9736);
const auth_1 = __webpack_require__(8159);
const core_1 = __webpack_require__(7157);
class OidcClient {
    static createHttpClient(allowRetry = true, maxRetry = 10) {
        const requestOptions = {
            allowRetries: allowRetry,
            maxRetries: maxRetry
        };
        return new http_client_1.HttpClient('actions/oidc-client', [new auth_1.BearerCredentialHandler(OidcClient.getRequestToken())], requestOptions);
    }
    static getRequestToken() {
        const token = process.env['ACTIONS_ID_TOKEN_REQUEST_TOKEN'];
        if (!token) {
            throw new Error('Unable to get ACTIONS_ID_TOKEN_REQUEST_TOKEN env variable');
        }
        return token;
    }
    static getIDTokenUrl() {
        const runtimeUrl = process.env['ACTIONS_ID_TOKEN_REQUEST_URL'];
        if (!runtimeUrl) {
            throw new Error('Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable');
        }
        return runtimeUrl;
    }
    static getCall(id_token_url) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const httpclient = OidcClient.createHttpClient();
            const res = yield httpclient
                .getJson(id_token_url)
                .catch(error => {
                throw new Error(`Failed to get ID Token. \n 
        Error Code : ${error.statusCode}\n 
        Error Message: ${error.message}`);
            });
            const id_token = (_a = res.result) === null || _a === void 0 ? void 0 : _a.value;
            if (!id_token) {
                throw new Error('Response json body do not have ID Token field');
            }
            return id_token;
        });
    }
    static getIDToken(audience) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // New ID Token is requested from action service
                let id_token_url = OidcClient.getIDTokenUrl();
                if (audience) {
                    const encodedAudience = encodeURIComponent(audience);
                    id_token_url = `${id_token_url}&audience=${encodedAudience}`;
                }
                (0, core_1.debug)(`ID token url is ${id_token_url}`);
                const id_token = yield OidcClient.getCall(id_token_url);
                (0, core_1.setSecret)(id_token);
                return id_token;
            }
            catch (error) {
                throw new Error(`Error message: ${error.message}`);
            }
        });
    }
}
exports.OidcClient = OidcClient;
//# sourceMappingURL=oidc-utils.js.map

/***/ }),

/***/ 9736:
/***/ ((module) => {

module.exports = require("@actions/http-client");

/***/ }),

/***/ 9896:
/***/ ((module) => {

module.exports = require("fs");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(8156);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=index.js.map