/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ElementAttributes, ElementType, OverflowableText } from '@gridsuite/commons-ui';
import { useIntl } from 'react-intl';
import { UUID } from 'crypto';
import { Box } from '@mui/material';
import { getElementTypeTranslation } from '../translation-utils';

// This function is used to lowercase all the characters in a string except the first one
const toTitleCase = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

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

export type TypeCellRendererProps = {
    data: ElementAttributes;
    childrenMetadata: Record<UUID, ElementAttributes>;
};

export function TypeCellRenderer({ data, childrenMetadata }: Readonly<TypeCellRendererProps>) {
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
                            ? toTitleCase(specificMetadata.sheetType ?? 'no-type') ?? null
                            : specificMetadata.format?.toString() ?? null,
                        intl
                    )}
                    tooltipSx={styles.tooltip}
                />
            </Box>
        )
    );
}
