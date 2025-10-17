/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { UUID } from 'node:crypto';

// reproduce partially dto from Filter-server
export interface FilterAttributes {
    id: UUID;
    name?: string;
    equipmentType?: string;
}

export interface IdentifiableAttributes {
    id: string;
    type: string;
    distributionKey?: number;
}

export interface FilteredIdentifiables {
    equipmentIds: IdentifiableAttributes[];
    notFoundIds: IdentifiableAttributes[];
}

// type taken from actions-server
export interface FilterBasedContingencyList {
    filters: FilterAttributes[];
    selectedEquipmentTypesByFilter: Array<{
        filterId: string;
        equipmentTypes: string[];
    }>;
}

// type taken from filter-server, for now it's the same as FilterBasedContingencyList
export type FiltersWithEquipmentTypes = FilterBasedContingencyList;

export interface FilterElement {
    id: UUID;
    name: string;
    specificMetadata: {
        equipmentType: string;
    };
}

export enum ContingencyFieldConstants {
    SUB_EQUIPMENT_TYPES_BY_FILTER = 'subEquipmentTypesByFilter',
    FILTER_ID = 'filterId',
    SUB_EQUIPMENT_TYPES = 'subEquipmentTypes',
}

export interface FilterSubEquipments {
    [ContingencyFieldConstants.FILTER_ID]: string;
    [ContingencyFieldConstants.SUB_EQUIPMENT_TYPES]: string[];
}
