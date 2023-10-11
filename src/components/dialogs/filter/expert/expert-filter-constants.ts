import { IntlShape } from 'react-intl';
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

interface OperatorType {
    [key: string]: { name: string; label: string };
}

export const operatorType: OperatorType = {
    EQUALS: { name: 'EQUALS', label: '=' },
    NOT_EQUALS: { name: 'NOT_EQUALS', label: '!=' },
    // Number
    LOWER: { name: 'LOWER', label: '<' },
    LOWER_OR_EQUALS: { name: 'LOWER_OR_EQUALS', label: '<=' },
    GREATER: { name: 'GREATER', label: '>' },
    GREATER_OR_EQUALS: { name: 'GREATER_OR_EQUALS', label: '>=' },
    // String
    IS: { name: 'IS', label: 'is' },
    CONTAINS: { name: 'CONTAINS', label: 'contains' },
    BEGINS_WITH: { name: 'BEGINS_WITH', label: 'beginsWith' },
    ENDS_WITH: { name: 'ENDS_WITH', label: 'endsWith' },
};

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

export const combinatorType: OperatorType = {
    AND: { name: 'AND', label: 'AND' },
    OR: { name: 'OR', label: 'OR' },
};

export const fields = (intl?: IntlShape): Record<string, Field[]> => {
    return {
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
                values: ENERGY_SOURCE_OPTIONS.map((v) => {
                    return {
                        name: v.name,
                        label: intl
                            ? intl.formatMessage({ id: v.label })
                            : v.label,
                    };
                }),
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
};

export const ENERGY_SOURCE_OPTIONS = [
    { name: 'HYDRO', label: 'Hydro' },
    { name: 'NUCLEAR', label: 'Nuclear' },
    { name: 'WIND', label: 'Wind' },
    { name: 'THERMAL', label: 'Thermal' },
    { name: 'SOLAR', label: 'Solar' },
    { name: 'OTHER', label: 'Other' },
];
