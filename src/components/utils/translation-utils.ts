/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { type ElementAttributes, ElementType } from '@gridsuite/commons-ui';
import { IntlShape } from 'react-intl';

export const getElementTypeTranslation = (
    type: ElementType,
    subtype: string | null,
    formatCase: string | null,
    intl: IntlShape
) => {
    let translatedType;
    switch (type) {
        case ElementType.FILTER:
        case ElementType.CONTINGENCY_LIST:
        case ElementType.PROCESS_CONFIG:
            translatedType = intl.formatMessage({
                id: subtype ? `${subtype}_${type}` : type,
            });
            break;
        case ElementType.MODIFICATION:
            translatedType = intl.formatMessage({ id: type });
            break;
        default:
            translatedType = type ? intl.formatMessage({ id: type }) : '';
            break;
    }

    const translatedFormat = formatCase ? ` (${intl.formatMessage({ id: formatCase })})` : '';

    return `${translatedType}${translatedFormat}`;
};

// This function is used to lowercase all the characters in a string except the first one
const toTitleCase = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export const getElementTypeLabel = (
    type: ElementType,
    specificMetadata: ElementAttributes['specificMetadata'] | undefined,
    intl: IntlShape
) => {
    if (!specificMetadata) {
        return getElementTypeTranslation(type, null, null, intl);
    }
    const formatCase =
        type === ElementType.SPREADSHEET_CONFIG
            ? toTitleCase(specificMetadata.sheetType ?? 'no-type')
            : (specificMetadata.format?.toString() ?? null);
    return getElementTypeTranslation(type, specificMetadata.type?.toString() ?? null, formatCase, intl);
};
