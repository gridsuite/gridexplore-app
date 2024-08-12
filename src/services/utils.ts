/*
 * Copyright © 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ContingencyListType, ContingencyListTypeIds } from '../utils/elementType';

export const SCRIPT_CONTINGENCY_LISTS = '/script-contingency-lists';
export const FORM_CONTINGENCY_LISTS = '/form-contingency-lists';
export const IDENTIFIER_CONTINGENCY_LISTS = '/identifier-contingency-lists';

export function getContingencyUriParamType(contingencyListType: ContingencyListTypeIds | unknown) {
    switch (contingencyListType) {
        case ContingencyListType.SCRIPT.id:
            return SCRIPT_CONTINGENCY_LISTS;
        case ContingencyListType.CRITERIA_BASED.id:
            return FORM_CONTINGENCY_LISTS;
        case ContingencyListType.EXPLICIT_NAMING.id:
            return IDENTIFIER_CONTINGENCY_LISTS;
        default:
            return null;
    }
}
