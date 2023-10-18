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
import { DataType, fields, operatorType } from './expert-filter-constants';
import { IntlShape } from 'react-intl';
import { EMPTY_GROUP, INCORRECT_RULE } from 'components/utils/field-constants';
import { EMPTY_RULE } from '../../../utils/field-constants';

const getDataType = (fieldName: string) => {
    const generatorField = fields().GENERATOR.find(
        (fld) => fld.name === fieldName
    );
    const loadField = fields().LOAD.find((fld) => fld.name === fieldName);

    const field = generatorField || loadField;
    return field?.dataType;
};

export const getOperators = (fieldName: string, intl: IntlShape) => {
    const generatorField = fields().GENERATOR.find(
        (fld) => fld.name === fieldName
    );
    const loadField = fields().LOAD.find((fld) => fld.name === fieldName);

    const field = generatorField || loadField;
    switch (field?.dataType) {
        case DataType.STRING:
            return [
                operatorType.CONTAINS,
                operatorType.IS,
                operatorType.BEGINS_WITH,
                operatorType.ENDS_WITH,
            ].map((operator) => ({
                name: operator.name,
                label: intl.formatMessage({ id: operator.label }),
            }));
        case DataType.NUMBER:
            return [
                operatorType.EQUALS,
                operatorType.GREATER,
                operatorType.GREATER_OR_EQUALS,
                operatorType.LOWER,
                operatorType.LOWER_OR_EQUALS,
            ];
        case DataType.BOOLEAN:
        case DataType.ENUM:
            return [operatorType.EQUALS, operatorType.NOT_EQUALS];
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
    return !Object.values(queryValidatorResult).some((rv) => {
        if (typeof rv !== 'boolean' && rv.reasons) {
            return rv.reasons.includes(check);
        }
        return false;
    });
};

// Fork of defaultValidator of the react-query-builder to validate rules and groups
export const queryValidator: QueryValidator = (query) => {
    const result: ValidationMap = {};

    const validateRule = (r: RuleType) => {
        const isNumberInput = getDataType(r.field) === DataType.NUMBER;
        const isStringInput = getDataType(r.field) === DataType.STRING;
        if (r.id && isStringInput && r.value.trim() === '') {
            result[r.id] = {
                valid: false,
                reasons: [EMPTY_RULE],
            };
        } else if (r.id && isNumberInput && isNaN(parseFloat(r.value))) {
            result[r.id] = {
                valid: false,
                reasons: [INCORRECT_RULE],
            };
        }
    };

    const validateGroup = (rg: RuleGroupTypeAny) => {
        const reasons: any[] = [];
        if (rg.rules.length === 0) {
            reasons.push(EMPTY_GROUP);
        }
        if (rg.id) {
            if (reasons.length) {
                result[rg.id] = { valid: false, reasons };
            } else {
                result[rg.id] = true;
            }
        }
        rg.rules.forEach((r) => {
            if (typeof r === 'string') {
                // Validation for this case was done earlier
            } else if ('rules' in r) {
                validateGroup(r);
            } else {
                validateRule(r);
            }
        });
    };
    validateGroup(query);

    return result;
};
