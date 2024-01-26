/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
    CombinatorType,
    DataType,
    FieldType,
    OperatorType,
} from './expert-filter.type';
import { Field } from 'react-querybuilder';

export const EXPERT_FILTER_EQUIPMENTS = {
    GENERATOR: {
        id: 'GENERATOR',
        label: 'Generators',
    },
    LOAD: {
        id: 'LOAD',
        label: 'Loads',
    },
    VOLTAGE_LEVEL: {
        id: 'VOLTAGE_LEVEL',
        label: 'VoltageLevels',
    },
    SUBSTATION: {
        id: 'SUBSTATION',
        label: 'Substations',
    },
};

export const ENERGY_SOURCE_OPTIONS = [
    { name: 'HYDRO', label: 'Hydro' },
    { name: 'NUCLEAR', label: 'Nuclear' },
    { name: 'WIND', label: 'Wind' },
    { name: 'THERMAL', label: 'Thermal' },
    { name: 'SOLAR', label: 'Solar' },
    { name: 'OTHER', label: 'Other' },
];

// customName is used to export to the server
export const OPERATOR_OPTIONS = {
    EQUALS: { name: '=', customName: OperatorType.EQUALS, label: 'equality' },
    NOT_EQUALS: {
        name: '!=',
        customName: OperatorType.NOT_EQUALS,
        label: 'notEquality',
    },
    // Number and String
    EXISTS: {
        name: OperatorType.EXISTS,
        customName: OperatorType.EXISTS,
        label: 'exists',
    },
    // Number
    LOWER: { name: '<', customName: OperatorType.LOWER, label: 'lessThan' },
    LOWER_OR_EQUALS: {
        name: '<=',
        customName: OperatorType.LOWER_OR_EQUALS,
        label: 'lessOrEqual',
    },
    GREATER: {
        name: '>',
        customName: OperatorType.GREATER,
        label: 'greaterThan',
    },
    GREATER_OR_EQUALS: {
        name: '>=',
        customName: OperatorType.GREATER_OR_EQUALS,
        label: 'greaterOrEqual',
    },
    BETWEEN: {
        name: 'between',
        customName: OperatorType.BETWEEN,
        label: 'between',
    },
    IN: { name: 'in', customName: OperatorType.IN, label: 'in' },
    // String
    IS: { name: OperatorType.IS, customName: OperatorType.IS, label: 'is' },
    CONTAINS: {
        name: 'contains',
        customName: OperatorType.CONTAINS,
        label: 'contains',
    },
    BEGINS_WITH: {
        name: 'beginsWith',
        customName: OperatorType.BEGINS_WITH,
        label: 'beginsWith',
    },
    ENDS_WITH: {
        name: 'endsWith',
        customName: OperatorType.ENDS_WITH,
        label: 'endsWith',
    },
};

export const COMBINATOR_OPTIONS = {
    AND: { name: CombinatorType.AND, label: 'AND' },
    OR: { name: CombinatorType.OR, label: 'OR' },
};

export const FIELDS_OPTIONS = {
    ID: {
        name: FieldType.ID,
        label: 'id',
        dataType: DataType.STRING,
    },
    NAME: {
        name: FieldType.NAME,
        label: 'name',
        dataType: DataType.STRING,
    },
    NOMINAL_VOLTAGE: {
        name: FieldType.NOMINAL_VOLTAGE,
        label: 'nominalVoltage',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    MIN_P: {
        name: FieldType.MIN_P,
        label: 'minP',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    MAX_P: {
        name: FieldType.MAX_P,
        label: 'maxP',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    TARGET_P: {
        name: FieldType.TARGET_P,
        label: 'targetP',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    TARGET_V: {
        name: FieldType.TARGET_V,
        label: 'targetV',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    TARGET_Q: {
        name: FieldType.TARGET_Q,
        label: 'targetQ',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    ENERGY_SOURCE: {
        name: FieldType.ENERGY_SOURCE,
        label: 'energySource',
        dataType: DataType.ENUM,
        values: ENERGY_SOURCE_OPTIONS,
        valueEditorType: 'select',
        defaultValue: 'HYDRO',
    },
    COUNTRY: {
        name: FieldType.COUNTRY,
        label: 'country',
        dataType: DataType.ENUM,
        valueEditorType: 'select',
        defaultValue: 'AF',
    },
    VOLTAGE_REGULATOR_ON: {
        name: FieldType.VOLTAGE_REGULATOR_ON,
        label: 'voltageRegulatorOn',
        dataType: DataType.BOOLEAN,
        valueEditorType: 'switch',
    },
    PLANNED_ACTIVE_POWER_SET_POINT: {
        name: FieldType.PLANNED_ACTIVE_POWER_SET_POINT,
        label: 'PlannedActivePowerSetPoint',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    CONNECTED: {
        name: FieldType.CONNECTED,
        label: 'connected',
        dataType: DataType.BOOLEAN,
        valueEditorType: 'switch',
    },
    RATED_S: {
        name: FieldType.RATED_S,
        label: 'ratedS',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    MARGINAL_COST: {
        name: FieldType.MARGINAL_COST,
        label: 'marginalCost',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    PLANNED_OUTAGE_RATE: {
        name: FieldType.PLANNED_OUTAGE_RATE,
        label: 'plannedOutageRate',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    FORCED_OUTAGE_RATE: {
        name: FieldType.FORCED_OUTAGE_RATE,
        label: 'forcedOutageRate',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    VOLTAGE_LEVEL_ID: {
        name: FieldType.VOLTAGE_LEVEL_ID,
        label: 'vlId',
        dataType: DataType.STRING,
    },
    LOW_VOLTAGE_LIMIT: {
        name: FieldType.LOW_VOLTAGE_LIMIT,
        label: 'lowVoltageLimit',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    HIGH_VOLTAGE_LIMIT: {
        name: FieldType.HIGH_VOLTAGE_LIMIT,
        label: 'highVoltageLimit',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
};

export const fields: Record<string, Field[]> = {
    GENERATOR: [
        FIELDS_OPTIONS.ID,
        FIELDS_OPTIONS.NAME,
        FIELDS_OPTIONS.NOMINAL_VOLTAGE,
        FIELDS_OPTIONS.MIN_P,
        FIELDS_OPTIONS.MAX_P,
        FIELDS_OPTIONS.TARGET_P,
        FIELDS_OPTIONS.TARGET_V,
        FIELDS_OPTIONS.TARGET_Q,
        FIELDS_OPTIONS.ENERGY_SOURCE,
        FIELDS_OPTIONS.COUNTRY,
        FIELDS_OPTIONS.VOLTAGE_REGULATOR_ON,
        FIELDS_OPTIONS.PLANNED_ACTIVE_POWER_SET_POINT,
        FIELDS_OPTIONS.CONNECTED,
        FIELDS_OPTIONS.RATED_S,
        FIELDS_OPTIONS.MARGINAL_COST,
        FIELDS_OPTIONS.PLANNED_OUTAGE_RATE,
        FIELDS_OPTIONS.FORCED_OUTAGE_RATE,
        FIELDS_OPTIONS.VOLTAGE_LEVEL_ID,
    ],
    LOAD: [FIELDS_OPTIONS.ID],
    VOLTAGE_LEVEL: [
        FIELDS_OPTIONS.ID,
        FIELDS_OPTIONS.NAME,
        FIELDS_OPTIONS.NOMINAL_VOLTAGE,
        FIELDS_OPTIONS.LOW_VOLTAGE_LIMIT,
        FIELDS_OPTIONS.HIGH_VOLTAGE_LIMIT,
        FIELDS_OPTIONS.COUNTRY,
    ],
    SUBSTATION: [
        FIELDS_OPTIONS.ID,
        FIELDS_OPTIONS.NAME,
        FIELDS_OPTIONS.COUNTRY,
    ],
};
