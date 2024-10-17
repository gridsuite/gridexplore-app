/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ElementType, OverflowableText, ElementAttributes } from '@gridsuite/commons-ui';
import { IntlShape, useIntl } from 'react-intl';
import { UUID } from 'crypto';
import { Box } from '@mui/material';

// This function is used to lowercase all the characters in a string except the first one
const toTitleCase = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

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

const styles = {
    tooltip: {
        maxWidth: '1000px',
    },
    tableCell: {
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
    },
};

export function TypeCellRenderer({
    data,
    childrenMetadata,
}: {
    data: ElementAttributes;
    childrenMetadata: Record<UUID, ElementAttributes>;
}) {
    const intl = useIntl();

    const specificMetadata = childrenMetadata[data?.elementUuid]?.specificMetadata;

    return (
        childrenMetadata[data?.elementUuid] && (
            <Box sx={styles.tableCell}>
                <OverflowableText
                    text={getElementTypeTranslation(
                        data?.type,
                        specificMetadata?.type?.toString(),
                        data?.type === ElementType.SPREADSHEET_CONFIG
                            ? toTitleCase(specificMetadata.sheetType?.toString()) ?? null
                            : specificMetadata.format?.toString() ?? null,
                        intl
                    )}
                    tooltipSx={styles.tooltip}
                />
            </Box>
        )
    );
}
