import { filteredTypes } from '../components/dialogs/filters';

/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const filterEquipmentDefinition = {
    LINE: {
        label: 'Lines',
        type: 'LINE',
        fields: {
            countries1: {
                name: 'Countries1',
                type: filteredTypes.countries,
            },
            countries2: {
                name: 'Countries2',
                type: filteredTypes.countries,
            },
            nominalVoltage1: {
                name: 'nominalVoltage1',
                type: filteredTypes.range,
            },
        },
    },
    TWO_WINDINGS_TRANSFORMER: {
        label: 'TwoWindingsTransformers',
        type: 'TWO_WINDINGS_TRANSFORMER',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage1: {
                name: 'nominalVoltage1',
                type: filteredTypes.range,
            },
            nominalVoltage2: {
                name: 'nominalVoltage2',
                type: filteredTypes.range,
            },
        },
    },
    THREE_WINDINGS_TRANSFORMER: {
        label: 'ThreeWindingsTransformers',
        type: 'THREE_WINDINGS_TRANSFORMER',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage1: {
                name: 'nominalVoltage1',
                type: filteredTypes.range,
            },
            nominalVoltage2: {
                name: 'nominalVoltage2',
                type: filteredTypes.range,
            },
            nominalVoltage3: {
                name: 'nominalVoltage3',
                type: filteredTypes.range,
            },
        },
    },
    GENERATOR: {
        label: 'Generators',
        type: 'GENERATOR',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
            },
        },
    },
    LOAD: {
        label: 'Loads',
        type: 'LOAD',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
            },
        },
    },
    BATTERY: {
        label: 'Batteries',
        type: 'BATTERY',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
            },
        },
    },
    SHUNT_COMPENSATOR: {
        label: 'ShuntCompensators',
        type: 'SHUNT_COMPENSATOR',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
            },
        },
    },
    STATIC_VAR_COMPENSATOR: {
        label: 'StaticVarCompensators',
        type: 'STATIC_VAR_COMPENSATOR',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
            },
        },
    },
    DANGLING_LINE: {
        label: 'DanglingLines',
        type: 'DANGLING_LINE',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
            },
        },
    },
    LCC_CONVERTER_STATION: {
        label: 'LccConverterStations',
        type: 'LCC_CONVERTER_STATION',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
            },
        },
    },
    VSC_CONVERTER_STATION: {
        label: 'VscConverterStations',
        type: 'VSC_CONVERTER_STATION',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
            },
        },
    },
    HVDC_LINE: {
        label: 'HvdcLines',
        type: 'HVDC_LINE',
        fields: {
            countries1: {
                name: 'Countries1',
                type: filteredTypes.countries,
            },
            countries2: {
                name: 'Countries2',
                type: filteredTypes.countries,
            },
            nominalVoltage: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
            },
        },
    },
};

export const contingencyListEquipmentDefinition = {
    LINE: {
        name: 'LINE',
        label: 'Lines',
        fields: {
            countries: {
                name: 'Countries1',
                type: filteredTypes.countries,
            },
            countries2: {
                name: 'Countries2',
                type: filteredTypes.countries,
            },
            nominalVoltage1: {
                name: 'nominalVoltage1',
                type: filteredTypes.range,
            },
        },
    },
    TWO_WINDINGS_TRANSFORMER: {
        label: 'TwoWindingsTransformers',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage1: {
                name: 'nominalVoltage1',
                type: filteredTypes.range,
            },
            nominalVoltage2: {
                name: 'nominalVoltage2',
                type: filteredTypes.range,
            },
        },
    },
    GENERATOR: {
        label: 'Generators',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage1: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
            },
        },
    },
    STATIC_VAR_COMPENSATOR: {
        label: 'StaticVarCompensators',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage1: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
            },
        },
    },
    SHUNT_COMPENSATOR: {
        label: 'ShuntCompensators',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage1: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
            },
        },
    },
    HVDC_LINE: {
        label: 'HvdcLines',
        fields: {
            countries: {
                name: 'Countries1',
                type: filteredTypes.countries,
            },
            countries2: {
                name: 'Countries2',
                type: filteredTypes.countries,
            },
            nominalVoltage1: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
            },
        },
    },
    BUSBAR_SECTION: {
        label: 'BusBarSections',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage1: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
            },
        },
    },
    DANGLING_LINE: {
        label: 'DanglingLines',
        fields: {
            countries: {
                name: 'Countries',
                type: filteredTypes.countries,
            },
            nominalVoltage1: {
                name: 'nominalVoltage',
                type: filteredTypes.range,
            },
        },
    },
};
