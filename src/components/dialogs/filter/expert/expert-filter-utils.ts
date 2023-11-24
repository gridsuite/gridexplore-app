/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
    defaultOperators,
    QueryValidator,
    RuleGroupType,
    RuleGroupTypeAny,
    ValidationMap,
} from 'react-querybuilder';
import { RuleType } from 'react-querybuilder/dist/cjs/react-querybuilder.cjs.development';
import { FIELDS_OPTIONS, OPERATOR_OPTIONS } from './expert-filter-constants';
import { IntlShape } from 'react-intl';
import { EMPTY_GROUP, INCORRECT_RULE } from 'components/utils/field-constants';
import { EMPTY_RULE } from '../../../utils/field-constants';
import {
    CombinatorType,
    DataType,
    FieldType,
    OperatorType,
    RuleGroupTypeExport,
    RuleTypeExport,
} from './expert-filter.type';

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
                OPERATOR_OPTIONS.EXISTS,
            ].map((operator) => ({
                name: operator.name,
                label: intl.formatMessage({ id: operator.label }),
            }));
        case DataType.BOOLEAN:
        case DataType.ENUM:
            return [OPERATOR_OPTIONS.EQUALS, OPERATOR_OPTIONS.NOT_EQUALS].map(
                (operator) => ({
                    name: operator.name,
                    label: intl.formatMessage({ id: operator.label }),
                })
            );
    }
    return defaultOperators;
};

export function getExpertRules(query: RuleGroupType): RuleGroupTypeExport {
    function transformRule(rule: RuleType): RuleTypeExport {
        return {
            field: rule.field as FieldType,
            operator: rule.operator as OperatorType,
            value: rule.operator !== OperatorType.EXISTS ? rule.value : '0', // TODO Use undefined instead of 0, and fix related errors in the backend.
            dataType: getDataType(rule.field) as DataType,
        };
    }

    function transformGroup(group: RuleGroupType): RuleGroupTypeExport {
        // Recursively transform the rules within the group
        const transformedRules = group.rules.map((ruleOrGroup) => {
            if ('rules' in ruleOrGroup) {
                return transformGroup(ruleOrGroup as RuleGroupType);
            } else {
                return transformRule(ruleOrGroup as RuleType);
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
        const isNumberInput = getDataType(rule.field) === DataType.NUMBER;
        const isStringInput = getDataType(rule.field) === DataType.STRING;
        if (rule.id && rule.operator === OperatorType.EXISTS) {
            // In the case of EXISTS operator, because we do not have a second value to evaluate, we force a valid result.
            result[rule.id] = {
                valid: true,
                reasons: undefined,
            };
        } else if (rule.id && isStringInput && rule.value.trim() === '') {
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
