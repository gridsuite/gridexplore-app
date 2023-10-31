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
};

export const OPERATOR_OPTIONS = {
    EQUALS: { name: OperatorType.EQUALS, label: '=' },
    NOT_EQUALS: { name: OperatorType.NOT_EQUALS, label: '!=' },
    // Number
    LOWER: { name: OperatorType.LOWER, label: '<' },
    LOWER_OR_EQUALS: { name: OperatorType.LOWER_OR_EQUALS, label: '<=' },
    GREATER: { name: OperatorType.GREATER, label: '>' },
    GREATER_OR_EQUALS: { name: OperatorType.GREATER_OR_EQUALS, label: '>=' },
    // String
    IS: { name: OperatorType.IS, label: 'is' },
    CONTAINS: { name: OperatorType.CONTAINS, label: 'contains' },
    BEGINS_WITH: { name: OperatorType.BEGINS_WITH, label: 'beginsWith' },
    ENDS_WITH: { name: OperatorType.ENDS_WITH, label: 'endsWith' },
};

export const COMBINATOR_OPTIONS = {
    AND: { name: CombinatorType.AND, label: 'AND' },
    OR: { name: CombinatorType.OR, label: 'OR' },
};

export const fields: Record<string, Field[]> = {
    GENERATOR: [
        {
            name: FieldType.ID,
            label: 'id',
            dataType: DataType.STRING,
        },
        {
            name: FieldType.NAME,
            label: 'name',
            dataType: DataType.STRING,
        },
        {
            name: FieldType.NOMINAL_VOLTAGE,
            label: 'nominalVoltage',
            dataType: DataType.NUMBER,
            inputType: 'number',
        },
        {
            name: FieldType.MIN_P,
            label: 'minP',
            dataType: DataType.NUMBER,
            inputType: 'number',
        },
        {
            name: FieldType.MAX_P,
            label: 'maxP',
            dataType: DataType.NUMBER,
            inputType: 'number',
        },
        {
            name: FieldType.TARGET_P,
            label: 'targetP',
            dataType: DataType.NUMBER,
            inputType: 'number',
        },
        {
            name: FieldType.TARGET_V,
            label: 'targetV',
            dataType: DataType.NUMBER,
            inputType: 'number',
        },
        {
            name: FieldType.TARGET_Q,
            label: 'targetQ',
            dataType: DataType.NUMBER,
            inputType: 'number',
        },
        {
            name: FieldType.ENERGY_SOURCE,
            label: 'energySource',
            dataType: DataType.ENUM,
            valueEditorType: 'select',
            defaultValue: 'HYDRO',
        },
        {
            name: FieldType.COUNTRY,
            label: 'country',
            dataType: DataType.ENUM,
            valueEditorType: 'select',
            defaultValue: 'AF',
        },
        {
            name: FieldType.VOLTAGE_REGULATOR_ON,
            label: 'voltageRegulatorOn',
            dataType: DataType.BOOLEAN,
            valueEditorType: 'checkbox',
        },
    ],
    LOAD: [
        {
            name: FieldType.ID,
            label: 'id',
            dataType: DataType.STRING,
        },
    ],
};

export const ENERGY_SOURCE_OPTIONS = [
    { name: 'HYDRO', label: 'Hydro' },
    { name: 'NUCLEAR', label: 'Nuclear' },
    { name: 'WIND', label: 'Wind' },
    { name: 'THERMAL', label: 'Thermal' },
    { name: 'SOLAR', label: 'Solar' },
    { name: 'OTHER', label: 'Other' },
];
