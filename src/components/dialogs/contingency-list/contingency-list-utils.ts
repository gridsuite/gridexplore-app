/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ContingencyListType } from '../../../utils/elementType';
import { prepareContingencyListForBackend } from '../contingency-list-helper';
import { v4 as uuid4 } from 'uuid';
import { getCriteriaBasedFormData, FieldConstants } from '@gridsuite/commons-ui';

interface Identifier {
    type: 'ID_BASED';
    identifier: string;
}

interface IdentifierList {
    type: 'LIST';
    contingencyId: string;
    identifierList: Identifier[];
}

export interface ExplicitNamingScript {
    script: string;
    metadata?: Record<string, unknown>;
    id?: string;
    type?: string;
    modificationDate?: string;
}

interface RangeInputData {
    [FieldConstants.OPERATION_TYPE]: string;
    [FieldConstants.VALUE_1]: number | null;
    [FieldConstants.VALUE_2]: number | null;
}

export interface CriteriaBasedData {
    [FieldConstants.COUNTRIES]?: string[];
    [FieldConstants.COUNTRIES_1]?: string[];
    [FieldConstants.COUNTRIES_2]?: string[];
    [FieldConstants.NOMINAL_VOLTAGE]?: RangeInputData | null;
    [FieldConstants.NOMINAL_VOLTAGE_1]?: RangeInputData | null;
    [FieldConstants.NOMINAL_VOLTAGE_2]?: RangeInputData | null;
    [FieldConstants.NOMINAL_VOLTAGE_3]?: RangeInputData | null;
    [key: string]: any;
}

export interface ContingencyListFormData {
    [FieldConstants.NAME]: string;
    [FieldConstants.DESCRIPTION]?: string;
    [FieldConstants.EQUIPMENT_TABLE]?: {
        [FieldConstants.CONTINGENCY_NAME]?: string | null | undefined;
        [FieldConstants.EQUIPMENT_IDS]?: (string | null | undefined)[] | undefined;
    }[];
    [FieldConstants.CONTINGENCY_LIST_TYPE]?: string | null;
    [FieldConstants.SCRIPT]?: string | null;
    [FieldConstants.EQUIPMENT_TYPE]?: string | null;
    [FieldConstants.CRITERIA_BASED]?: CriteriaBasedData;
}

export interface ContingencyListFormDataWithRequiredCriteria
    extends Omit<ContingencyListFormData, FieldConstants.CRITERIA_BASED> {
    [FieldConstants.CRITERIA_BASED]: CriteriaBasedData;
}

export const makeDefaultRowData = () => ({
    [FieldConstants.AG_GRID_ROW_UUID]: uuid4(),
    [FieldConstants.CONTINGENCY_NAME]: '',
    [FieldConstants.EQUIPMENT_IDS]: [],
});

export const makeDefaultTableRows = () => [makeDefaultRowData(), makeDefaultRowData(), makeDefaultRowData()];

export const getContingencyListEmptyFormData = (name = '') => ({
    [FieldConstants.NAME]: name,
    [FieldConstants.DESCRIPTION]: '',
    [FieldConstants.EQUIPMENT_TABLE]: makeDefaultTableRows(),
    [FieldConstants.CONTINGENCY_LIST_TYPE]: ContingencyListType.CRITERIA_BASED.id,
    [FieldConstants.SCRIPT]: '',
    [FieldConstants.EQUIPMENT_TYPE]: null,
    ...getCriteriaBasedFormData({}, {}),
});

export const getCriteriaBasedFormDataFromFetchedElement = (response: any, name: string) => {
    return {
        [FieldConstants.NAME]: name,
        [FieldConstants.CONTINGENCY_LIST_TYPE]: ContingencyListType.CRITERIA_BASED.id,
        [FieldConstants.EQUIPMENT_TYPE]: response.equipmentType,
        ...getCriteriaBasedFormData(response, {}),
    };
};

export const getExplicitNamingFormDataFromFetchedElement = (response: any) => {
    let result;
    if (response.identifierContingencyList?.identifiers?.length) {
        result = response.identifierContingencyList?.identifiers?.map((identifiers: IdentifierList) => {
            return {
                [FieldConstants.AG_GRID_ROW_UUID]: uuid4(),
                [FieldConstants.CONTINGENCY_LIST_TYPE]: ContingencyListType.EXPLICIT_NAMING.id,
                [FieldConstants.CONTINGENCY_NAME]: identifiers.contingencyId,
                [FieldConstants.EQUIPMENT_IDS]: identifiers.identifierList.map((identifier) => identifier.identifier),
            };
        });
    } else {
        result = makeDefaultTableRows();
    }

    return {
        [FieldConstants.EQUIPMENT_TABLE]: result,
    };
};

export const getScriptFormDataFromFetchedElement = (response: any) => {
    return {
        [FieldConstants.SCRIPT]: response.script,
    };
};

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
            console.info(
                "Unknown contingency list type '" + contingencyList[FieldConstants.CONTINGENCY_LIST_TYPE] + "'"
            );
            return null;
        }
    }
};
