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
    ID,
    NAME,
    NOMINAL_VOLTAGE_1,
    NOMINAL_VOLTAGE_2,
    SCRIPT,
} from '../../utils/field-constants';
import {
    ContingencyListTypeRefactor,
    ElementType,
} from '../../../utils/elementType';
import { prepareContingencyListForBackend } from '../contingency-list-helper';
import {
    elementExists,
    saveExplicitNamingContingencyList,
    saveFormContingencyList,
    saveScriptContingencyList,
} from '../../../utils/rest-api';
import yup from '../../utils/yup-config';
import {
    getRangeInputEmptyDataForm,
    getRangeInputSchema,
} from '../../utils/range-input';

export const DEFAULT_TABLE_ROWS = [{}, {}, {}];

export const CONTINGENCY_LIST_EQUIPMENTS = {
    LINE: { id: 'LINE', label: 'Lines' },
    TWO_WINDINGS_TRANSFORMER: {
        id: 'TWO_WINDINGS_TRANSFORMER',
        label: 'TwoWindingsTransformers',
    },
    GENERATOR: { id: 'GENERATOR', label: 'Generators' },
    SHUNT_COMPENSATOR: { id: 'SHUNT_COMPENSATOR', label: 'ShuntCompensators' },
    HVDC_LINE: { id: 'HVDC_LINE', label: 'HvdcLines' },
    BUSBAR_SECTION: { id: 'BUSBAR_SECTION', label: 'BusBarSections' },
    DANGLING_LINE: { id: 'DANGLING_LINE', label: 'DanglingLines' },
};
const checkNameIsUnique = (name, activeDirectory) => {
    if (!name) {
        return false;
    }
    return new Promise((resolve) => {
        elementExists(activeDirectory, name, ElementType.CONTINGENCY_LIST).then(
            (val) => resolve(!val)
        );
    });
};

export const getSchema = (activeDirectory) => {
    return yup.object().shape({
        [NAME]: yup
            .string()
            .nullable()
            .required('nameEmpty')
            .test('checkIfUniqueName', 'nameAlreadyUsed', (name) =>
                checkNameIsUnique(name, activeDirectory)
            ),
        [EQUIPMENT_TYPE]: yup.string().nullable(),
        [CONTINGENCY_LIST_TYPE]: yup.string().nullable(),
        [EQUIPMENT_TABLE]: yup.array().of(
            yup.object().shape({
                [CONTINGENCY_NAME]: yup.string().nullable(),
                [EQUIPMENT_IDS]: yup.array().of(yup.string().nullable()),
            })
        ),
        [SCRIPT]: yup.string().nullable(),
        [COUNTRIES_1]: yup.array().of(yup.string().nullable()),
        [COUNTRIES_2]: yup.array().of(yup.string().nullable()),
        ...getRangeInputSchema(NOMINAL_VOLTAGE_1),
        ...getRangeInputSchema(NOMINAL_VOLTAGE_2),
    });
};

export const getEmptyFormData = () => ({
    [NAME]: '',
    [ID]: null,
    [EQUIPMENT_TABLE]: DEFAULT_TABLE_ROWS,
    [CONTINGENCY_LIST_TYPE]: ContingencyListTypeRefactor.CRITERIA_BASED.id,
    [EQUIPMENT_TYPE]: '',
    [COUNTRIES_1]: [],
    [COUNTRIES_2]: [],
    [SCRIPT]: null,
    ...getRangeInputEmptyDataForm(NOMINAL_VOLTAGE_1),
    ...getRangeInputEmptyDataForm(NOMINAL_VOLTAGE_2),
});

export const getFormDataFromFetchedElement = (
    response,
    contingencyListType,
    contingencyListId,
    name
) => {
    switch (contingencyListType) {
        case ContingencyListTypeRefactor.CRITERIA_BASED.id:
            return {
                [ID]: contingencyListId,
                [NAME]: name,
                [EQUIPMENT_TYPE]: response?.equipmentType,
                [COUNTRIES_1]: response?.countries1,
                [COUNTRIES_2]: response.countries2,
                [NOMINAL_VOLTAGE_1]: response?.nominalVoltage1,
                [NOMINAL_VOLTAGE_2]: response?.nominalVoltage2,
            };
        case ContingencyListTypeRefactor.EXPLICIT_NAMING.id:
            const result =
                response?.identifierContingencyList?.identifiers?.map(
                    (identifiers, index) => {
                        const id = 'contingencyName' + index;
                        return {
                            [CONTINGENCY_NAME]: id, // Temporary : at the moment, we do not save the name in the backend.
                            [EQUIPMENT_IDS]: identifiers.identifierList.map(
                                (identifier) => identifier.identifier
                            ),
                        };
                    }
                );
            return {
                [NAME]: name,
                [ID]: contingencyListId,
                [EQUIPMENT_TABLE]: result ?? DEFAULT_TABLE_ROWS,
            };
        case ContingencyListTypeRefactor.SCRIPT.id:
            return {
                [ID]: contingencyListId,
                [NAME]: name,
                [SCRIPT]: response?.script,
            };
        default:
            return getEmptyFormData();
    }
};

export const editContingencyList = (
    contingencyListId,
    contingencyListType,
    contingencyList
) => {
    switch (contingencyListType) {
        case ContingencyListTypeRefactor.CRITERIA_BASED.id:
            return saveFormContingencyList(
                contingencyList,
                contingencyList[NAME]
            );
        case ContingencyListTypeRefactor.EXPLICIT_NAMING.id:
            const equipments = prepareContingencyListForBackend(
                contingencyListId,
                contingencyListId,
                contingencyList[EQUIPMENT_TABLE] ?? []
            );
            return saveExplicitNamingContingencyList(
                equipments ?? [],
                contingencyList[NAME]
            );
        case ContingencyListTypeRefactor.SCRIPT.id:
            const newScript = {
                id: contingencyListId,
                script: contingencyList[SCRIPT] ?? '',
            };
            return saveScriptContingencyList(newScript, contingencyList[NAME]);
        default:
            return;
    }
};

export const getFormContent = (contingencyListId, contingencyList) => {
    switch (contingencyList[CONTINGENCY_LIST_TYPE]) {
        case ContingencyListTypeRefactor.EXPLICIT_NAMING.id: {
            return prepareContingencyListForBackend(
                contingencyListId ?? null,
                contingencyList[NAME],
                contingencyList[EQUIPMENT_TABLE] ?? []
            );
        }
        case ContingencyListTypeRefactor.CRITERIA_BASED.id: {
            return {
                equipmentType: contingencyList[EQUIPMENT_TYPE],
                countries1: contingencyList[COUNTRIES_1],
                countries2: contingencyList[COUNTRIES_2],
                nominalVoltage1: contingencyList[NOMINAL_VOLTAGE_1],
                nominalVoltage2: contingencyList[NOMINAL_VOLTAGE_2],
            };
        }
        case ContingencyListTypeRefactor.SCRIPT.id: {
            return { script: contingencyList[SCRIPT] };
        }
        default: {
            return;
        }
    }
};
