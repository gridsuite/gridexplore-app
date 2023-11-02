/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export enum OperatorType {
    EQUALS = 'EQUALS',
    NOT_EQUALS = 'NOT_EQUALS',
    LOWER = 'LOWER',
    LOWER_OR_EQUALS = 'LOWER_OR_EQUALS',
    GREATER = 'GREATER',
    GREATER_OR_EQUALS = 'GREATER_OR_EQUALS',
    IS = 'IS',
    CONTAINS = 'CONTAINS',
    BEGINS_WITH = 'BEGINS_WITH',
    ENDS_WITH = 'ENDS_WITH',
}

export enum CombinatorType {
    AND = 'AND',
    OR = 'OR',
}

export enum FieldType {
    ID = 'ID',
    NAME = 'NAME',
    NOMINAL_VOLTAGE = 'NOMINAL_VOLTAGE',
    MIN_P = 'MIN_P',
    MAX_P = 'MAX_P',
    TARGET_V = 'TARGET_V',
    TARGET_P = 'TARGET_P',
    TARGET_Q = 'TARGET_Q',
    ENERGY_SOURCE = 'ENERGY_SOURCE',
    COUNTRY = 'COUNTRY',
    VOLTAGE_REGULATOR_ON = 'VOLTAGE_REGULATOR_ON',
}

export enum DataType {
    STRING = 'STRING',
    ENUM = 'ENUM',
    NUMBER = 'NUMBER',
    BOOLEAN = 'BOOLEAN',
    COMBINATOR = 'COMBINATOR',
}

export interface RuleTypeExport {
    field: FieldType;
    operator: OperatorType;
    value: string | number;
    dataType: DataType;
}

export interface RuleGroupTypeExport {
    combinator: CombinatorType;
    dataType: DataType;
    rules: (RuleTypeExport | RuleGroupTypeExport)[];
}