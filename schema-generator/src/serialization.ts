import { FieldConfig, Schema } from './schema';

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
    const indent = (n: number): string => '  '.repeat(n);
    const lines: string[] = [];
    lines.push('{');
    lines.push(`${indent(1)}"namespace": "${cfg.namespace}",`);
    lines.push(`${indent(1)}"typePrefix": "${cfg.typePrefix}",`);
    
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
