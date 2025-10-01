#!/usr/bin/env node
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 112:
/***/ (function(module) {

/* global define */

(function (root, pluralize) {
  /* istanbul ignore else */
  if (true) {
    // Node.
    module.exports = pluralize();
  } else {}
})(this, function () {
  // Rule storage - pluralize and singularize need to be run sequentially,
  // while other rules can be optimized using an object for instant lookups.
  var pluralRules = [];
  var singularRules = [];
  var uncountables = {};
  var irregularPlurals = {};
  var irregularSingles = {};

  /**
   * Sanitize a pluralization rule to a usable regular expression.
   *
   * @param  {(RegExp|string)} rule
   * @return {RegExp}
   */
  function sanitizeRule (rule) {
    if (typeof rule === 'string') {
      return new RegExp('^' + rule + '$', 'i');
    }

    return rule;
  }

  /**
   * Pass in a word token to produce a function that can replicate the case on
   * another word.
   *
   * @param  {string}   word
   * @param  {string}   token
   * @return {Function}
   */
  function restoreCase (word, token) {
    // Tokens are an exact match.
    if (word === token) return token;

    // Lower cased words. E.g. "hello".
    if (word === word.toLowerCase()) return token.toLowerCase();

    // Upper cased words. E.g. "WHISKY".
    if (word === word.toUpperCase()) return token.toUpperCase();

    // Title cased words. E.g. "Title".
    if (word[0] === word[0].toUpperCase()) {
      return token.charAt(0).toUpperCase() + token.substr(1).toLowerCase();
    }

    // Lower cased words. E.g. "test".
    return token.toLowerCase();
  }

  /**
   * Interpolate a regexp string.
   *
   * @param  {string} str
   * @param  {Array}  args
   * @return {string}
   */
  function interpolate (str, args) {
    return str.replace(/\$(\d{1,2})/g, function (match, index) {
      return args[index] || '';
    });
  }

  /**
   * Replace a word using a rule.
   *
   * @param  {string} word
   * @param  {Array}  rule
   * @return {string}
   */
  function replace (word, rule) {
    return word.replace(rule[0], function (match, index) {
      var result = interpolate(rule[1], arguments);

      if (match === '') {
        return restoreCase(word[index - 1], result);
      }

      return restoreCase(match, result);
    });
  }

  /**
   * Sanitize a word by passing in the word and sanitization rules.
   *
   * @param  {string}   token
   * @param  {string}   word
   * @param  {Array}    rules
   * @return {string}
   */
  function sanitizeWord (token, word, rules) {
    // Empty string or doesn't need fixing.
    if (!token.length || uncountables.hasOwnProperty(token)) {
      return word;
    }

    var len = rules.length;

    // Iterate over the sanitization rules and use the first one to match.
    while (len--) {
      var rule = rules[len];

      if (rule[0].test(word)) return replace(word, rule);
    }

    return word;
  }

  /**
   * Replace a word with the updated word.
   *
   * @param  {Object}   replaceMap
   * @param  {Object}   keepMap
   * @param  {Array}    rules
   * @return {Function}
   */
  function replaceWord (replaceMap, keepMap, rules) {
    return function (word) {
      // Get the correct token and case restoration functions.
      var token = word.toLowerCase();

      // Check against the keep object map.
      if (keepMap.hasOwnProperty(token)) {
        return restoreCase(word, token);
      }

      // Check against the replacement map for a direct word replacement.
      if (replaceMap.hasOwnProperty(token)) {
        return restoreCase(word, replaceMap[token]);
      }

      // Run all the rules against the word.
      return sanitizeWord(token, word, rules);
    };
  }

  /**
   * Check if a word is part of the map.
   */
  function checkWord (replaceMap, keepMap, rules, bool) {
    return function (word) {
      var token = word.toLowerCase();

      if (keepMap.hasOwnProperty(token)) return true;
      if (replaceMap.hasOwnProperty(token)) return false;

      return sanitizeWord(token, token, rules) === token;
    };
  }

  /**
   * Pluralize or singularize a word based on the passed in count.
   *
   * @param  {string}  word      The word to pluralize
   * @param  {number}  count     How many of the word exist
   * @param  {boolean} inclusive Whether to prefix with the number (e.g. 3 ducks)
   * @return {string}
   */
  function pluralize (word, count, inclusive) {
    var pluralized = count === 1
      ? pluralize.singular(word) : pluralize.plural(word);

    return (inclusive ? count + ' ' : '') + pluralized;
  }

  /**
   * Pluralize a word.
   *
   * @type {Function}
   */
  pluralize.plural = replaceWord(
    irregularSingles, irregularPlurals, pluralRules
  );

  /**
   * Check if a word is plural.
   *
   * @type {Function}
   */
  pluralize.isPlural = checkWord(
    irregularSingles, irregularPlurals, pluralRules
  );

  /**
   * Singularize a word.
   *
   * @type {Function}
   */
  pluralize.singular = replaceWord(
    irregularPlurals, irregularSingles, singularRules
  );

  /**
   * Check if a word is singular.
   *
   * @type {Function}
   */
  pluralize.isSingular = checkWord(
    irregularPlurals, irregularSingles, singularRules
  );

  /**
   * Add a pluralization rule to the collection.
   *
   * @param {(string|RegExp)} rule
   * @param {string}          replacement
   */
  pluralize.addPluralRule = function (rule, replacement) {
    pluralRules.push([sanitizeRule(rule), replacement]);
  };

  /**
   * Add a singularization rule to the collection.
   *
   * @param {(string|RegExp)} rule
   * @param {string}          replacement
   */
  pluralize.addSingularRule = function (rule, replacement) {
    singularRules.push([sanitizeRule(rule), replacement]);
  };

  /**
   * Add an uncountable word rule.
   *
   * @param {(string|RegExp)} word
   */
  pluralize.addUncountableRule = function (word) {
    if (typeof word === 'string') {
      uncountables[word.toLowerCase()] = true;
      return;
    }

    // Set singular and plural references for the word.
    pluralize.addPluralRule(word, '$0');
    pluralize.addSingularRule(word, '$0');
  };

  /**
   * Add an irregular word definition.
   *
   * @param {string} single
   * @param {string} plural
   */
  pluralize.addIrregularRule = function (single, plural) {
    plural = plural.toLowerCase();
    single = single.toLowerCase();

    irregularSingles[single] = plural;
    irregularPlurals[plural] = single;
  };

  /**
   * Irregular rules.
   */
  [
    // Pronouns.
    ['I', 'we'],
    ['me', 'us'],
    ['he', 'they'],
    ['she', 'they'],
    ['them', 'them'],
    ['myself', 'ourselves'],
    ['yourself', 'yourselves'],
    ['itself', 'themselves'],
    ['herself', 'themselves'],
    ['himself', 'themselves'],
    ['themself', 'themselves'],
    ['is', 'are'],
    ['was', 'were'],
    ['has', 'have'],
    ['this', 'these'],
    ['that', 'those'],
    // Words ending in with a consonant and `o`.
    ['echo', 'echoes'],
    ['dingo', 'dingoes'],
    ['volcano', 'volcanoes'],
    ['tornado', 'tornadoes'],
    ['torpedo', 'torpedoes'],
    // Ends with `us`.
    ['genus', 'genera'],
    ['viscus', 'viscera'],
    // Ends with `ma`.
    ['stigma', 'stigmata'],
    ['stoma', 'stomata'],
    ['dogma', 'dogmata'],
    ['lemma', 'lemmata'],
    ['schema', 'schemata'],
    ['anathema', 'anathemata'],
    // Other irregular rules.
    ['ox', 'oxen'],
    ['axe', 'axes'],
    ['die', 'dice'],
    ['yes', 'yeses'],
    ['foot', 'feet'],
    ['eave', 'eaves'],
    ['goose', 'geese'],
    ['tooth', 'teeth'],
    ['quiz', 'quizzes'],
    ['human', 'humans'],
    ['proof', 'proofs'],
    ['carve', 'carves'],
    ['valve', 'valves'],
    ['looey', 'looies'],
    ['thief', 'thieves'],
    ['groove', 'grooves'],
    ['pickaxe', 'pickaxes'],
    ['passerby', 'passersby']
  ].forEach(function (rule) {
    return pluralize.addIrregularRule(rule[0], rule[1]);
  });

  /**
   * Pluralization rules.
   */
  [
    [/s?$/i, 's'],
    [/[^\u0000-\u007F]$/i, '$0'],
    [/([^aeiou]ese)$/i, '$1'],
    [/(ax|test)is$/i, '$1es'],
    [/(alias|[^aou]us|t[lm]as|gas|ris)$/i, '$1es'],
    [/(e[mn]u)s?$/i, '$1s'],
    [/([^l]ias|[aeiou]las|[ejzr]as|[iu]am)$/i, '$1'],
    [/(alumn|syllab|vir|radi|nucle|fung|cact|stimul|termin|bacill|foc|uter|loc|strat)(?:us|i)$/i, '$1i'],
    [/(alumn|alg|vertebr)(?:a|ae)$/i, '$1ae'],
    [/(seraph|cherub)(?:im)?$/i, '$1im'],
    [/(her|at|gr)o$/i, '$1oes'],
    [/(agend|addend|millenni|dat|extrem|bacteri|desiderat|strat|candelabr|errat|ov|symposi|curricul|automat|quor)(?:a|um)$/i, '$1a'],
    [/(apheli|hyperbat|periheli|asyndet|noumen|phenomen|criteri|organ|prolegomen|hedr|automat)(?:a|on)$/i, '$1a'],
    [/sis$/i, 'ses'],
    [/(?:(kni|wi|li)fe|(ar|l|ea|eo|oa|hoo)f)$/i, '$1$2ves'],
    [/([^aeiouy]|qu)y$/i, '$1ies'],
    [/([^ch][ieo][ln])ey$/i, '$1ies'],
    [/(x|ch|ss|sh|zz)$/i, '$1es'],
    [/(matr|cod|mur|sil|vert|ind|append)(?:ix|ex)$/i, '$1ices'],
    [/\b((?:tit)?m|l)(?:ice|ouse)$/i, '$1ice'],
    [/(pe)(?:rson|ople)$/i, '$1ople'],
    [/(child)(?:ren)?$/i, '$1ren'],
    [/eaux$/i, '$0'],
    [/m[ae]n$/i, 'men'],
    ['thou', 'you']
  ].forEach(function (rule) {
    return pluralize.addPluralRule(rule[0], rule[1]);
  });

  /**
   * Singularization rules.
   */
  [
    [/s$/i, ''],
    [/(ss)$/i, '$1'],
    [/(wi|kni|(?:after|half|high|low|mid|non|night|[^\w]|^)li)ves$/i, '$1fe'],
    [/(ar|(?:wo|[ae])l|[eo][ao])ves$/i, '$1f'],
    [/ies$/i, 'y'],
    [/\b([pl]|zomb|(?:neck|cross)?t|coll|faer|food|gen|goon|group|lass|talk|goal|cut)ies$/i, '$1ie'],
    [/\b(mon|smil)ies$/i, '$1ey'],
    [/\b((?:tit)?m|l)ice$/i, '$1ouse'],
    [/(seraph|cherub)im$/i, '$1'],
    [/(x|ch|ss|sh|zz|tto|go|cho|alias|[^aou]us|t[lm]as|gas|(?:her|at|gr)o|[aeiou]ris)(?:es)?$/i, '$1'],
    [/(analy|diagno|parenthe|progno|synop|the|empha|cri|ne)(?:sis|ses)$/i, '$1sis'],
    [/(movie|twelve|abuse|e[mn]u)s$/i, '$1'],
    [/(test)(?:is|es)$/i, '$1is'],
    [/(alumn|syllab|vir|radi|nucle|fung|cact|stimul|termin|bacill|foc|uter|loc|strat)(?:us|i)$/i, '$1us'],
    [/(agend|addend|millenni|dat|extrem|bacteri|desiderat|strat|candelabr|errat|ov|symposi|curricul|quor)a$/i, '$1um'],
    [/(apheli|hyperbat|periheli|asyndet|noumen|phenomen|criteri|organ|prolegomen|hedr|automat)a$/i, '$1on'],
    [/(alumn|alg|vertebr)ae$/i, '$1a'],
    [/(cod|mur|sil|vert|ind)ices$/i, '$1ex'],
    [/(matr|append)ices$/i, '$1ix'],
    [/(pe)(rson|ople)$/i, '$1rson'],
    [/(child)ren$/i, '$1'],
    [/(eau)x?$/i, '$1'],
    [/men$/i, 'man']
  ].forEach(function (rule) {
    return pluralize.addSingularRule(rule[0], rule[1]);
  });

  /**
   * Uncountable rules.
   */
  [
    // Singular words with no plurals.
    'adulthood',
    'advice',
    'agenda',
    'aid',
    'aircraft',
    'alcohol',
    'ammo',
    'analytics',
    'anime',
    'athletics',
    'audio',
    'bison',
    'blood',
    'bream',
    'buffalo',
    'butter',
    'carp',
    'cash',
    'chassis',
    'chess',
    'clothing',
    'cod',
    'commerce',
    'cooperation',
    'corps',
    'debris',
    'diabetes',
    'digestion',
    'elk',
    'energy',
    'equipment',
    'excretion',
    'expertise',
    'firmware',
    'flounder',
    'fun',
    'gallows',
    'garbage',
    'graffiti',
    'hardware',
    'headquarters',
    'health',
    'herpes',
    'highjinks',
    'homework',
    'housework',
    'information',
    'jeans',
    'justice',
    'kudos',
    'labour',
    'literature',
    'machinery',
    'mackerel',
    'mail',
    'media',
    'mews',
    'moose',
    'music',
    'mud',
    'manga',
    'news',
    'only',
    'personnel',
    'pike',
    'plankton',
    'pliers',
    'police',
    'pollution',
    'premises',
    'rain',
    'research',
    'rice',
    'salmon',
    'scissors',
    'series',
    'sewage',
    'shambles',
    'shrimp',
    'software',
    'species',
    'staff',
    'swine',
    'tennis',
    'traffic',
    'transportation',
    'trout',
    'tuna',
    'wealth',
    'welfare',
    'whiting',
    'wildebeest',
    'wildlife',
    'you',
    /pok[eé]mon$/i,
    // Regexes.
    /[^aeiou]ese$/i, // "chinese", "japanese"
    /deer$/i, // "deer", "reindeer"
    /fish$/i, // "fish", "blowfish", "angelfish"
    /measles$/i,
    /o[iu]s$/i, // "carnivorous"
    /pox$/i, // "chickpox", "smallpox"
    /sheep$/i
  ].forEach(pluralize.addUncountableRule);

  return pluralize;
});


/***/ }),

/***/ 323:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.generateSchemaFromData = void 0;
const pluralize_1 = __importDefault(__nccwpck_require__(112));
const schema_1 = __nccwpck_require__(60);
// Utility functions
const capitalize = (s) => {
    if (!s)
        return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
};
const buildObjectName = (parentPath, objFieldName) => {
    if (!parentPath) {
        return objFieldName;
    }
    return parentPath + capitalize(objFieldName);
};
const detectArrayType = (arr) => {
    if (arr.length === 0) {
        return { type: schema_1.FIELD_TYPES.STRING, valid: false };
    }
    const firstItem = arr[0];
    if (firstItem === null || firstItem === undefined) {
        return { type: schema_1.FIELD_TYPES.STRING, valid: false };
    }
    switch (typeof firstItem) {
        case 'boolean':
            return { type: schema_1.FIELD_TYPES.BOOLEAN, valid: true };
        case 'string':
            return { type: schema_1.FIELD_TYPES.STRING, valid: true };
        case 'object':
            if (firstItem !== null && !Array.isArray(firstItem)) {
                return { type: schema_1.FIELD_TYPES.OBJECT, valid: true };
            }
            return { type: schema_1.FIELD_TYPES.STRING, valid: false };
        default:
            return { type: schema_1.FIELD_TYPES.STRING, valid: false };
    }
};
const mergeObjectConfigs = (existing, newConfig) => {
    const result = {
        fields: { ...existing.fields },
    };
    for (const [fieldName, fieldConfig] of Object.entries(newConfig.fields)) {
        if (!(fieldName in result.fields)) {
            result.fields[fieldName] = fieldConfig;
        }
    }
    return result;
};
const createGroupConfBuilder = (source, groupName) => ({
    source,
    groupName,
    fields: {},
    objects: {},
});
const resolveRefTarget = (builder, fieldName, array) => {
    let refGroup = fieldName.replace(new RegExp(schema_1.REF_FIELD_NAME_SUFFIX + '$'), '');
    if (!array) {
        if (pluralize_1.default.isSingular(refGroup)) {
            refGroup = pluralize_1.default.plural(refGroup);
        }
    }
    if (!(refGroup in builder.source)) {
        return schema_1.MANUAL_FILL_PLACEHOLDER;
    }
    return refGroup;
};
const detectFieldConfig = (builder, fieldName, value) => {
    const fieldConfig = { type: schema_1.FIELD_TYPES.STRING };
    switch (typeof value) {
        case 'boolean':
            fieldConfig.type = schema_1.FIELD_TYPES.BOOLEAN;
            break;
        case 'string':
            fieldConfig.type = schema_1.FIELD_TYPES.STRING;
            break;
        case 'object':
            if (value === null) {
                return { config: fieldConfig, valid: false };
            }
            if (Array.isArray(value)) {
                fieldConfig.array = true;
                if (value.length === 0) {
                    return { config: fieldConfig, valid: false };
                }
                const arrayTypeResult = detectArrayType(value);
                if (!arrayTypeResult.valid) {
                    return { config: fieldConfig, valid: false };
                }
                fieldConfig.type = arrayTypeResult.type;
                if (arrayTypeResult.type === schema_1.FIELD_TYPES.OBJECT) {
                    fieldConfig.objName = fieldName;
                }
            }
            else {
                fieldConfig.type = schema_1.FIELD_TYPES.OBJECT;
                fieldConfig.objName = fieldName;
            }
            break;
        default:
            return { config: fieldConfig, valid: false };
    }
    if (fieldName.endsWith(schema_1.REFERENCE_SUFFIX)) {
        fieldConfig.type = schema_1.FIELD_TYPES.REF;
        fieldConfig.refTo = resolveRefTarget(builder, fieldName, fieldConfig.array || false);
    }
    return { config: fieldConfig, valid: true };
};
const detectGroupFields = (builder, fieldName, value) => {
    const result = detectFieldConfig(builder, fieldName, value);
    if (!result.valid) {
        return;
    }
    if (fieldName in builder.fields) {
        return;
    }
    // Set required and filter for mandatory fields
    if (schema_1.REQUIRED_FIELD_NAMES.includes(fieldName)) {
        result.config.required = true;
        result.config.filter = true;
    }
    builder.fields[fieldName] = result.config;
};
const analyzeObjectStructure = (builder, objFieldName, obj, parentPath) => {
    const objConfig = {
        fields: {},
    };
    for (const [fieldName, value] of Object.entries(obj)) {
        if (value === null || value === undefined) {
            continue;
        }
        const result = detectFieldConfig(builder, fieldName, value);
        if (!result.valid) {
            continue;
        }
        const detected = result.config;
        if (detected.type === schema_1.FIELD_TYPES.OBJECT) {
            const nestedObjectParentPath = buildObjectName(parentPath, objFieldName);
            detected.objName = buildObjectName(nestedObjectParentPath, fieldName);
        }
        objConfig.fields[fieldName] = detected;
    }
    return objConfig;
};
const analyzeObjectStructureFromArray = (builder, fieldName, arr, parentPath) => {
    let accumulated = { fields: {} };
    for (const item of arr) {
        if (typeof item !== 'object' || item === null || Array.isArray(item)) {
            continue;
        }
        const objStruct = analyzeObjectStructure(builder, fieldName, item, parentPath);
        accumulated = mergeObjectConfigs(accumulated, objStruct);
    }
    return accumulated;
};
const detectObjectConfig = (builder, fieldName, value, parentPath) => {
    if (typeof value !== 'object' || value === null) {
        return { config: { fields: {} }, valid: false };
    }
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return { config: { fields: {} }, valid: false };
        }
        if (typeof value[0] !== 'object' || value[0] === null || Array.isArray(value[0])) {
            return { config: { fields: {} }, valid: false };
        }
        return {
            config: analyzeObjectStructureFromArray(builder, fieldName, value, parentPath),
            valid: true,
        };
    }
    else {
        return {
            config: analyzeObjectStructure(builder, fieldName, value, parentPath),
            valid: true,
        };
    }
};
const detectGroupObjects = (builder, fieldName, value, parentPath) => {
    if (value === null || value === undefined) {
        return;
    }
    const result = detectObjectConfig(builder, fieldName, value, parentPath);
    if (!result.valid || Object.keys(result.config.fields).length === 0) {
        return;
    }
    const fullObjName = buildObjectName(parentPath, fieldName);
    if (fullObjName in builder.objects) {
        const existing = builder.objects[fullObjName];
        builder.objects[fullObjName] = mergeObjectConfigs(existing, result.config);
    }
    else {
        builder.objects[fullObjName] = result.config;
    }
    if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
            for (const item of value) {
                if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                    for (const [k, vv] of Object.entries(item)) {
                        detectGroupObjects(builder, k, vv, fullObjName);
                    }
                }
            }
        }
        else {
            for (const [k, vv] of Object.entries(value)) {
                detectGroupObjects(builder, k, vv, fullObjName);
            }
        }
    }
};
const buildGroupConfig = (builder, groupEntries) => {
    if (groupEntries.length === 0) {
        return false;
    }
    for (const gEntry of groupEntries) {
        if (Object.keys(gEntry).length === 0) {
            continue;
        }
        for (const [fieldName, value] of Object.entries(gEntry)) {
            if (value === null || value === undefined) {
                continue;
            }
            detectGroupFields(builder, fieldName, value);
            detectGroupObjects(builder, fieldName, value, '');
        }
    }
    return true;
};
const generateSchemaFromData = (source) => {
    const schema = {
        namespace: schema_1.MANUAL_FILL_PLACEHOLDER,
        typePrefix: schema_1.MANUAL_FILL_PLACEHOLDER,
        groups: {},
    };
    for (const [groupName, groupEntries] of Object.entries(source)) {
        if (!Array.isArray(groupEntries) || groupEntries.length === 0) {
            continue;
        }
        const builder = createGroupConfBuilder(source, groupName);
        const success = buildGroupConfig(builder, groupEntries);
        if (!success) {
            continue;
        }
        const groupConfig = {
            fields: builder.fields,
        };
        if (Object.keys(builder.objects).length > 0) {
            groupConfig.objects = builder.objects;
        }
        schema.groups[groupName] = groupConfig;
    }
    return schema;
};
exports.generateSchemaFromData = generateSchemaFromData;


/***/ }),

/***/ 950:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.processSchemaGeneration = exports.findLatestStaticDataFile = exports.parseVersionFromFilename = exports.writeJsonFile = exports.readJsonFile = void 0;
const fs = __importStar(__nccwpck_require__(896));
const path = __importStar(__nccwpck_require__(928));
const schema_1 = __nccwpck_require__(60);
const build_1 = __nccwpck_require__(323);
const merge_1 = __nccwpck_require__(107);
const serialization_1 = __nccwpck_require__(55);
// File system operations
const readJsonFile = (filePath) => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    }
    catch (error) {
        throw new Error(`Error reading file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.readJsonFile = readJsonFile;
const writeJsonFile = (filePath, data) => {
    try {
        const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        fs.writeFileSync(filePath, content, 'utf8');
    }
    catch (error) {
        throw new Error(`Error writing file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.writeJsonFile = writeJsonFile;
// Version parsing and file finding utilities
const parseVersionFromFilename = (filename) => {
    // Match patterns like: static_data_v0.0.2.json, static_data_v1.2.3.json
    const versionMatch = filename.match(/static_data_v(\d+)\.(\d+)\.(\d+)\.json$/);
    if (!versionMatch) {
        return null;
    }
    const major = parseInt(versionMatch[1], 10);
    const minor = parseInt(versionMatch[2], 10);
    const patch = parseInt(versionMatch[3], 10);
    return {
        file: filename,
        version: versionMatch[0].replace(/\.json$/, ''),
        major,
        minor,
        patch
    };
};
exports.parseVersionFromFilename = parseVersionFromFilename;
const findLatestStaticDataFile = (staticDataPath) => {
    if (!fs.existsSync(staticDataPath)) {
        throw new Error(`Static data path does not exist: ${staticDataPath}`);
    }
    if (!fs.statSync(staticDataPath).isDirectory()) {
        throw new Error(`Static data path is not a directory: ${staticDataPath}`);
    }
    const files = fs.readdirSync(staticDataPath);
    const versionFiles = [];
    // Find all files matching the version pattern
    for (const file of files) {
        const versionInfo = (0, exports.parseVersionFromFilename)(file);
        if (versionInfo) {
            versionFiles.push(versionInfo);
        }
    }
    if (versionFiles.length === 0) {
        throw new Error(`No versioned static data files found in: ${staticDataPath}`);
    }
    // Sort by version (latest first)
    versionFiles.sort((a, b) => {
        if (a.major !== b.major)
            return b.major - a.major;
        if (a.minor !== b.minor)
            return b.minor - a.minor;
        return b.patch - a.patch;
    });
    const latestFile = path.join(staticDataPath, versionFiles[0].file);
    console.log(`Found latest static data file: ${versionFiles[0].file} (v${versionFiles[0].major}.${versionFiles[0].minor}.${versionFiles[0].patch})`);
    return latestFile;
};
exports.findLatestStaticDataFile = findLatestStaticDataFile;
// Main processing function
const processSchemaGeneration = (config) => {
    console.log(`Processing static data from path: ${config.staticDataPath}`);
    // Find the latest static data file
    const inputFilePath = (0, exports.findLatestStaticDataFile)(config.staticDataPath);
    // Read input data
    const jsonData = (0, exports.readJsonFile)(inputFilePath);
    // Generate schema
    let schema = (0, build_1.generateSchemaFromData)(jsonData);
    // Merge with existing schema if available
    if (config.existingSchemaPath && fs.existsSync(config.existingSchemaPath)) {
        console.log(`Merging with existing schema: ${config.existingSchemaPath}`);
        const existingSchemaData = (0, exports.readJsonFile)(config.existingSchemaPath);
        schema = (0, merge_1.mergeWithExistingSchema)(schema, existingSchemaData, config.ignoreDeleted || false);
    }
    // Apply ref-config if available
    if (config.refConfigPath && fs.existsSync(config.refConfigPath)) {
        console.log(`Applying ref-config: ${config.refConfigPath}`);
        const refConfigData = (0, exports.readJsonFile)(config.refConfigPath);
        schema = (0, schema_1.applyRefConfig)(schema, refConfigData);
    }
    // Serialize to JSON
    const processedSchema = (0, serialization_1.serializeToJson)(schema);
    // Write output file if specified
    if (config.outputFilePath) {
        (0, exports.writeJsonFile)(config.outputFilePath, processedSchema);
        console.log(`Schema written to: ${config.outputFilePath}`);
    }
    return processedSchema;
};
exports.processSchemaGeneration = processSchemaGeneration;


/***/ }),

/***/ 730:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

/**
 * Schema Generator - Main entry point
 *
 * This file serves as the main entry point and re-exports all functionality
 * from the refactored modules for backward compatibility.
 * It also provides CLI functionality when executed directly.
 */
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
exports.processSchemaGeneration = exports.findLatestStaticDataFile = exports.parseVersionFromFilename = exports.writeJsonFile = exports.readJsonFile = exports.generateSchemaFromData = exports.serializeToJson = exports.mergeWithExistingSchema = exports.mergeGroupObjects = exports.mergeFields = exports.mergeFieldConfig = exports.applyRefConfig = exports.REF_FIELD_NAME_SUFFIX = exports.REFERENCE_SUFFIX = exports.MANUAL_FILL_PLACEHOLDER = exports.REQUIRED_FIELD_NAMES = exports.FIELD_TYPES = void 0;
const fs = __importStar(__nccwpck_require__(896));
const path = __importStar(__nccwpck_require__(928));
// Re-export types and schema operations from schema.ts
var schema_1 = __nccwpck_require__(60);
Object.defineProperty(exports, "FIELD_TYPES", ({ enumerable: true, get: function () { return schema_1.FIELD_TYPES; } }));
Object.defineProperty(exports, "REQUIRED_FIELD_NAMES", ({ enumerable: true, get: function () { return schema_1.REQUIRED_FIELD_NAMES; } }));
Object.defineProperty(exports, "MANUAL_FILL_PLACEHOLDER", ({ enumerable: true, get: function () { return schema_1.MANUAL_FILL_PLACEHOLDER; } }));
Object.defineProperty(exports, "REFERENCE_SUFFIX", ({ enumerable: true, get: function () { return schema_1.REFERENCE_SUFFIX; } }));
Object.defineProperty(exports, "REF_FIELD_NAME_SUFFIX", ({ enumerable: true, get: function () { return schema_1.REF_FIELD_NAME_SUFFIX; } }));
Object.defineProperty(exports, "applyRefConfig", ({ enumerable: true, get: function () { return schema_1.applyRefConfig; } }));
// Re-export merge functions from merge.ts
var merge_1 = __nccwpck_require__(107);
Object.defineProperty(exports, "mergeFieldConfig", ({ enumerable: true, get: function () { return merge_1.mergeFieldConfig; } }));
Object.defineProperty(exports, "mergeFields", ({ enumerable: true, get: function () { return merge_1.mergeFields; } }));
Object.defineProperty(exports, "mergeGroupObjects", ({ enumerable: true, get: function () { return merge_1.mergeGroupObjects; } }));
Object.defineProperty(exports, "mergeWithExistingSchema", ({ enumerable: true, get: function () { return merge_1.mergeWithExistingSchema; } }));
// Re-export serialization functions from serialization.ts
var serialization_1 = __nccwpck_require__(55);
Object.defineProperty(exports, "serializeToJson", ({ enumerable: true, get: function () { return serialization_1.serializeToJson; } }));
// Re-export schema building functions from build.ts
var build_1 = __nccwpck_require__(323);
Object.defineProperty(exports, "generateSchemaFromData", ({ enumerable: true, get: function () { return build_1.generateSchemaFromData; } }));
// Re-export generator functions from generator.ts
var generator_1 = __nccwpck_require__(950);
Object.defineProperty(exports, "readJsonFile", ({ enumerable: true, get: function () { return generator_1.readJsonFile; } }));
Object.defineProperty(exports, "writeJsonFile", ({ enumerable: true, get: function () { return generator_1.writeJsonFile; } }));
Object.defineProperty(exports, "parseVersionFromFilename", ({ enumerable: true, get: function () { return generator_1.parseVersionFromFilename; } }));
Object.defineProperty(exports, "findLatestStaticDataFile", ({ enumerable: true, get: function () { return generator_1.findLatestStaticDataFile; } }));
Object.defineProperty(exports, "processSchemaGeneration", ({ enumerable: true, get: function () { return generator_1.processSchemaGeneration; } }));
const generator_2 = __nccwpck_require__(950);
// CLI functionality
const runCLI = () => {
    const args = process.argv.slice(2);
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log(`
Schema Generator - TypeScript Version

Usage: node schema-generator.js <static-data-path> [options]

Arguments:
  <static-data-path>        Path to the directory containing versioned static data files
                            (e.g., static_data_v0.0.1.json, static_data_v0.0.2.json)
                            The script will automatically find and use the latest version.

Options:
  --output, -o <file>       Output file path (default: static_data_latest_schema.json)
  --existing, -e <file>     Path to existing schema file to merge with
  --ref-config, -r <file>   Path to ref-config file
  --ignore-deleted          Ignore deleted fields/groups from existing schema (keeps metadata & refTo)
  --help, -h                Show this help message

Examples:
  node schema-generator.js ./data/static_data/
  node schema-generator.js ./data/static_data/ --output schema.json
  node schema-generator.js ./data/static_data/ --existing existing.json --ref-config refs.json
  node schema-generator.js /full/path/to/static_data/
        `);
        process.exit(0);
    }
    const staticDataPath = args[0];
    if (!fs.existsSync(staticDataPath)) {
        console.error(`Error: Static data path '${staticDataPath}' does not exist`);
        process.exit(1);
    }
    // Parse command line options
    let outputFile;
    let existingSchemaFile;
    let refConfigFile;
    let ignoreDeleted = false;
    for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        const nextArg = args[i + 1];
        switch (arg) {
            case '--output':
            case '-o':
                if (nextArg && !nextArg.startsWith('-')) {
                    outputFile = nextArg;
                    i++; // Skip next argument
                }
                else {
                    console.error('Error: --output requires a file path');
                    process.exit(1);
                }
                break;
            case '--existing':
            case '-e':
                if (nextArg && !nextArg.startsWith('-')) {
                    existingSchemaFile = nextArg;
                    i++; // Skip next argument
                }
                else {
                    console.error('Error: --existing requires a file path');
                    process.exit(1);
                }
                break;
            case '--ref-config':
            case '-r':
                if (nextArg && !nextArg.startsWith('-')) {
                    refConfigFile = nextArg;
                    i++; // Skip next argument
                }
                else {
                    console.error('Error: --ref-config requires a file path');
                    process.exit(1);
                }
                break;
            case '--ignore-deleted':
                ignoreDeleted = true;
                break;
        }
    }
    // Set default output file if not specified
    if (!outputFile) {
        const staticDataDir = path.dirname(staticDataPath);
        outputFile = path.join(staticDataDir, 'schema.json');
    }
    try {
        const config = {
            staticDataPath,
            outputFilePath: outputFile,
            existingSchemaPath: existingSchemaFile,
            refConfigPath: refConfigFile,
            ignoreDeleted: ignoreDeleted
        };
        const result = (0, generator_2.processSchemaGeneration)(config);
        console.log('Schema generation completed successfully!');
        console.log(`Output written to: ${outputFile}`);
    }
    catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }
};
// Execute CLI when file is run directly (not when imported as a module)
if (require.main === require.cache[eval('__filename')]) {
    runCLI();
}


/***/ }),

/***/ 107:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.mergeWithExistingSchema = exports.mergeGroupObjects = exports.mergeFields = exports.mergeFieldConfig = void 0;
const schema_1 = __nccwpck_require__(60);
// Helper function to merge field configurations
const mergeFieldConfig = (newFieldConfig, existingFieldConfig) => {
    const merged = { ...newFieldConfig };
    // Override refTo from existing if present
    if (!newFieldConfig.refTo || newFieldConfig.refTo === schema_1.MANUAL_FILL_PLACEHOLDER) {
        if (existingFieldConfig.refTo && existingFieldConfig.refTo !== schema_1.MANUAL_FILL_PLACEHOLDER) {
            merged.refTo = existingFieldConfig.refTo;
        }
    }
    // Override refFilters from existing if present
    if (existingFieldConfig.refFilters) {
        merged.refFilters = existingFieldConfig.refFilters;
    }
    // Override filter from existing if it's true
    if (existingFieldConfig.filter === true) {
        merged.filter = true;
    }
    // Override required from existing if it's true
    if (existingFieldConfig.required === true) {
        merged.required = true;
    }
    return merged;
};
exports.mergeFieldConfig = mergeFieldConfig;
// Helper function to merge fields (works for both group fields and object fields)
const mergeFields = (newFields, existingFields, ignoreDeleted) => {
    // First, merge fields that exist in new schema
    Object.keys(newFields).forEach(fieldName => {
        if (existingFields[fieldName]) {
            // Field exists in both - merge configurations selectively
            newFields[fieldName] = (0, exports.mergeFieldConfig)(newFields[fieldName], existingFields[fieldName]);
        }
    });
    // Then, add fields that only exist in existing schema (if not ignoring deleted)
    if (!ignoreDeleted) {
        Object.keys(existingFields).forEach(fieldName => {
            if (!newFields[fieldName]) {
                // Field only exists in existing schema - add it completely
                newFields[fieldName] = existingFields[fieldName];
            }
        });
    }
};
exports.mergeFields = mergeFields;
// Helper function to merge group objects
const mergeGroupObjects = (newGroup, existingGroupObjects, ignoreDeleted) => {
    // First, merge objects that exist in new schema
    if (newGroup.objects) {
        Object.keys(newGroup.objects).forEach(objName => {
            const existingObj = existingGroupObjects[objName];
            if (existingObj?.fields) {
                // Object exists in both - merge fields
                (0, exports.mergeFields)(newGroup.objects[objName].fields, existingObj.fields, ignoreDeleted);
            }
        });
    }
    // Then, add objects that only exist in existing schema (if not ignoring deleted)
    if (!ignoreDeleted) {
        Object.keys(existingGroupObjects).forEach(objName => {
            if (!newGroup.objects?.[objName]) {
                // Object only exists in existing schema - add it completely
                if (!newGroup.objects) {
                    newGroup.objects = {};
                }
                newGroup.objects[objName] = existingGroupObjects[objName];
            }
        });
    }
};
exports.mergeGroupObjects = mergeGroupObjects;
// Function to merge existing schema with new schema
const mergeWithExistingSchema = (newSchema, existingSchema, ignoreDeleted = false) => {
    if (!existingSchema || !existingSchema.groups) {
        return newSchema;
    }
    const result = JSON.parse(JSON.stringify(newSchema));
    // Always use namespace and typePrefix from existing schema if available
    if (existingSchema.namespace && existingSchema.namespace !== schema_1.MANUAL_FILL_PLACEHOLDER) {
        result.namespace = existingSchema.namespace;
    }
    if (existingSchema.typePrefix && existingSchema.typePrefix !== schema_1.MANUAL_FILL_PLACEHOLDER) {
        result.typePrefix = existingSchema.typePrefix;
    }
    // Always copy gqlTypesOverrides from existing schema if it exists
    if (existingSchema.gqlTypesOverrides) {
        result.gqlTypesOverrides = existingSchema.gqlTypesOverrides;
    }
    // First, merge groups that exist in new schema
    Object.keys(result.groups).forEach(groupName => {
        const existingGroup = existingSchema.groups[groupName];
        if (existingGroup) {
            const newGroup = result.groups[groupName];
            // Merge fields
            if (existingGroup.fields) {
                (0, exports.mergeFields)(newGroup.fields, existingGroup.fields, ignoreDeleted);
            }
            // Merge objects
            if (existingGroup.objects) {
                (0, exports.mergeGroupObjects)(newGroup, existingGroup.objects, ignoreDeleted);
            }
        }
    });
    // Then, add groups that only exist in existing schema (if not ignoring deleted)
    if (!ignoreDeleted) {
        Object.keys(existingSchema.groups).forEach(groupName => {
            if (!result.groups[groupName]) {
                // Group only exists in existing schema - add it completely
                result.groups[groupName] = existingSchema.groups[groupName];
            }
        });
    }
    return result;
};
exports.mergeWithExistingSchema = mergeWithExistingSchema;


/***/ }),

/***/ 60:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.applyRefConfig = exports.REF_FIELD_NAME_SUFFIX = exports.REFERENCE_SUFFIX = exports.MANUAL_FILL_PLACEHOLDER = exports.REQUIRED_FIELD_NAMES = exports.FIELD_TYPES = void 0;
// Constants
exports.FIELD_TYPES = {
    STRING: 'String',
    BOOLEAN: 'Boolean',
    OBJECT: 'Object',
    REF: 'Ref',
};
exports.REQUIRED_FIELD_NAMES = ['id', 'slug', 'name'];
exports.MANUAL_FILL_PLACEHOLDER = '@@@ TO BE FILLED MANUALLY @@@';
exports.REFERENCE_SUFFIX = 'Ref';
exports.REF_FIELD_NAME_SUFFIX = 'Ref';
// Function to apply ref-config mappings
const applyRefConfig = (schema, refConfig) => {
    if (!refConfig || !refConfig.refs)
        return schema;
    const refMap = {};
    refConfig.refs.forEach(ref => {
        refMap[ref.from] = ref.to;
    });
    // Create a deep copy of the schema
    const result = JSON.parse(JSON.stringify(schema));
    // Iterate through groups
    Object.keys(result.groups).forEach(groupName => {
        const group = result.groups[groupName];
        // Check fields in the group
        if (group.fields) {
            Object.keys(group.fields).forEach(fieldName => {
                const field = group.fields[fieldName];
                const fullPath = `${groupName}.${fieldName}`;
                if (field.type === 'Ref' && field.refTo === exports.MANUAL_FILL_PLACEHOLDER) {
                    if (refMap[fullPath]) {
                        field.refTo = refMap[fullPath];
                    }
                }
            });
        }
        // Check fields in nested objects
        if (group.objects) {
            Object.keys(group.objects).forEach(objName => {
                const obj = group.objects[objName];
                if (obj.fields) {
                    Object.keys(obj.fields).forEach(fieldName => {
                        const field = obj.fields[fieldName];
                        // For nested objects, we need to construct the path differently
                        // The path should be groupName.fieldName for the original data structure
                        const fullPath = `${groupName}.${fieldName}`;
                        if (field.type === 'Ref' && field.refTo === exports.MANUAL_FILL_PLACEHOLDER) {
                            if (refMap[fullPath]) {
                                field.refTo = refMap[fullPath];
                            }
                        }
                    });
                }
            });
        }
    });
    return result;
};
exports.applyRefConfig = applyRefConfig;


/***/ }),

/***/ 55:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.serializeToJson = void 0;
const writeFieldConfigInline = (fieldConfig) => {
    const parts = [`"type": "${fieldConfig.type}"`];
    if (fieldConfig.array) {
        parts.push('"array": true');
    }
    if (fieldConfig.filter) {
        parts.push('"filter": true');
    }
    if (fieldConfig.required) {
        parts.push('"required": true');
    }
    if (fieldConfig.objName) {
        parts.push(`"objName": "${fieldConfig.objName}"`);
    }
    if (fieldConfig.refTo) {
        parts.push(`"refTo": "${fieldConfig.refTo}"`);
    }
    if (fieldConfig.refFilters) {
        parts.push(`"refFilters": ${JSON.stringify(fieldConfig.refFilters)}`);
    }
    return `{ ${parts.join(', ')} }`;
};
const serializeToJson = (cfg) => {
    const indent = (n) => '  '.repeat(n);
    const lines = [];
    lines.push('{');
    lines.push(`${indent(1)}"namespace": "${cfg.namespace}",`);
    lines.push(`${indent(1)}"typePrefix": "${cfg.typePrefix}",`);
    // Add gqlTypesOverrides if it exists
    if (cfg.gqlTypesOverrides && Object.keys(cfg.gqlTypesOverrides).length > 0) {
        const gqlTypesOverridesJson = JSON.stringify(cfg.gqlTypesOverrides, null, 2);
        const indentedJson = gqlTypesOverridesJson.split('\n').map((line, idx) => idx === 0 ? line : indent(1) + line).join('\n');
        lines.push(`${indent(1)}"gqlTypesOverrides": ${indentedJson},`);
    }
    lines.push(`${indent(1)}"groups": {`);
    const groupNames = Object.keys(cfg.groups).sort();
    groupNames.forEach((groupName, groupIdx) => {
        const group = cfg.groups[groupName];
        lines.push(`${indent(2)}"${groupName}": {`);
        lines.push(`${indent(3)}"fields": {`);
        const fieldNames = Object.keys(group.fields).sort();
        if (fieldNames.length > 0) {
            fieldNames.forEach((fieldName, fieldIdx) => {
                const fieldConfig = group.fields[fieldName];
                const comma = fieldIdx < fieldNames.length - 1 ? ',' : '';
                lines.push(`${indent(4)}"${fieldName}": ${writeFieldConfigInline(fieldConfig)}${comma}`);
            });
        }
        if (group.objects && Object.keys(group.objects).length > 0) {
            lines.push(`${indent(3)}},`);
            lines.push(`${indent(3)}"objects": {`);
            const objNames = Object.keys(group.objects).sort();
            objNames.forEach((objName, objIdx) => {
                const obj = group.objects[objName];
                lines.push(`${indent(4)}"${objName}": {`);
                lines.push(`${indent(5)}"fields": {`);
                const objFieldNames = Object.keys(obj.fields).sort();
                if (objFieldNames.length > 0) {
                    objFieldNames.forEach((fieldName, fieldIdx) => {
                        const fieldConfig = obj.fields[fieldName];
                        const comma = fieldIdx < objFieldNames.length - 1 ? ',' : '';
                        lines.push(`${indent(6)}"${fieldName}": ${writeFieldConfigInline(fieldConfig)}${comma}`);
                    });
                }
                lines.push(`${indent(5)}}`);
                // Add comma after object if it's not the last object
                const objEndLine = `${indent(4)}}`;
                if (objIdx < objNames.length - 1) {
                    lines.push(objEndLine + ',');
                }
                else {
                    lines.push(objEndLine);
                }
            });
            lines.push(`${indent(3)}}`);
        }
        else {
            lines.push(`${indent(3)}}`);
        }
        // Add comma after group if it's not the last group
        const groupEndLine = `${indent(2)}}`;
        if (groupIdx < groupNames.length - 1) {
            lines.push(groupEndLine + ',');
        }
        else {
            lines.push(groupEndLine);
        }
    });
    lines.push(`${indent(1)}}`);
    lines.push('}');
    return lines.join('\n');
};
exports.serializeToJson = serializeToJson;


/***/ }),

/***/ 896:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 928:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
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
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(730);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;