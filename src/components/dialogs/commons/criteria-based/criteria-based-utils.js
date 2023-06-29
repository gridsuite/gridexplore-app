/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import CountriesInput from '../../../utils/rhf-inputs/countries-input';
import {
    COUNTRIES_1,
    COUNTRIES_2,
    EQUIPMENT_TYPE,
    NOMINAL_VOLTAGE_1,
    NOMINAL_VOLTAGE_2,
} from '../../../utils/field-constants';
import RangeInput, {
    getRangeInputEmptyDataForm,
    getRangeInputSchema,
} from '../../../utils/rhf-inputs/range-input';
import yup from '../../../utils/yup-config';

const countries = {
    renderer: CountriesInput,
    props: {
        label: 'Countries',
        name: COUNTRIES_1,
    },
};

const countries1 = {
    renderer: CountriesInput,
    props: {
        label: 'Countries1',
        name: COUNTRIES_1,
    },
};

const countries2 = {
    renderer: CountriesInput,
    props: {
        label: 'Countries2',
        name: COUNTRIES_2,
    },
};

const nominalVoltage = {
    renderer: RangeInput,
    props: {
        label: 'nominalVoltage',
        name: NOMINAL_VOLTAGE_1,
    },
};

const nominalVoltage1 = {
    renderer: RangeInput,
    props: {
        label: 'nominalVoltage1',
        name: NOMINAL_VOLTAGE_1,
    },
};

const nominalVoltage2 = {
    renderer: RangeInput,
    props: {
        label: 'nominalVoltage2',
        name: NOMINAL_VOLTAGE_2,
    },
};

export const CONTINGENCY_LIST_EQUIPMENTS = {
    LINE: {
        id: 'LINE',
        label: 'Lines',
        fields: [countries1, countries2, nominalVoltage1, nominalVoltage2],
    },
    TWO_WINDINGS_TRANSFORMER: {
        id: 'TWO_WINDINGS_TRANSFORMER',
        label: 'TwoWindingsTransformers',
        fields: [countries, nominalVoltage1, nominalVoltage2],
    },
    GENERATOR: {
        id: 'GENERATOR',
        label: 'Generators',
        fields: [countries, nominalVoltage],
    },
    SHUNT_COMPENSATOR: {
        id: 'SHUNT_COMPENSATOR',
        label: 'ShuntCompensators',
        fields: [countries, nominalVoltage],
    },
    HVDC_LINE: {
        id: 'HVDC_LINE',
        label: 'HvdcLines',
        fields: [countries1, countries2, nominalVoltage],
    },
    BUSBAR_SECTION: {
        id: 'BUSBAR_SECTION',
        label: 'BusBarSections',
        fields: [countries, nominalVoltage],
    },
    DANGLING_LINE: {
        id: 'DANGLING_LINE',
        label: 'DanglingLines',
        fields: [countries, nominalVoltage],
    },
};

export const getCriteriaBasedSchema = () => ({
    [EQUIPMENT_TYPE]: yup.string().nullable(),
    [COUNTRIES_1]: yup.array().of(yup.string().nullable()),
    [COUNTRIES_2]: yup.array().of(yup.string().nullable()),
    ...getRangeInputSchema(NOMINAL_VOLTAGE_1),
    ...getRangeInputSchema(NOMINAL_VOLTAGE_2),
});

export const getCriteriaEmptyFormData = () => ({
    [EQUIPMENT_TYPE]: '',
    [COUNTRIES_1]: [],
    [COUNTRIES_2]: [],
    ...getRangeInputEmptyDataForm(NOMINAL_VOLTAGE_1),
    ...getRangeInputEmptyDataForm(NOMINAL_VOLTAGE_2),
});
