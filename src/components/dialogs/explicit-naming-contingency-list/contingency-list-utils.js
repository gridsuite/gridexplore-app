import {
    CONTINGENCY_LIST_TYPE,
    CONTINGENCY_NAME, COUNTRIES_1, COUNTRIES_2,
    EQUIPMENT_ID,
    EQUIPMENT_IDS,
    EQUIPMENT_TABLE, EQUIPMENT_TYPE,
    NAME, NOMINAL_VOLTAGE_1, NOMINAL_VOLTAGE_2,
} from '../../utils/field-constants';
import {ContingencyListType, ContingencyListTypeRefactor} from '../../../utils/elementType';
import { prepareContingencyListForBackend } from '../contingency-list-helper';
import { saveExplicitNamingContingencyList } from '../../../utils/rest-api';

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
export const getFormDataFromFetchedElement = (
    response,
    contingencyListType,
    contingencyListId
) => {
    if (contingencyListType === ContingencyListType.EXPLICIT_NAMING) {
        const result = response?.identifierContingencyList?.identifiers?.map(
            (identifiers, index) => {
                return {
                    [CONTINGENCY_NAME]: 'contingencyName' + index, // Temporary : at the moment, we do not save the name in the backend.
                    [EQUIPMENT_IDS]: identifiers.identifierList.map(
                        (identifier) => identifier.identifier
                    ),
                };
            }
        );
        return {
            [EQUIPMENT_ID]: contingencyListId,
            [EQUIPMENT_TABLE]: result ?? DEFAULT_TABLE_ROWS,
        };
    }
};

export const editContingencyList = (
    contingencyListId,
    contingencyListType,
    contingencyList
) => {
    if (contingencyListType === ContingencyListType.EXPLICIT_NAMING) {
        const equipments = prepareContingencyListForBackend(
            contingencyListId,
            contingencyListId,
            contingencyList[EQUIPMENT_TABLE] ?? []
        );
        return saveExplicitNamingContingencyList(equipments ?? []);
    }
};

export const getFormContent = (
    contingencyListId,
    contingencyList
) => {
    if (contingencyList[CONTINGENCY_LIST_TYPE] === ContingencyListTypeRefactor.EXPLICIT_NAMING.id) {
        return prepareContingencyListForBackend(
            contingencyListId ?? null,
            contingencyList[NAME],
            contingencyList[EQUIPMENT_TABLE] ?? []
        );
    }

    if (contingencyList[CONTINGENCY_LIST_TYPE] === ContingencyListTypeRefactor.CRITERIA_BASED.id) {
        return {
            equipmentType: contingencyList[EQUIPMENT_TYPE],
            countries1: contingencyList[COUNTRIES_1],
            countries2: contingencyList[COUNTRIES_2],
            nominalVoltage1: contingencyList[NOMINAL_VOLTAGE_1],
            nominalVoltage2: contingencyList[NOMINAL_VOLTAGE_2],
        }
    }
};
