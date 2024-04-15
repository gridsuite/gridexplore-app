/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
    Substation,
    Line,
    Generator,
    Load,
    Battery,
    SVC,
    DanglingLine,
    LCC,
    VSC,
    Hvdc,
    BusBar,
    TwoWindingTransfo,
    ThreeWindingTransfo,
    ShuntCompensator,
    VoltageLevel,
} from '@gridsuite/commons-ui';

export type Equipment =
    | typeof Substation
    | typeof Line
    | typeof Generator
    | typeof Load
    | typeof Battery
    | typeof SVC
    | typeof DanglingLine
    | typeof LCC
    | typeof VSC
    | typeof Hvdc
    | typeof BusBar
    | typeof TwoWindingTransfo
    | typeof ThreeWindingTransfo
    | typeof ShuntCompensator
    | typeof VoltageLevel
    | typeof Substation;

export type EquipmentType = {
    [Type in Equipment['type']]: Type;
}[Equipment['type']];

export const mapEquipmentTypeForPredefinedProperties = (
    type: EquipmentType
): string | undefined => {
    switch (type) {
        case 'SUBSTATION':
            return 'substation';
        case 'LOAD':
            return 'load';
        case 'GENERATOR':
            return 'generator';
        case 'LINE':
            return 'line';
        case 'TWO_WINDINGS_TRANSFORMER':
            return 'twt';
        case 'BATTERY':
            return 'battery';
        case 'SHUNT_COMPENSATOR':
            return 'shuntCompensator';
        case 'VOLTAGE_LEVEL':
            return 'voltageLevel';
        case 'BUSBAR_SECTION':
        case 'DANGLING_LINE':
        case 'HVDC_LINE':
        case 'LCC_CONVERTER_STATION':
        case 'THREE_WINDINGS_TRANSFORMER':
        case 'STATIC_VAR_COMPENSATOR':
        case 'VSC_CONVERTER_STATION':
            return undefined;
    }
};
