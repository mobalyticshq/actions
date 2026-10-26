import { FieldConfig, Schema } from './schema';

const indent = (n: number): string => '  '.repeat(n);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

// Keeps the hand-written style of opaque blocks such as `wiki`: an object with a single scalar
// entry stays on one line, anything larger gets one entry per line. Key order is preserved
// because it is not alphabetical in existing schemas.
const writeJsonValue = (value: unknown, depth: number): string => {
    if (!isPlainObject(value)) {
        return JSON.stringify(value);
    }
    const entries = Object.entries(value);
    if (entries.length === 0) {
        return '{}';
    }
    if (entries.length === 1 && !isPlainObject(entries[0][1])) {
        const [key, entryValue] = entries[0];
        return `{ ${JSON.stringify(key)}: ${JSON.stringify(entryValue)} }`;
    }
    const lines = entries.map(([key, entryValue], idx) => {
        const comma = idx < entries.length - 1 ? ',' : '';
        return `${indent(depth + 1)}${JSON.stringify(key)}: ${writeJsonValue(entryValue, depth + 1)}${comma}`;
    });
    return ['{', ...lines, `${indent(depth)}}`].join('\n');
};

const writeFieldConfigInline = (fieldConfig: FieldConfig): string => {
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
    if (fieldConfig.translatable) {
        parts.push('"translatable": true');
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

export const serializeToJson = (cfg: Schema): string => {
    const lines: string[] = [];
    lines.push('{');
    lines.push(`${indent(1)}"namespace": "${cfg.namespace}",`);
    lines.push(`${indent(1)}"typePrefix": "${cfg.typePrefix}",`);
    if (cfg.geckMode) {
        lines.push(`${indent(1)}"geckMode": true,`);
    }
    if (cfg.deprecatedGeckMode) {
        lines.push(`${indent(1)}"deprecatedGeckMode": true,`);
    }
    
    // Add gqlTypesOverrides if it exists
    if (cfg.gqlTypesOverrides && Object.keys(cfg.gqlTypesOverrides).length > 0) {
        const gqlTypesOverridesJson = JSON.stringify(cfg.gqlTypesOverrides, null, 2);
        const indentedJson = gqlTypesOverridesJson.split('\n').map((line, idx) => 
            idx === 0 ? line : indent(1) + line
        ).join('\n');
        lines.push(`${indent(1)}"gqlTypesOverrides": ${indentedJson},`);
    }
    
    lines.push(`${indent(1)}"groups": {`);
    const groupNames = Object.keys(cfg.groups).sort();
    groupNames.forEach((groupName, groupIdx) => {
        const group = cfg.groups[groupName];
        lines.push(`${indent(2)}"${groupName}": {`);
        if (group.wiki) {
            lines.push(`${indent(3)}"wiki": ${writeJsonValue(group.wiki, 3)},`);
        }
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
                const obj = group.objects![objName];
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
                } else {
                    lines.push(objEndLine);
                }
            });
            lines.push(`${indent(3)}}`);
        } else {
            lines.push(`${indent(3)}}`);
        }
        // Add comma after group if it's not the last group
        const groupEndLine = `${indent(2)}}`;
        if (groupIdx < groupNames.length - 1) {
            lines.push(groupEndLine + ',');
        } else {
            lines.push(groupEndLine);
        }
    });
    lines.push(`${indent(1)}}`);
    lines.push('}');
    return lines.join('\n');
};
