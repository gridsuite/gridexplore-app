/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
    CONTINGENCY_LIST_TYPE,
    CONTINGENCY_NAME,
    COUNTRIES,
    COUNTRIES_1,
    COUNTRIES_2,
    CRITERIA_BASED,
    EQUIPMENT_IDS,
    EQUIPMENT_TABLE,
    EQUIPMENT_TYPE,
    NAME,
    NOMINAL_VOLTAGE,
    NOMINAL_VOLTAGE_1,
    NOMINAL_VOLTAGE_2,
    SCRIPT,
} from '../../utils/field-constants';
import { ContingencyListType } from '../../../utils/elementType';
import { prepareContingencyListForBackend } from '../contingency-list-helper';
import {
    saveCriteriaBasedContingencyList,
    saveExplicitNamingContingencyList,
    saveScriptContingencyList,
} from '../../../utils/rest-api';
import {
    getCriteriaBasedFormData,
    getCriteriaBasedSchema,
} from '../commons/criteria-based/criteria-based-utils';
import yup from '../../utils/yup-config';
import { getExplicitNamingSchema } from './explicit-naming/explicit-naming-form';

export const DEFAULT_ROW_VALUE = {
    [CONTINGENCY_NAME]: '',
    [EQUIPMENT_IDS]: [],
};

export const DEFAULT_TABLE_ROWS = [
    DEFAULT_ROW_VALUE,
    DEFAULT_ROW_VALUE,
    DEFAULT_ROW_VALUE,
];

export const getContingencyListSchema = () =>
    yup.object().shape({
        [NAME]: yup.string().required(),
        [CONTINGENCY_LIST_TYPE]: yup.string().nullable(),
        [EQUIPMENT_TYPE]: yup.string().nullable(),
        [SCRIPT]: yup.string().nullable(),
        ...getExplicitNamingSchema(EQUIPMENT_TABLE),
        ...getCriteriaBasedSchema(),
    });

export const getContingencyListEmptyFormData = () => ({
    [NAME]: '',
    [EQUIPMENT_TABLE]: DEFAULT_TABLE_ROWS,
    [CONTINGENCY_LIST_TYPE]: ContingencyListType.CRITERIA_BASED.id,
    [SCRIPT]: '',
    [EQUIPMENT_TYPE]: null,
    ...getCriteriaBasedFormData(),
});

export const getFormDataFromFetchedElement = (
    response,
    name,
    contingencyListType
) => {
    switch (contingencyListType) {
        case ContingencyListType.CRITERIA_BASED.id:
            return {
                [NAME]: name,
                [EQUIPMENT_TYPE]: response.equipmentType,
                ...getCriteriaBasedFormData(response),
            };
        case ContingencyListType.EXPLICIT_NAMING.id:
            let result;
            if (response.identifierContingencyList?.identifiers?.length) {
                result = response.identifierContingencyList?.identifiers?.map(
                    (identifiers) => {
                        return {
                            [CONTINGENCY_NAME]: identifiers.contingencyId,
                            [EQUIPMENT_IDS]: identifiers.identifierList.map(
                                (identifier) => identifier.identifier
                            ),
                        };
                    }
                );
            } else {
                result = DEFAULT_TABLE_ROWS;
            }

            return {
                [EQUIPMENT_TABLE]: result,
            };
        case ContingencyListType.SCRIPT.id:
            return {
                [SCRIPT]: response.script,
            };
        default:
            console.info(
                "Unknown contingency list type '" + contingencyListType + "'"
            );
            return getContingencyListEmptyFormData();
    }
};

export const editContingencyList = (
    contingencyListId,
    contingencyListType,
    contingencyList
) => {
    switch (contingencyListType) {
        case ContingencyListType.CRITERIA_BASED.id:
            return saveCriteriaBasedContingencyList(
                contingencyListId,
                contingencyList
            );
        case ContingencyListType.EXPLICIT_NAMING.id:
            const equipments = prepareContingencyListForBackend(
                contingencyListId,
                contingencyList
            );
            return saveExplicitNamingContingencyList(
                equipments,
                contingencyList[NAME]
            );
        case ContingencyListType.SCRIPT.id:
            const newScript = {
                id: contingencyListId,
                script: contingencyList[SCRIPT],
            };
            return saveScriptContingencyList(newScript, contingencyList[NAME]);
        default:
            console.info(
                "Unknown contingency list type '" + contingencyListType + "'"
            );
            return null;
    }
};

export const getFormContent = (contingencyListId, contingencyList) => {
    switch (contingencyList[CONTINGENCY_LIST_TYPE]) {
        case ContingencyListType.EXPLICIT_NAMING.id: {
            return prepareContingencyListForBackend(
                contingencyListId,
                contingencyList
            );
        }
        case ContingencyListType.CRITERIA_BASED.id: {
            const criteriaBaseForm = contingencyList[CRITERIA_BASED];
            return {
                equipmentType: contingencyList[EQUIPMENT_TYPE],
                countries: criteriaBaseForm[COUNTRIES],
                countries1: criteriaBaseForm[COUNTRIES_1],
                countries2: criteriaBaseForm[COUNTRIES_2],
                nominalVoltage: criteriaBaseForm[NOMINAL_VOLTAGE],
                nominalVoltage1: criteriaBaseForm[NOMINAL_VOLTAGE_1],
                nominalVoltage2: criteriaBaseForm[NOMINAL_VOLTAGE_2],
            };
        }
        case ContingencyListType.SCRIPT.id: {
            return { script: contingencyList[SCRIPT] };
        }
        default: {
            console.info(
                "Unknown contingency list type '" +
                    contingencyList[CONTINGENCY_LIST_TYPE] +
                    "'"
            );
            return null;
        }
    }
};
