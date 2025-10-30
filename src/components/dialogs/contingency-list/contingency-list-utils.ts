/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { v4 as uuid4 } from 'uuid';
import { EquipmentType, FieldConstants } from '@gridsuite/commons-ui';
import { prepareContingencyListForBackend } from '../contingency-list-helper';
import { ContingencyListType } from '../../../utils/elementType';
import {
    ContingencyFieldConstants,
    FilterAttributes,
    FilterBasedContingencyList,
    FilterElement,
} from '../../../utils/contingency-list.type';

export interface Identifier {
    type: 'ID_BASED';
    identifier: string;
}

export interface IdentifierList {
    type: 'LIST';
    contingencyId: string;
    identifierList: Identifier[];
}

export type ContingencyListFormData = {
    [FieldConstants.NAME]: string;
    [FieldConstants.DESCRIPTION]?: string;
    [FieldConstants.EQUIPMENT_TABLE]?: {
        [FieldConstants.CONTINGENCY_NAME]?: string | null;
        [FieldConstants.EQUIPMENT_IDS]?: (string | null | undefined)[];
    }[];
    [FieldConstants.CONTINGENCY_LIST_TYPE]?: string | null;
    [FieldConstants.EQUIPMENT_TYPE]?: string | null;
};

export const makeDefaultRowData = () => ({
    [FieldConstants.AG_GRID_ROW_UUID]: uuid4(),
    [FieldConstants.CONTINGENCY_NAME]: '',
    [FieldConstants.EQUIPMENT_IDS]: [],
    [FieldConstants.DESCRIPTION]: '',
});

export const makeDefaultTableRows = () => [makeDefaultRowData(), makeDefaultRowData(), makeDefaultRowData()];

export const getContingencyListEmptyFormData = (name = '') => ({
    [FieldConstants.NAME]: name,
    [FieldConstants.DESCRIPTION]: '',
    [FieldConstants.EQUIPMENT_TABLE]: makeDefaultTableRows(),
    [FieldConstants.CONTINGENCY_LIST_TYPE]: ContingencyListType.EXPLICIT_NAMING.id,
    [FieldConstants.EQUIPMENT_TYPE]: null,
});

export const getFilterBasedFormDataFromFetchedElement = (
    response: FilterBasedContingencyList,
    name: string,
    description: string
) => ({
    [FieldConstants.NAME]: name,
    [FieldConstants.DESCRIPTION]: description,
    [FieldConstants.CONTINGENCY_LIST_TYPE]: ContingencyListType.FILTERS.id,
    [FieldConstants.FILTERS]: response.filters.map((filter: FilterAttributes) => {
        return {
            id: filter.id,
            name: filter.name ?? '',
            specificMetadata: { equipmentType: filter.equipmentType ?? '' },
        };
    }),
    [ContingencyFieldConstants.SUB_EQUIPMENT_TYPES_BY_FILTER]: response.selectedEquipmentTypesByFilter.map((value) => ({
        [ContingencyFieldConstants.FILTER_ID]: value.filterId,
        [ContingencyFieldConstants.SUB_EQUIPMENT_TYPES]: value.equipmentTypes,
    })),
});

export const getExplicitNamingFormDataFromFetchedElement = (response: any, name: string, description: string) => {
    let result;
    if (response.identifierContingencyList?.identifiers?.length) {
        result = response.identifierContingencyList?.identifiers?.map((identifiers: IdentifierList) => ({
            [FieldConstants.AG_GRID_ROW_UUID]: uuid4(),
            [FieldConstants.CONTINGENCY_LIST_TYPE]: ContingencyListType.EXPLICIT_NAMING.id,
            [FieldConstants.CONTINGENCY_NAME]: identifiers.contingencyId,
            [FieldConstants.EQUIPMENT_IDS]: identifiers.identifierList.map((identifier) => identifier.identifier),
        }));
    } else {
        result = makeDefaultTableRows();
    }
    return {
        [FieldConstants.EQUIPMENT_TABLE]: result,
        [FieldConstants.NAME]: name,
        [FieldConstants.DESCRIPTION]: description,
    };
};

export const getFormContent = (contingencyListId: string | null, contingencyList: ContingencyListFormData) => {
    if (contingencyList[FieldConstants.CONTINGENCY_LIST_TYPE] === ContingencyListType.EXPLICIT_NAMING.id) {
        return prepareContingencyListForBackend(contingencyListId, contingencyList);
    }
    console.info(`Unknown contingency list type '${contingencyList[FieldConstants.CONTINGENCY_LIST_TYPE]}'`);
    return null;
};

export function isSubstationOrVoltageLevelFilter(filter: FilterElement) {
    return (
        filter.specificMetadata.equipmentType === EquipmentType.SUBSTATION ||
        filter.specificMetadata.equipmentType === EquipmentType.VOLTAGE_LEVEL
    );
}
