/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { v4 as uuid4 } from 'uuid';
import {
    CONTINGENCY_LIST_EQUIPMENTS,
    type CriteriaBasedData,
    EquipmentType,
    FieldConstants,
    getCriteriaBasedFormData,
} from '@gridsuite/commons-ui';
import type { SetRequired } from 'type-fest';
import { prepareContingencyListForBackend } from '../contingency-list-helper';
import { ContingencyListType } from '../../../utils/elementType';

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
    [FieldConstants.SCRIPT]?: string | null;
    [FieldConstants.EQUIPMENT_TYPE]?: string | null;
    [FieldConstants.CRITERIA_BASED]?: CriteriaBasedData;
};

export type ContingencyListFormDataWithRequiredCriteria = SetRequired<
    ContingencyListFormData,
    FieldConstants.CRITERIA_BASED
>;

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
    [FieldConstants.CONTINGENCY_LIST_TYPE]: ContingencyListType.CRITERIA_BASED.id,
    [FieldConstants.SCRIPT]: '',
    [FieldConstants.EQUIPMENT_TYPE]: null,
    ...getCriteriaBasedFormData(),
});

export const getCriteriaBasedFormDataFromFetchedElement = (response: any, name: string, description: string) => ({
    [FieldConstants.NAME]: name,
    [FieldConstants.DESCRIPTION]: description,
    [FieldConstants.CONTINGENCY_LIST_TYPE]: ContingencyListType.CRITERIA_BASED.id,
    [FieldConstants.EQUIPMENT_TYPE]: response.equipmentType,
    ...getCriteriaBasedFormData(response),
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

export const getScriptFormDataFromFetchedElement = (response: any, name: string, description: string) => ({
    [FieldConstants.SCRIPT]: response.script,
    [FieldConstants.NAME]: name,
    [FieldConstants.DESCRIPTION]: description,
});

export const getFormContent = (
    contingencyListId: string | null,
    contingencyList: ContingencyListFormDataWithRequiredCriteria
) => {
    switch (contingencyList[FieldConstants.CONTINGENCY_LIST_TYPE]) {
        case ContingencyListType.EXPLICIT_NAMING.id: {
            return prepareContingencyListForBackend(contingencyListId, contingencyList);
        }
        case ContingencyListType.CRITERIA_BASED.id: {
            const criteriaBaseForm = contingencyList[FieldConstants.CRITERIA_BASED];
            return {
                equipmentType: contingencyList[FieldConstants.EQUIPMENT_TYPE],
                countries: criteriaBaseForm[FieldConstants.COUNTRIES],
                countries1: criteriaBaseForm[FieldConstants.COUNTRIES_1],
                countries2: criteriaBaseForm[FieldConstants.COUNTRIES_2],
                nominalVoltage: criteriaBaseForm[FieldConstants.NOMINAL_VOLTAGE],
                nominalVoltage1: criteriaBaseForm[FieldConstants.NOMINAL_VOLTAGE_1],
                nominalVoltage2: criteriaBaseForm[FieldConstants.NOMINAL_VOLTAGE_2],
            };
        }
        case ContingencyListType.SCRIPT.id: {
            return { script: contingencyList[FieldConstants.SCRIPT] };
        }
        default: {
            console.info(`Unknown contingency list type '${contingencyList[FieldConstants.CONTINGENCY_LIST_TYPE]}'`);
            return null;
        }
    }
};

// Not implemented yet for criteria based contingency lists.
// TODO: Exclusions to remove when contingency lists implemented for those equipment types
const excludedEquipmentTypes = [
    EquipmentType.BATTERY,
    EquipmentType.LOAD,
    EquipmentType.THREE_WINDINGS_TRANSFORMER,
    EquipmentType.STATIC_VAR_COMPENSATOR,
];

export const SUPPORTED_CONTINGENCY_LIST_EQUIPMENTS = Object.fromEntries(
    Object.entries(CONTINGENCY_LIST_EQUIPMENTS).filter(
        ([key]) => !excludedEquipmentTypes.includes(key as EquipmentType)
    )
);
