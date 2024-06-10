/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import {
    ElementType,
    OverflowableText,
    ElementAttributes,
} from '@gridsuite/commons-ui';
import { IntlShape, useIntl } from 'react-intl';
import { UUID } from 'crypto';
import { Box } from '@mui/material';

const getElementTypeTranslation = (
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
                id: subtype ? subtype + '_' + type : type,
            });
            break;
        case ElementType.MODIFICATION:
            translatedType =
                intl.formatMessage({ id: type }) +
                ' (' +
                intl.formatMessage({
                    id: 'network_modifications.' + subtype,
                }) +
                ')';
            break;
        default:
            translatedType = type ? intl.formatMessage({ id: type }) : '';
            break;
    }

    const translatedFormat = formatCase
        ? ' (' + intl.formatMessage({ id: formatCase }) + ')'
        : '';

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

export const TypeCellRenderer = ({
    data,
    childrenMetadata,
}: {
    data: ElementAttributes;
    childrenMetadata: Record<UUID, ElementAttributes>;
}) => {
    const intl = useIntl();
    return (
        childrenMetadata[data?.elementUuid] && (
            <Box sx={styles.tableCell}>
                <OverflowableText
                    text={getElementTypeTranslation(
                        data?.type,
                        childrenMetadata[
                            data?.elementUuid
                        ]?.specificMetadata.type?.toString(),
                        childrenMetadata[
                            data?.elementUuid
                        ]?.specificMetadata.format?.toString(),
                        intl
                    )}
                    tooltipSx={styles.tooltip}
                />
            </Box>
        )
    );
};
