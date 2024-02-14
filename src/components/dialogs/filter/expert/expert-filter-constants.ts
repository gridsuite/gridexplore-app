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
    BATTERY: {
        id: 'BATTERY',
        label: 'Batteries',
    },
    VOLTAGE_LEVEL: {
        id: 'VOLTAGE_LEVEL',
        label: 'VoltageLevels',
    },
    SUBSTATION: {
        id: 'SUBSTATION',
        label: 'Substations',
    },
    SHUNT_COMPENSATOR: {
        id: 'SHUNT_COMPENSATOR',
        label: 'ShuntCompensators',
    },
    LINE: {
        id: 'LINE',
        label: 'Lines',
    },
    TWO_WINDINGS_TRANSFORMER: {
        id: 'TWO_WINDINGS_TRANSFORMER',
        label: 'TwoWindingsTransformers',
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

export const SHUNT_COMPENSATOR_TYPE_OPTIONS = [
    { name: 'CAPACITOR', label: 'Capacitor' },
    { name: 'REACTOR', label: 'Reactor' },
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
        label: 'vlNominalVoltage',
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
    P0: {
        name: FieldType.P0,
        label: 'p0',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    Q0: {
        name: FieldType.Q0,
        label: 'q0',
        dataType: DataType.NUMBER,
        inputType: 'number',
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
    MAXIMUM_SECTION_COUNT: {
        name: FieldType.MAXIMUM_SECTION_COUNT,
        label: 'maximumSectionCount',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    SECTION_COUNT: {
        name: FieldType.SECTION_COUNT,
        label: 'sectionCount',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    SHUNT_COMPENSATOR_TYPE: {
        name: FieldType.SHUNT_COMPENSATOR_TYPE,
        label: 'shuntCompensatorType',
        dataType: DataType.ENUM,
        values: SHUNT_COMPENSATOR_TYPE_OPTIONS,
        valueEditorType: 'select',
        defaultValue: 'CAPACITOR',
    },
    MAX_Q_AT_NOMINAL_V: {
        name: FieldType.MAX_Q_AT_NOMINAL_V,
        label: 'maxQAtNominalV',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    SWITCHED_ON_Q_AT_NOMINAL_V: {
        name: FieldType.SWITCHED_ON_Q_AT_NOMINAL_V,
        label: 'SwitchedOnMaxQAtNominalV',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    MAX_SUSCEPTANCE: {
        name: FieldType.MAX_SUSCEPTANCE,
        label: 'maxSusceptance',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    SWITCHED_ON_SUSCEPTANCE: {
        name: FieldType.SWITCHED_ON_SUSCEPTANCE,
        label: 'SwitchedOnMaxSusceptance',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    CONNECTED_1: {
        name: FieldType.CONNECTED_1,
        label: 'terminal1Connected',
        dataType: DataType.BOOLEAN,
        valueEditorType: 'switch',
    },
    CONNECTED_2: {
        name: FieldType.CONNECTED_2,
        label: 'terminal2Connected',
        dataType: DataType.BOOLEAN,
        valueEditorType: 'switch',
    },
    VOLTAGE_LEVEL_ID_1: {
        name: FieldType.VOLTAGE_LEVEL_ID_1,
        label: 'voltageLevelId1',
        dataType: DataType.STRING,
    },
    VOLTAGE_LEVEL_ID_2: {
        name: FieldType.VOLTAGE_LEVEL_ID_2,
        label: 'voltageLevelId2',
        dataType: DataType.STRING,
    },
    NOMINAL_VOLTAGE_1: {
        name: FieldType.NOMINAL_VOLTAGE_1,
        label: 'nominalVoltage1Or',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    NOMINAL_VOLTAGE_2: {
        name: FieldType.NOMINAL_VOLTAGE_2,
        label: 'nominalVoltage2Ex',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    COUNTRY_1: {
        name: FieldType.COUNTRY_1,
        label: 'country1',
        dataType: DataType.ENUM,
        valueEditorType: 'select',
        defaultValue: 'AF',
    },
    COUNTRY_2: {
        name: FieldType.COUNTRY_2,
        label: 'country2',
        dataType: DataType.ENUM,
        valueEditorType: 'select',
        defaultValue: 'AF',
    },
    SERIE_RESISTANCE: {
        name: FieldType.SERIE_RESISTANCE,
        label: 'seriesResistance',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    SERIE_REACTANCE: {
        name: FieldType.SERIE_REACTANCE,
        label: 'seriesReactance',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    SHUNT_CONDUCTANCE_1: {
        name: FieldType.SHUNT_CONDUCTANCE_1,
        label: 'shuntConductance1',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    SHUNT_CONDUCTANCE_2: {
        name: FieldType.SHUNT_CONDUCTANCE_2,
        label: 'shuntConductance2',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    SHUNT_SUSCEPTANCE_1: {
        name: FieldType.SHUNT_SUSCEPTANCE_1,
        label: 'shuntSusceptance1',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    SHUNT_SUSCEPTANCE_2: {
        name: FieldType.SHUNT_SUSCEPTANCE_2,
        label: 'shuntSusceptance2',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    NOMINAL_VOLTAGE_1: {
        name: FieldType.NOMINAL_V_1,
        label: 'nominalVoltage1',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    NOMINAL_VOLTAGE_2: {
        name: FieldType.NOMINAL_V_2,
        label: 'nominalVoltage2',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    R: {
        name: FieldType.R,
        label: 'seriesResistance',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    X: {
        name: FieldType.X,
        label: 'seriesReactance',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    G: {
        name: FieldType.G,
        label: 'magnetizingConductance',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    B: {
        name: FieldType.B,
        label: 'magnetizingSusceptance',
        dataType: DataType.NUMBER,
        inputType: 'number',
    },
    CONNECTED_1: {
        name: FieldType.CONNECTED_1,
        label: 'connected1',
        dataType: DataType.BOOLEAN,
        valueEditorType: 'switch',
    },
    CONNECTED_2: {
        name: FieldType.CONNECTED_2,
        label: 'connected2',
        dataType: DataType.BOOLEAN,
        valueEditorType: 'switch',
    },
    VOLTAGE_LEVEL_ID_1: {
        name: FieldType.VOLTAGE_LEVEL_ID_1,
        label: 'vlId1',
        dataType: DataType.STRING,
    },
    VOLTAGE_LEVEL_ID_2: {
        name: FieldType.VOLTAGE_LEVEL_ID_2,
        label: 'vlId2',
        dataType: DataType.STRING,
    },
    LOAD_TAP_CHANGING_CAPABILITIES: {
        name: FieldType.LOAD_TAP_CHANGING_CAPABILITIES,
        label: 'loadTapChangingCapabilities',
        dataType: DataType.BOOLEAN,
        valueEditorType: 'switch',
    },
    RATIO_REGULATING: {
        name: FieldType.RATIO_REGULATING,
        label: 'regulatingRatio',
        dataType: DataType.BOOLEAN,
        valueEditorType: 'switch',
    },
    RATIO_TARGET_V: {
        name: FieldType.RATIO_TARGET_V,
        label: 'ratioTargetV',
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
    LOAD: [
        FIELDS_OPTIONS.ID,
        FIELDS_OPTIONS.NAME,
        FIELDS_OPTIONS.VOLTAGE_LEVEL_ID,
        FIELDS_OPTIONS.NOMINAL_VOLTAGE,
        FIELDS_OPTIONS.COUNTRY,
        FIELDS_OPTIONS.P0,
        FIELDS_OPTIONS.Q0,
        FIELDS_OPTIONS.CONNECTED,
    ],
    SHUNT_COMPENSATOR: [
        FIELDS_OPTIONS.ID,
        FIELDS_OPTIONS.NAME,
        FIELDS_OPTIONS.VOLTAGE_LEVEL_ID,
        FIELDS_OPTIONS.NOMINAL_VOLTAGE,
        FIELDS_OPTIONS.COUNTRY,
        FIELDS_OPTIONS.MAXIMUM_SECTION_COUNT,
        FIELDS_OPTIONS.SECTION_COUNT,
        FIELDS_OPTIONS.SHUNT_COMPENSATOR_TYPE,
        FIELDS_OPTIONS.MAX_Q_AT_NOMINAL_V,
        FIELDS_OPTIONS.SWITCHED_ON_Q_AT_NOMINAL_V,
        FIELDS_OPTIONS.MAX_SUSCEPTANCE,
        FIELDS_OPTIONS.SWITCHED_ON_SUSCEPTANCE,
        FIELDS_OPTIONS.CONNECTED,
    ],
    BATTERY: [
        FIELDS_OPTIONS.ID,
        FIELDS_OPTIONS.NAME,
        FIELDS_OPTIONS.VOLTAGE_LEVEL_ID,
        FIELDS_OPTIONS.NOMINAL_VOLTAGE,
        FIELDS_OPTIONS.CONNECTED,
        FIELDS_OPTIONS.COUNTRY,
        FIELDS_OPTIONS.MIN_P,
        FIELDS_OPTIONS.MAX_P,
        FIELDS_OPTIONS.TARGET_P,
        FIELDS_OPTIONS.TARGET_Q,
    ],
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
    LINE: [
        FIELDS_OPTIONS.ID,
        FIELDS_OPTIONS.NAME,
        FIELDS_OPTIONS.CONNECTED_1,
        FIELDS_OPTIONS.CONNECTED_2,
        FIELDS_OPTIONS.VOLTAGE_LEVEL_ID_1,
        FIELDS_OPTIONS.VOLTAGE_LEVEL_ID_2,
        FIELDS_OPTIONS.NOMINAL_VOLTAGE_1,
        FIELDS_OPTIONS.NOMINAL_VOLTAGE_2,
        FIELDS_OPTIONS.COUNTRY_1,
        FIELDS_OPTIONS.COUNTRY_2,
        FIELDS_OPTIONS.SERIE_RESISTANCE,
        FIELDS_OPTIONS.SERIE_REACTANCE,
        FIELDS_OPTIONS.SHUNT_CONDUCTANCE_1,
        FIELDS_OPTIONS.SHUNT_CONDUCTANCE_2,
        FIELDS_OPTIONS.SHUNT_SUSCEPTANCE_1,
        FIELDS_OPTIONS.SHUNT_SUSCEPTANCE_2,
    ],
    TWO_WINDINGS_TRANSFORMER: [
        FIELDS_OPTIONS.ID,
        FIELDS_OPTIONS.NAME,
        FIELDS_OPTIONS.NOMINAL_VOLTAGE_1,
        FIELDS_OPTIONS.NOMINAL_VOLTAGE_2,
        FIELDS_OPTIONS.RATED_S,
        FIELDS_OPTIONS.R,
        FIELDS_OPTIONS.X,
        FIELDS_OPTIONS.G,
        FIELDS_OPTIONS.B,
        FIELDS_OPTIONS.CONNECTED_1,
        FIELDS_OPTIONS.CONNECTED_2,
        FIELDS_OPTIONS.VOLTAGE_LEVEL_ID_1,
        FIELDS_OPTIONS.VOLTAGE_LEVEL_ID_2,
        FIELDS_OPTIONS.COUNTRY,
        FIELDS_OPTIONS.LOAD_TAP_CHANGING_CAPABILITIES,
        FIELDS_OPTIONS.RATIO_REGULATING,
        FIELDS_OPTIONS.RATIO_TARGET_V,
    ],
};
