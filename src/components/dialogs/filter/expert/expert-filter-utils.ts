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

type CustomRuleType = RuleType & { dataType: DataType };
type CustomRuleGroupType = RuleGroupType & { dataType: DataType };

const getDataType = (fieldName: string) => {
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
            return [
                OPERATOR_OPTIONS.CONTAINS,
                OPERATOR_OPTIONS.IS,
                OPERATOR_OPTIONS.BEGINS_WITH,
                OPERATOR_OPTIONS.ENDS_WITH,
                OPERATOR_OPTIONS.IN,
                OPERATOR_OPTIONS.EXISTS,
            ].map((operator) => ({
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
            ].map((operator) => ({
                name: operator.name,
                label: intl.formatMessage({ id: operator.label }),
            }));
        case DataType.BOOLEAN:
        case DataType.ENUM:
            return [
                OPERATOR_OPTIONS.EQUALS,
                OPERATOR_OPTIONS.NOT_EQUALS,
                OPERATOR_OPTIONS.IN,
            ].map((operator) => ({
                name: operator.name,
                label: intl.formatMessage({ id: operator.label }),
            }));
    }
    return defaultOperators;
};

export function exportExpertRules(
    query: CustomRuleGroupType
): RuleGroupTypeExport {
    function transformRule(rule: CustomRuleType): RuleTypeExport {
        const isValueAnArray = Array.isArray(rule.value);
        return {
            field: rule.field as FieldType,
            operator: Object.values(OPERATOR_OPTIONS).find(
                (operator) => operator.name === rule.operator
            )?.customName as OperatorType,
            value:
                !isValueAnArray && rule.operator !== OperatorType.EXISTS
                    ? rule.value
                    : undefined,
            values: isValueAnArray ? rule.value : undefined,
            dataType: getDataType(rule.field) as DataType,
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
    function transformRule(rule: RuleTypeExport): CustomRuleType {
        return {
            field: rule.field,
            operator: Object.values(OPERATOR_OPTIONS).find(
                (operator) => operator.customName === rule.operator
            )?.name as string,
            value: rule.values ? rule.values.sort() : rule.value, // values is a Set on server side...
            dataType: rule.dataType,
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
            getDataType(rule.field) === DataType.NUMBER && !isValueAnArray;
        const isStringInput =
            getDataType(rule.field) === DataType.STRING && !isValueAnArray;
        if (rule.id && rule.operator === OPERATOR_OPTIONS.EXISTS.name) {
            // In the case of EXISTS operator, because we do not have a second value to evaluate, we force a valid result.
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
            } else if (parseFloat(rule.value[0]) > parseFloat(rule.value[1])) {
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
export function recursiveRemove(query: RuleGroupTypeAny, path: number[]) {
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
