/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ContingencyListType } from '../../../utils/elementType';
import { prepareContingencyListForBackend } from '../contingency-list-helper';
import { v4 as uuid4 } from 'uuid';
import {
    getCriteriaBasedFormData,
    FieldConstants,
} from '@gridsuite/commons-ui';

export const makeDefaultRowData = () => ({
    [FieldConstants.AG_GRID_ROW_UUID]: uuid4(),
    [FieldConstants.CONTINGENCY_NAME]: '',
    [FieldConstants.EQUIPMENT_IDS]: [],
});

export const makeDefaultTableRows = () => [
    makeDefaultRowData(),
    makeDefaultRowData(),
    makeDefaultRowData(),
];

export const getContingencyListEmptyFormData = (name = '') => ({
    [FieldConstants.NAME]: name,
    [FieldConstants.DESCRIPTION]: '',
    [FieldConstants.EQUIPMENT_TABLE]: makeDefaultTableRows(),
    [FieldConstants.CONTINGENCY_LIST_TYPE]:
        ContingencyListType.CRITERIA_BASED.id,
    [FieldConstants.SCRIPT]: '',
    [FieldConstants.EQUIPMENT_TYPE]: null,
    ...getCriteriaBasedFormData(),
});

export const getCriteriaBasedFormDataFromFetchedElement = (response, name) => {
    return {
        [FieldConstants.NAME]: name,
        [FieldConstants.CONTINGENCY_LIST_TYPE]:
            ContingencyListType.CRITERIA_BASED.id,
        [FieldConstants.EQUIPMENT_TYPE]: response.equipmentType,
        ...getCriteriaBasedFormData(response),
    };
};

export const getExplicitNamingFormDataFromFetchedElement = (response) => {
    let result;
    if (response.identifierContingencyList?.identifiers?.length) {
        result = response.identifierContingencyList?.identifiers?.map(
            (identifiers) => {
                return {
                    [FieldConstants.AG_GRID_ROW_UUID]: uuid4(),
                    [FieldConstants.CONTINGENCY_LIST_TYPE]:
                        ContingencyListType.EXPLICIT_NAMING.id,
                    [FieldConstants.CONTINGENCY_NAME]:
                        identifiers.contingencyId,
                    [FieldConstants.EQUIPMENT_IDS]:
                        identifiers.identifierList.map(
                            (identifier) => identifier.identifier
                        ),
                };
            }
        );
    } else {
        result = makeDefaultTableRows();
    }

    return {
        [FieldConstants.EQUIPMENT_TABLE]: result,
    };
};

export const getScriptFormDataFromFetchedElement = (response) => {
    return {
        [FieldConstants.SCRIPT]: response.script,
    };
};

export const getFormContent = (contingencyListId, contingencyList) => {
    switch (contingencyList[FieldConstants.CONTINGENCY_LIST_TYPE]) {
        case ContingencyListType.EXPLICIT_NAMING.id: {
            return prepareContingencyListForBackend(
                contingencyListId,
                contingencyList
            );
        }
        case ContingencyListType.CRITERIA_BASED.id: {
            const criteriaBaseForm =
                contingencyList[FieldConstants.CRITERIA_BASED];
            return {
                equipmentType: contingencyList[FieldConstants.EQUIPMENT_TYPE],
                countries: criteriaBaseForm[FieldConstants.COUNTRIES],
                countries1: criteriaBaseForm[FieldConstants.COUNTRIES_1],
                countries2: criteriaBaseForm[FieldConstants.COUNTRIES_2],
                nominalVoltage:
                    criteriaBaseForm[FieldConstants.NOMINAL_VOLTAGE],
                nominalVoltage1:
                    criteriaBaseForm[FieldConstants.NOMINAL_VOLTAGE_1],
                nominalVoltage2:
                    criteriaBaseForm[FieldConstants.NOMINAL_VOLTAGE_2],
            };
        }
        case ContingencyListType.SCRIPT.id: {
            return { script: contingencyList[FieldConstants.SCRIPT] };
        }
        default: {
            console.info(
                "Unknown contingency list type '" +
                    contingencyList[FieldConstants.CONTINGENCY_LIST_TYPE] +
                    "'"
            );
            return null;
        }
    }
};
