/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
    CONTINGENCY_LIST_TYPE,
    CONTINGENCY_NAME,
    COUNTRIES_1,
    COUNTRIES_2,
    EQUIPMENT_IDS,
    EQUIPMENT_TABLE,
    EQUIPMENT_TYPE,
    NAME,
    NOMINAL_VOLTAGE_1,
    NOMINAL_VOLTAGE_2,
    SCRIPT,
} from '../../utils/field-constants';
import { ContingencyListType } from '../../../utils/elementType';
import { prepareContingencyListForBackend } from '../contingency-list-helper';
import {
    saveExplicitNamingContingencyList,
    saveFormContingencyList,
    saveScriptContingencyList,
} from '../../../utils/rest-api';
import { getRangeInputEmptyDataForm } from '../../utils/rhf-inputs/range-input';
import {
    getCriteriaBasedSchema,
    getCriteriaEmptyFormData,
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
        [SCRIPT]: yup.string().nullable(),
        ...getExplicitNamingSchema(EQUIPMENT_TABLE),
        ...getCriteriaBasedSchema(),
    });

export const getContingencyListEmptyFormData = () => ({
    [NAME]: '',
    [EQUIPMENT_TABLE]: DEFAULT_TABLE_ROWS,
    [CONTINGENCY_LIST_TYPE]: ContingencyListType.CRITERIA_BASED.id,
    [SCRIPT]: null,
    ...getCriteriaEmptyFormData(),
});

export const getFormDataFromFetchedElement = (
    response,
    name,
    contingencyListType
) => {
    console.log('response : ', response);
    switch (contingencyListType) {
        case ContingencyListType.CRITERIA_BASED.id:
            return {
                [NAME]: name,
                [EQUIPMENT_TYPE]: response.equipmentType,
                [COUNTRIES_1]: response.countries1,
                [COUNTRIES_2]: response.countries2,
                [NOMINAL_VOLTAGE_1]:
                    response?.nominalVoltage1 ??
                    getRangeInputEmptyDataForm(NOMINAL_VOLTAGE_1),
                [NOMINAL_VOLTAGE_2]:
                    response?.nominalVoltage2 ??
                    getRangeInputEmptyDataForm(NOMINAL_VOLTAGE_2),
            };
        case ContingencyListType.EXPLICIT_NAMING.id:
            const result =
                response?.identifierContingencyList?.identifiers?.map(
                    (identifiers, index) => {
                        const id = 'contingencyName' + index;
                        return {
                            rowUuid: id,
                            [CONTINGENCY_NAME]: id, // Temporary : at the moment, we do not save the name in the backend.
                            [EQUIPMENT_IDS]: identifiers.identifierList.map(
                                (identifier) => identifier.identifier
                            ),
                        };
                    }
                );
            return {
                [EQUIPMENT_TABLE]: result ?? [],
            };
        case ContingencyListType.SCRIPT.id:
            return {
                [SCRIPT]: response?.script,
            };
        default:
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
            return saveFormContingencyList(
                contingencyList[NAME],
                contingencyList
            );
        case ContingencyListType.EXPLICIT_NAMING.id:
            const equipments = prepareContingencyListForBackend(
                contingencyList[EQUIPMENT_TABLE]
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
            return null;
    }
};

export const getFormContent = (contingencyListId, contingencyList) => {
    switch (contingencyList[CONTINGENCY_LIST_TYPE]) {
        case ContingencyListType.EXPLICIT_NAMING.id: {
            return prepareContingencyListForBackend(
                contingencyListId,
                contingencyList[NAME],
                contingencyList[EQUIPMENT_TABLE]
            );
        }
        case ContingencyListType.CRITERIA_BASED.id: {
            return {
                equipmentType: contingencyList[EQUIPMENT_TYPE],
                countries1: contingencyList[COUNTRIES_1],
                countries2: contingencyList[COUNTRIES_2],
                nominalVoltage1: contingencyList[NOMINAL_VOLTAGE_1],
                nominalVoltage2: contingencyList[NOMINAL_VOLTAGE_2],
            };
        }
        case ContingencyListType.SCRIPT.id: {
            return { script: contingencyList[SCRIPT] };
        }
        default: {
            return null;
        }
    }
};
