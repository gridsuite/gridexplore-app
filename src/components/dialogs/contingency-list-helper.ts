/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { FieldConstants } from '@gridsuite/commons-ui';

interface ContingencyList {
    [FieldConstants.NAME]: string;
    [FieldConstants.EQUIPMENT_TABLE]: Array<{
        [FieldConstants.CONTINGENCY_NAME]: string;
        [FieldConstants.EQUIPMENT_IDS]: string[];
    }>;
}

interface Identifier {
    type: 'ID_BASED';
    identifier: string;
}

interface IdentifierList {
    type: 'LIST';
    contingencyId: string;
    identifierList: Identifier[];
}

interface PrepareContingencyListForBackend {
    id: string;
    identifierContingencyList: {
        type: 'identifier';
        version: string;
        name: string;
        identifiers: IdentifierList[];
    };
    type: 'IDENTIFIERS';
}

export const prepareContingencyListForBackend = (
    id: string,
    contingencyList: ContingencyList
): PrepareContingencyListForBackend => {
    const identifiersList: IdentifierList[] = contingencyList[FieldConstants.EQUIPMENT_TABLE].map((contingency) => {
        const identifierList: Identifier[] = contingency[FieldConstants.EQUIPMENT_IDS].map((identifier) => {
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
