/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { filteredTypes } from '../components/dialogs/filters';

const Countries = {
    countries: {
        name: 'Countries',
        type: filteredTypes.countries,
    },
};
const EnergySource = {
    energySource: {
        name: 'EnergySourceText',
        type: filteredTypes.enum,
        enumValues: {
            HYDRO: 'Hydro',
            NUCLEAR: 'Nuclear',
            WIND: 'Wind',
            THERMAL: 'Thermal',
            SOLAR: 'Solar',
            OTHER: 'Other',
        },
    },
};
const Countries1 = {
    countries1: {
        name: 'Countries1',
        type: filteredTypes.countries,
    },
};
const Countries2 = {
    countries2: {
        name: 'Countries2',
        type: filteredTypes.countries,
    },
};
const NominalVoltage = {
    nominalVoltage: {
        name: 'nominalVoltage',
        type: filteredTypes.range,
    },
};
const NominalVoltage1 = {
    nominalVoltage1: {
        name: 'nominalVoltage1',
        type: filteredTypes.range,
    },
};
const NominalVoltage2 = {
    nominalVoltage2: {
        name: 'nominalVoltage2',
        type: filteredTypes.range,
    },
};
const SingleNominalVoltage1 = {
    nominalVoltage1: {
        name: 'nominalVoltage',
        type: filteredTypes.range,
    },
};
const SingleCountries1 = {
    countries1: {
        name: 'Countries',
        type: filteredTypes.countries,
    },
};
const FreeProps = {
    freeProperties: {
        name: 'FreeProperties',
        type: filteredTypes.freeProperties,
    },
};
const FreePropsS = {
    freeProperties: {
        name: 'FreeProperties',
        type: filteredTypes.freePropertiesS,
    },
};
const FreeProperties2 = {
    freePropertiesP: {
        name: 'FreeProperties',
        type: filteredTypes.freeProperties2,
    },
};

const Line = { label: 'Lines', type: 'LINE' };
const Generator = { label: 'Generators', type: 'GENERATOR' };
const Load = { label: 'Loads', type: 'LOAD' };
const Battery = { label: 'Batteries', type: 'BATTERY' };
const SVC = { label: 'StaticVarCompensators', type: 'STATIC_VAR_COMPENSATOR' };
const DanglingLine = { label: 'DanglingLines', type: 'DANGLING_LINE' };
const LCC = { label: 'LccConverterStations', type: 'LCC_CONVERTER_STATION' };
const VSC = { label: 'VscConverterStations', type: 'VSC_CONVERTER_STATION' };
const Hvdc = { label: 'HvdcLines', type: 'HVDC_LINE' };
const BusBar = { label: 'BusBarSections', type: 'BUSBAR_SECTION' };
const TwoWindingTransfo = {
    label: 'TwoWindingsTransformers',
    type: 'TWO_WINDINGS_TRANSFORMER',
};
const ThreeWindingTransfo = {
    label: 'ThreeWindingsTransformers',
    type: 'THREE_WINDINGS_TRANSFORMER',
};
const ShuntCompensator = {
    label: 'ShuntCompensators',
    type: 'SHUNT_COMPENSATOR',
};
const VoltageLevel = {
    label: 'VoltageLevels',
    type: 'VOLTAGE_LEVEL',
};
const Substation = {
    label: 'Substations',
    type: 'SUBSTATION',
};

// Filter supported types
export const filterEquipmentDefinition = {
    LINE: {
        ...Line,
        fields: {
            ...Countries1,
            ...Countries2,
            ...NominalVoltage1,
            ...NominalVoltage2,
            ...FreeProperties2,
        },
    },
    TWO_WINDINGS_TRANSFORMER: {
        ...TwoWindingTransfo,
        fields: {
            ...Countries,
            ...NominalVoltage1,
            ...NominalVoltage2,
            ...FreeProps,
        },
    },
    THREE_WINDINGS_TRANSFORMER: {
        ...ThreeWindingTransfo,
        fields: {
            ...Countries,
            ...NominalVoltage1,
            ...NominalVoltage2,
            nominalVoltage3: {
                name: 'nominalVoltage3',
                type: filteredTypes.range,
            },
            ...FreeProps,
        },
    },
    GENERATOR: {
        ...Generator,
        fields: {
            ...Countries,
            ...EnergySource,
            ...NominalVoltage,
            ...FreeProps,
        },
    },
    LOAD: {
        ...Load,
        fields: {
            ...Countries,
            ...NominalVoltage,
            ...FreeProps,
        },
    },
    BATTERY: {
        ...Battery,
        fields: {
            ...Countries,
            ...NominalVoltage,
            ...FreeProps,
        },
    },
    SHUNT_COMPENSATOR: {
        ...ShuntCompensator,
        fields: {
            ...Countries,
            ...NominalVoltage,
            ...FreeProps,
        },
    },
    STATIC_VAR_COMPENSATOR: {
        ...SVC,
        fields: {
            ...Countries,
            ...NominalVoltage,
            ...FreeProps,
        },
    },
    DANGLING_LINE: {
        ...DanglingLine,
        fields: {
            ...Countries,
            ...NominalVoltage,
            ...FreeProps,
        },
    },
    LCC_CONVERTER_STATION: {
        ...LCC,
        fields: {
            ...Countries,
            ...NominalVoltage,
            ...FreeProps,
        },
    },
    VSC_CONVERTER_STATION: {
        ...VSC,
        fields: {
            ...Countries,
            ...NominalVoltage,
            ...FreeProps,
        },
    },
    HVDC_LINE: {
        ...Hvdc,
        fields: {
            ...Countries1,
            ...Countries2,
            ...NominalVoltage,
            ...FreeProperties2,
        },
    },
    VOLTAGE_LEVEL: {
        ...VoltageLevel,
        fields: {
            ...Countries,
            ...NominalVoltage,
            ...FreeProps,
        },
    },
    SUBSTATION: {
        ...Substation,
        fields: {
            ...Countries,
            ...FreePropsS,
        },
    },
};

// Contingency List supported types
export const contingencyListEquipmentDefinition = {
    LINE: {
        ...Line,
        fields: {
            ...Countries1,
            ...Countries2,
            ...NominalVoltage1,
            ...NominalVoltage2,
        },
    },
    TWO_WINDINGS_TRANSFORMER: {
        ...TwoWindingTransfo,
        fields: {
            ...SingleCountries1,
            ...NominalVoltage1,
            ...NominalVoltage2,
        },
    },
    GENERATOR: {
        ...Generator,
        fields: {
            ...SingleCountries1,
            ...SingleNominalVoltage1,
        },
    },
    STATIC_VAR_COMPENSATOR: {
        ...SVC,
        fields: {
            ...SingleCountries1,
            ...SingleNominalVoltage1,
        },
    },
    SHUNT_COMPENSATOR: {
        ...ShuntCompensator,
        fields: {
            ...SingleCountries1,
            ...SingleNominalVoltage1,
        },
    },
    HVDC_LINE: {
        ...Hvdc,
        fields: {
            ...Countries1,
            ...Countries2,
            ...SingleNominalVoltage1,
        },
    },
    BUSBAR_SECTION: {
        ...BusBar,
        fields: {
            ...SingleCountries1,
            ...SingleNominalVoltage1,
        },
    },
    DANGLING_LINE: {
        ...DanglingLine,
        fields: {
            ...SingleCountries1,
            ...SingleNominalVoltage1,
        },
    },
};
