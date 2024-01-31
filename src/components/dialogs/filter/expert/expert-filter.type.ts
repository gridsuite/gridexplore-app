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
    BETWEEN = 'BETWEEN',
    IN = 'IN',
    IS = 'IS',
    CONTAINS = 'CONTAINS',
    BEGINS_WITH = 'BEGINS_WITH',
    ENDS_WITH = 'ENDS_WITH',
    EXISTS = 'EXISTS',
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
    PLANNED_ACTIVE_POWER_SET_POINT = 'PLANNED_ACTIVE_POWER_SET_POINT',
    CONNECTED = 'CONNECTED',
    RATED_S = 'RATED_S',
    MARGINAL_COST = 'MARGINAL_COST',
    PLANNED_OUTAGE_RATE = 'PLANNED_OUTAGE_RATE',
    FORCED_OUTAGE_RATE = 'FORCED_OUTAGE_RATE',
    VOLTAGE_LEVEL_ID = 'VOLTAGE_LEVEL_ID',
    P0 = 'P0',
    Q0 = 'Q0',
    LOW_VOLTAGE_LIMIT = 'LOW_VOLTAGE_LIMIT',
    HIGH_VOLTAGE_LIMIT = 'HIGH_VOLTAGE_LIMIT',
    NOMINAL_V_1 = 'NOMINAL_V_1',
    NOMINAL_V_2 = 'NOMINAL_V_2',
    R = 'R',
    X = 'X',
    G = 'G',
    B = 'B',
    CONNECTED_1 = 'CONNECTED_1',
    CONNECTED_2 = 'CONNECTED_2',
    VOLTAGE_LEVEL_ID_1 = 'VOLTAGE_LEVEL_ID_1',
    VOLTAGE_LEVEL_ID_2 = 'VOLTAGE_LEVEL_ID_2',
    LOAD_TAP_CHANGING_CAPABILITIES = 'LOAD_TAP_CHANGING_CAPABILITIES',
    RATIO_REGULATING = 'RATIO_REGULATING',
    RATIO_TARGET_V = 'RATIO_TARGET_V',
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
    value: string | number | undefined;
    values: string[] | number[] | undefined;
    dataType: DataType;
}

export interface RuleGroupTypeExport {
    combinator: CombinatorType;
    dataType: DataType;
    rules: (RuleTypeExport | RuleGroupTypeExport)[];
}
