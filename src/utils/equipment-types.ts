/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export enum EquipmentType {
    SUBSTATION = 'SUBSTATION',
    LOAD = 'LOAD',
    GENERATOR = 'GENERATOR',
    LINE = 'LINE',
    TWO_WINDING_TRANSFORMER = 'TWO_WINDINGS_TRANSFORMER',
    BATTERY = 'BATTERY',
    SHUNT_COMPENSATOR = 'SHUNT_COMPENSATOR',
    VOLTAGE_LEVEL = 'VOLTAGE_LEVEL',
    BUSBAR_SECTION = 'BUSBAR_SECTION',
    DANGLING_LINE = 'DANGLING_LINE',
    HVDC_LINE = 'HVDC_LINE',
    LCC_CONVERTER_STATION = 'LCC_CONVERTER_STATION',
    THREE_WINDINGS_TRANSFORMER = 'THREE_WINDINGS_TRANSFORMER',
    STATIC_VAR_COMPENSATOR = 'STATIC_VAR_COMPENSATOR',
    VSC_CONVERTER_STATION = 'VSC_CONVERTER_STATION',
}
