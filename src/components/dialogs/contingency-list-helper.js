/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export const getIdentifierContingencyListFromResponse = (response) => {
    const result = response?.identifierContingencyList?.identifiers?.map(
        (identifiers, index) => {
            return {
                contingencyName: 'contingencyName' + index, // Temporary : at the moment, we do not save the name in the backend.
                equipmentIDs: identifiers.identifierList.map(
                    (identifier) => identifier.identifier
                ),
            };
        }
    );
    return { identifierContingencyList: result ?? [] };
};

export const prepareContingencyListForBackend = (id, name, values) => {
    const identifiersList = values
        .filter(
            (contingency) =>
                contingency?.equipmentIDs && contingency.equipmentIDs.length > 0
        ) // We only take contingencies that have an equipmentIDs value
        .map((contingency) => {
            const identifierList = contingency.equipmentIDs.map(
                (identifier) => {
                    return {
                        type: 'ID_BASED',
                        identifier: identifier,
                    };
                }
            );

            return {
                type: 'LIST',
                // contingencyName: contingency.contingencyName, // Not used for now
                identifierList: identifierList,
            };
        });

    return {
        id: id,
        identifierContingencyList: {
            type: 'identifier',
            version: '1.0',
            name: name,
            identifiableType: 'LINE', // hardcoded for the moment
            identifiers: identifiersList,
        },
        type: 'IDENTIFIERS',
    };
};
