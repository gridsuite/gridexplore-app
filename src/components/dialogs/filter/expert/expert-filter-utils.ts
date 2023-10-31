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
import { fields, OPERATOR_OPTIONS } from './expert-filter-constants';
import { IntlShape } from 'react-intl';
import { EMPTY_GROUP, INCORRECT_RULE } from 'components/utils/field-constants';
import { EMPTY_RULE } from '../../../utils/field-constants';
import { DataType } from './expert-filter.type';

const getDataType = (fieldName: string) => {
    const generatorField = fields().GENERATOR.find(
        (field) => field.name === fieldName
    );
    const loadField = fields().LOAD.find((field) => field.name === fieldName);

    const field = generatorField || loadField;
    return field?.dataType;
};

export const getOperators = (fieldName: string, intl: IntlShape) => {
    const generatorField = fields().GENERATOR.find(
        (field) => field.name === fieldName
    );
    const loadField = fields().LOAD.find((field) => field.name === fieldName);

    const field = generatorField || loadField;
    switch (field?.dataType) {
        case DataType.STRING:
            return [
                OPERATOR_OPTIONS.CONTAINS,
                OPERATOR_OPTIONS.IS,
                OPERATOR_OPTIONS.BEGINS_WITH,
                OPERATOR_OPTIONS.ENDS_WITH,
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
            ];
        case DataType.BOOLEAN:
        case DataType.ENUM:
            return [OPERATOR_OPTIONS.EQUALS, OPERATOR_OPTIONS.NOT_EQUALS];
    }
    return defaultOperators;
};

interface RuleTypeExport {
    field: string;
    operator: string;
    value: string | number;
    dataType: string;
}

interface RuleGroupTypeExport {
    combinator: string;
    rules: (RuleTypeExport | RuleGroupTypeExport)[];
}

export function getExpertRules(query: RuleGroupType): RuleGroupTypeExport {
    function transformRule(rule: RuleType): RuleTypeExport {
        return {
            field: rule.field,
            operator: rule.operator,
            value: rule.value,
            dataType: getDataType(rule.field),
        };
    }

    function transformGroup(group: RuleGroupType): {
        combinator: string;
        dataType: string;
        rules: (RuleGroupTypeExport | RuleTypeExport)[];
    } {
        // Recursively transform the rules within the group
        const transformedRules = group.rules.map((ruleOrGroup) => {
            if ('rules' in ruleOrGroup) {
                return transformGroup(ruleOrGroup as RuleGroupType);
            } else {
                return transformRule(ruleOrGroup as RuleType);
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
        if (rule.id && isStringInput && rule.value.trim() === '') {
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
