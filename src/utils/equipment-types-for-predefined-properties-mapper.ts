/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { EquipmentType } from './equipment-types';

export const mapEquipmentTypeForPredefinedProperties = (
    type: EquipmentType
): string | undefined => {
    switch (type) {
        case EquipmentType.SUBSTATION:
            return 'substation';
        case EquipmentType.LOAD:
            return 'load';
        case EquipmentType.GENERATOR:
            return 'generator';
        case EquipmentType.LINE:
            return 'line';
        case EquipmentType.TWO_WINDING_TRANSFORMER:
            return 'twt';
        case EquipmentType.BATTERY:
            return 'battery';
        case EquipmentType.SHUNT_COMPENSATOR:
            return 'shuntCompensator';
        case EquipmentType.VOLTAGE_LEVEL:
            return 'voltageLevel';
        case EquipmentType.BUSBAR_SECTION:
        case EquipmentType.DANGLING_LINE:
        case EquipmentType.HVDC_LINE:
        case EquipmentType.LCC_CONVERTER_STATION:
        case EquipmentType.THREE_WINDINGS_TRANSFORMER:
        case EquipmentType.STATIC_VAR_COMPENSATOR:
        case EquipmentType.VSC_CONVERTER_STATION:
            return undefined;
    }
};
