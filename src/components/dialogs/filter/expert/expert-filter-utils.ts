/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
    defaultOperators,
    findPath,
    getParentPath,
    QueryValidator,
    remove,
    RuleGroupType,
    RuleGroupTypeAny,
    ValidationMap,
} from 'react-querybuilder';
import { RuleType } from 'react-querybuilder/dist/cjs/react-querybuilder.cjs.development';
import { FIELDS_OPTIONS, OPERATOR_OPTIONS } from './expert-filter-constants';
import { IntlShape } from 'react-intl';
import {
    BETWEEN_RULE,
    EMPTY_GROUP,
    INCORRECT_RULE,
} from 'components/utils/field-constants';
import { EMPTY_RULE } from '../../../utils/field-constants';
import {
    CombinatorType,
    DataType,
    FieldType,
    OperatorType,
    RuleGroupTypeExport,
    RuleTypeExport,
} from './expert-filter.type';
import {
    isBlankOrEmpty,
    microUnitToUnit,
    unitToMicroUnit,
} from 'utils/conversion-utils';
import { validate as uuidValidate } from 'uuid';

type CustomRuleType = RuleType & { dataType: DataType };
type CustomRuleGroupType = RuleGroupType & { dataType: DataType };

const microUnits = [
    FieldType.SHUNT_CONDUCTANCE_1,
    FieldType.SHUNT_CONDUCTANCE_2,
    FieldType.SHUNT_SUSCEPTANCE_1,
    FieldType.SHUNT_SUSCEPTANCE_2,
];

const getDataType = (fieldName: string, operator: string) => {
    if (
        (fieldName === FieldType.ID ||
            fieldName === FieldType.VOLTAGE_LEVEL_ID ||
            fieldName === FieldType.VOLTAGE_LEVEL_ID_1 ||
            fieldName === FieldType.VOLTAGE_LEVEL_ID_2) &&
        (operator === OperatorType.IS_PART_OF ||
            operator === OperatorType.IS_NOT_PART_OF)
    ) {
        return DataType.FILTER_UUID;
    }
    // if (
    //     fieldName === FieldType.PROPERTY ||
    //     fieldName === FieldType.SUBSTATION_PROPERTY ||
    //     fieldName === FieldType.SUBSTATION_PROPERTY_1 ||
    //     fieldName === FieldType.SUBSTATION_PROPERTY_2
    // ) {
    //     return DataType.PROPERTY;
    // }
    const field = Object.values(FIELDS_OPTIONS).find(
        (field) => field.name === fieldName
    );

    return field?.dataType;
};

export const getOperators = (fieldName: string, intl: IntlShape) => {
    const field = Object.values(FIELDS_OPTIONS).find(
        (field) => field.name === fieldName
    );

    switch (field?.dataType) {
        case DataType.STRING:
            let operators: {
                name: string;
                customName: string;
                label: string;
            }[] = [
                OPERATOR_OPTIONS.CONTAINS,
                OPERATOR_OPTIONS.IS,
                OPERATOR_OPTIONS.BEGINS_WITH,
                OPERATOR_OPTIONS.ENDS_WITH,
                OPERATOR_OPTIONS.IN,
                OPERATOR_OPTIONS.EXISTS,
                OPERATOR_OPTIONS.NOT_EXISTS,
            ];
            if (
                field.name === FieldType.ID ||
                field.name === FieldType.VOLTAGE_LEVEL_ID ||
                field.name === FieldType.VOLTAGE_LEVEL_ID_1 ||
                field.name === FieldType.VOLTAGE_LEVEL_ID_2
            ) {
                // two additional operators when fields ID or VOLTAGE_LEVEL_ID are selected
                operators.push(OPERATOR_OPTIONS.IS_PART_OF);
                operators.push(OPERATOR_OPTIONS.IS_NOT_PART_OF);
            }
            if (field.name === FieldType.ID) {
                // When the ID is selected, the operators EXISTS and NOT_EXISTS must be removed.
                operators = operators.filter(
                    (field) =>
                        field.name !== OperatorType.EXISTS &&
                        field.name !== OperatorType.NOT_EXISTS
                );
            }
            return operators.map((operator) => ({
                name: operator.name,
                label: intl.formatMessage({ id: operator.label }),
            }));
        case DataType.NUMBER:
            return [
                OPERATOR_OPTIONS.EQUALS,
                OPERATOR_OPTIONS.GREATER,
                OPERATOR_OPTIONS.GREATER_OR_EQUALS,
                OPERATOR_OPTIONS.LOWER,
                OPERATOR_OPTIONS.LOWER_OR_EQUALS,
                OPERATOR_OPTIONS.BETWEEN,
                OPERATOR_OPTIONS.EXISTS,
                OPERATOR_OPTIONS.NOT_EXISTS,
            ].map((operator) => ({
                name: operator.name,
                label: intl.formatMessage({ id: operator.label }),
            }));
        case DataType.BOOLEAN:
            return [OPERATOR_OPTIONS.EQUALS].map((operator) => ({
                name: operator.name,
                label: intl.formatMessage({ id: operator.label }),
            }));
        case DataType.ENUM:
            let enumOperators: {
                name: string;
                customName: string;
                label: string;
            }[] = [
                OPERATOR_OPTIONS.EQUALS,
                OPERATOR_OPTIONS.NOT_EQUALS,
                OPERATOR_OPTIONS.IN,
            ];
            if (field.name === FieldType.SHUNT_COMPENSATOR_TYPE) {
                // When the SHUNT_COMPENSATOR_TYPE is selected, the operator IN must be removed.
                enumOperators = enumOperators.filter(
                    (field) => field.customName !== OperatorType.IN
                );
            }
            return enumOperators.map((operator) => ({
                name: operator.name,
                label: intl.formatMessage({ id: operator.label }),
            }));
        case DataType.PROPERTY:
            let propertiesOperators: {
                name: string;
                customName: string;
                label: string;
            }[] = [OPERATOR_OPTIONS.IS];
            return propertiesOperators.map((operator) => ({
                name: operator.name,
                label: intl.formatMessage({ id: operator.label }),
            }));
    }
    return defaultOperators;
};

function changeValueUnit(value: any, field: FieldType) {
    if (microUnits.includes(field)) {
        if (!Array.isArray(value)) {
            return microUnitToUnit(value);
        } else {
            return value.map((a: number) => microUnitToUnit(a));
        }
    }
    return value;
}

export function exportExpertRules(
    query: CustomRuleGroupType
): RuleGroupTypeExport {
    function transformRule(rule: CustomRuleType): RuleTypeExport {
        const isValueAnArray = Array.isArray(rule.value);
        const dataType = getDataType(rule.field, rule.operator) as DataType;
        return {
            field: rule.field as FieldType,
            operator:
                dataType !== DataType.PROPERTY
                    ? (Object.values(OPERATOR_OPTIONS).find(
                          (operator) => operator.name === rule.operator
                      )?.customName as OperatorType)
                    : rule.value.propertyOperator,
            value:
                !isValueAnArray &&
                rule.operator !== OperatorType.EXISTS &&
                rule.operator !== OperatorType.NOT_EXISTS &&
                dataType !== DataType.PROPERTY
                    ? changeValueUnit(rule.value, rule.field as FieldType)
                    : undefined,
            values:
                isValueAnArray && dataType !== DataType.PROPERTY
                    ? changeValueUnit(rule.value, rule.field as FieldType)
                    : undefined,
            dataType: dataType,
            propertyName:
                dataType === DataType.PROPERTY
                    ? rule.value.propertyName
                    : undefined,
            propertyValues:
                dataType === DataType.PROPERTY
                    ? rule.value.propertyValues
                    : undefined,
        };
    }

    function transformGroup(group: CustomRuleGroupType): RuleGroupTypeExport {
        // Recursively transform the rules within the group
        const transformedRules = group.rules.map((ruleOrGroup) => {
            if ('rules' in ruleOrGroup) {
                return transformGroup(ruleOrGroup as CustomRuleGroupType);
            } else {
                return transformRule(ruleOrGroup as CustomRuleType);
            }
        });

        return {
            combinator: group.combinator as CombinatorType,
            dataType: DataType.COMBINATOR,
            rules: transformedRules,
        };
    }

    return transformGroup(query);
}

export function importExpertRules(
    query: RuleGroupTypeExport
): CustomRuleGroupType {
    function parseValue(rule: RuleTypeExport) {
        if (rule.propertyName) {
            return {
                propertyName: rule.propertyName,
                propertyValues: rule.propertyValues,
                propertyOperator: rule.operator,
            };
        } else if (rule.values) {
            // values is a Set on server side, so need to sort
            if (rule.dataType === DataType.NUMBER) {
                return rule.values
                    .map((value) => parseFloat(value as string))
                    .map((numberValue) => {
                        return microUnits.includes(rule.field)
                            ? unitToMicroUnit(numberValue)!
                            : numberValue;
                    })
                    .sort((a, b) => a - b);
            } else {
                return rule.values.sort();
            }
        } else {
            return microUnits.includes(rule.field)
                ? unitToMicroUnit(parseFloat(rule.value as string))
                : rule.value;
        }
    }

    function transformRule(rule: RuleTypeExport): CustomRuleType {
        return {
            field: rule.field,
            operator:
                rule.dataType !== DataType.PROPERTY
                    ? (Object.values(OPERATOR_OPTIONS).find(
                          (operator) => operator.customName === rule.operator
                      )?.name as string)
                    : OperatorType.IS,
            value: parseValue(rule),
            dataType:
                rule.operator === OperatorType.IS_PART_OF ||
                rule.operator === OperatorType.IS_NOT_PART_OF
                    ? DataType.STRING
                    : rule.dataType,
        };
    }

    function transformGroup(group: RuleGroupTypeExport): CustomRuleGroupType {
        // Recursively transform the rules within the group
        const transformedRules = group.rules.map((ruleOrGroup) => {
            if ('rules' in ruleOrGroup) {
                return transformGroup(ruleOrGroup as RuleGroupTypeExport);
            } else {
                return transformRule(ruleOrGroup as RuleTypeExport);
            }
        });

        return {
            combinator: group.combinator,
            dataType: DataType.COMBINATOR,
            rules: transformedRules,
        };
    }

    return transformGroup(query);
}

export function countRules(query: RuleGroupTypeAny): number {
    if ('rules' in query) {
        const group = query as RuleGroupType;
        return group.rules.reduce(
            (sum, ruleOrGroup) =>
                sum + countRules(ruleOrGroup as RuleGroupTypeAny),
            0
        );
    } else {
        return 1;
    }
}

export const testQuery = (check: string, query: RuleGroupTypeAny): boolean => {
    const queryValidatorResult = queryValidator(query);
    return !Object.values(queryValidatorResult).some((ruleValidation) => {
        if (typeof ruleValidation !== 'boolean' && ruleValidation.reasons) {
            return ruleValidation.reasons.includes(check);
        }
        return false;
    });
};

// Fork of defaultValidator of the react-query-builder to validate rules and groups
export const queryValidator: QueryValidator = (query) => {
    const result: ValidationMap = {};

    const validateRule = (rule: RuleType) => {
        const isValueAnArray = Array.isArray(rule.value);
        const isNumberInput =
            getDataType(rule.field, rule.operator) === DataType.NUMBER &&
            !isValueAnArray;
        const isStringInput =
            getDataType(rule.field, rule.operator) === DataType.STRING &&
            !isValueAnArray;
        if (
            rule.id &&
            (rule.operator === OPERATOR_OPTIONS.EXISTS.name ||
                rule.operator === OPERATOR_OPTIONS.NOT_EXISTS.name)
        ) {
            // In the case of (NOT_)EXISTS operator, because we do not have a second value to evaluate, we force a valid result.
            result[rule.id] = {
                valid: true,
                reasons: undefined,
            };
        } else if (rule.id && rule.operator === OPERATOR_OPTIONS.BETWEEN.name) {
            if (!rule.value?.[0] || !rule.value?.[1]) {
                result[rule.id] = {
                    valid: false,
                    reasons: [EMPTY_RULE],
                };
            } else if (
                isNaN(parseFloat(rule.value[0])) ||
                isNaN(parseFloat(rule.value[1]))
            ) {
                result[rule.id] = {
                    valid: false,
                    reasons: [INCORRECT_RULE],
                };
            } else if (parseFloat(rule.value[0]) >= parseFloat(rule.value[1])) {
                result[rule.id] = {
                    valid: false,
                    reasons: [BETWEEN_RULE],
                };
            }
        } else if (
            rule.id &&
            rule.operator === OPERATOR_OPTIONS.IN.name &&
            !rule.value?.length
        ) {
            result[rule.id] = {
                valid: false,
                reasons: [EMPTY_RULE],
            };
        } else if (
            rule.id &&
            isStringInput &&
            (rule.value || '').trim() === ''
        ) {
            result[rule.id] = {
                valid: false,
                reasons: [EMPTY_RULE],
            };
        } else if (rule.id && isNumberInput && isNaN(parseFloat(rule.value))) {
            result[rule.id] = {
                valid: false,
                reasons: [INCORRECT_RULE],
            };
        } else if (
            rule.id &&
            (rule.operator === OPERATOR_OPTIONS.IS_PART_OF.name ||
                rule.operator === OPERATOR_OPTIONS.IS_NOT_PART_OF.name) &&
            (!rule.value?.length || !uuidValidate(rule.value[0]))
        ) {
            result[rule.id] = {
                valid: false,
                reasons: [EMPTY_RULE],
            };
        } else if (
            rule.id &&
            getDataType(rule.field, rule.operator) === DataType.PROPERTY &&
            (isBlankOrEmpty(rule.value?.propertyName) ||
                isBlankOrEmpty(rule.value?.propertyOperator) ||
                isBlankOrEmpty(rule.value?.propertyValues) ||
                !rule.value?.propertyValues?.length)
        ) {
            result[rule.id] = {
                valid: false,
                reasons: [EMPTY_RULE],
            };
        }
    };

    const validateGroup = (ruleGroup: RuleGroupTypeAny) => {
        const reasons: any[] = [];
        if (ruleGroup.rules.length === 0) {
            reasons.push(EMPTY_GROUP);
        }
        if (ruleGroup.id) {
            if (reasons.length) {
                result[ruleGroup.id] = { valid: false, reasons };
            } else {
                result[ruleGroup.id] = true;
            }
        }
        ruleGroup.rules.forEach((rule) => {
            if (typeof rule === 'string') {
                // Validation for this case was done earlier
            } else if ('rules' in rule) {
                validateGroup(rule);
            } else {
                validateRule(rule);
            }
        });
    };
    validateGroup(query);

    return result;
};

// Remove a rule or group and its parents if they become empty
export function recursiveRemove(
    query: RuleGroupTypeAny,
    path: number[]
): RuleGroupTypeAny {
    // If it's an only child, we also need to remove and check the parent group (but not the root)
    if (
        getNumberOfSiblings(path, query) === 1 &&
        path.toString() !== [0].toString()
    ) {
        return recursiveRemove(query, getParentPath(path));
    }
    // Otherwise, we can safely remove it
    else {
        return remove(query, path);
    }
}

// cf path concept https://react-querybuilder.js.org/docs/tips/path
export function getNumberOfSiblings(path: number[], query: RuleGroupTypeAny) {
    // Get the path of this rule's parent group
    const parentPath = getParentPath(path);
    // Find the parent group object in the query
    const parentGroup = findPath(parentPath, query) as RuleGroupType;
    // Return the number of siblings
    return parentGroup.rules.length;
}
