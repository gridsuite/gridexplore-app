/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
    EQUIPMENT_IDS,
    EQUIPMENT_TABLE,
    NAME,
    AG_GRID_ROW_UUID,
} from '../utils/field-constants';

export const prepareContingencyListForBackend = (id, contingencyList) => {
    const identifiersList = contingencyList[EQUIPMENT_TABLE].filter(
        (contingency) =>
            contingency[EQUIPMENT_IDS] && contingency[EQUIPMENT_IDS].length > 0
    ) // We only take contingencies that have an identifierList value
        .map((contingency) => {
            const identifierList = contingency[EQUIPMENT_IDS].map(
                (identifier) => {
                    return {
                        type: 'ID_BASED',
                        identifier: identifier,
                    };
                }
            );

            return {
                type: 'LIST',
                contingencyId: contingency[AG_GRID_ROW_UUID],
                identifierList: identifierList,
            };
        });

    return {
        id: id,
        identifierContingencyList: {
            type: 'identifier',
            version: '1.2',
            name: contingencyList[NAME],
            identifiers: identifiersList,
        },
        type: 'IDENTIFIERS',
    };
};
