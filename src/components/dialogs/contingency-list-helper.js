/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { FieldConstants } from '@gridsuite/commons-ui';

export const prepareContingencyListForBackend = (id, contingencyList) => {
    const identifiersList = contingencyList[FieldConstants.EQUIPMENT_TABLE].map((contingency) => {
        const identifierList = contingency[FieldConstants.EQUIPMENT_IDS].map((identifier) => {
            return {
                type: 'ID_BASED',
                identifier: identifier,
            };
        });

        return {
            type: 'LIST',
            contingencyId: contingency[FieldConstants.CONTINGENCY_NAME],
            identifierList: identifierList,
        };
    });

    return {
        id: id,
        identifierContingencyList: {
            type: 'identifier',
            version: '1.2',
            name: contingencyList[FieldConstants.NAME],
            identifiers: identifiersList,
        },
        type: 'IDENTIFIERS',
    };
};
