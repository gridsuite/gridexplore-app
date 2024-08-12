/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

type IdLabel = {
    id: string;
    label: string;
};

export const FilterType = {
    CRITERIA_BASED: { id: 'CRITERIA', label: 'filter.criteriaBased' },
    EXPLICIT_NAMING: { id: 'IDENTIFIER_LIST', label: 'filter.explicitNaming' },
    EXPERT: { id: 'EXPERT', label: 'filter.expert' },
} as const satisfies Record<string, IdLabel>;
export type FilterTypeKeys = keyof typeof FilterType;
export type FilterTypeIds = (typeof FilterType)[FilterTypeKeys]['id'];

export const ContingencyListType = {
    CRITERIA_BASED: { id: 'FORM', label: 'contingencyList.criteriaBased' },
    EXPLICIT_NAMING: {
        id: 'IDENTIFIERS',
        label: 'contingencyList.explicitNaming',
    },
    SCRIPT: { id: 'SCRIPT', label: 'contingencyList.script' },
} as const satisfies Record<string, IdLabel>;
export type ContingencyListTypeKeys = keyof typeof ContingencyListType;
export type ContingencyListTypeIds = (typeof ContingencyListType)[ContingencyListTypeKeys]['id'];
