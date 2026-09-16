/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { type ElementAttributes, type MuiStyles, OverflowableText } from '@gridsuite/commons-ui';
import { Box } from '@mui/material';
import type { DirectoryContentGridContext } from '../directory-content-utils';

const styles = {
    tooltip: {
        maxWidth: '1000px',
    },
    tableCell: {
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
    },
} as const satisfies MuiStyles;

export type TypeCellRendererProps = {
    data: ElementAttributes;
    // The cell value is already the translated label, computed once by the column valueGetter.
    value: string;
    context: DirectoryContentGridContext;
};

export function TypeCellRenderer({ data, value, context: { childrenMetadata } }: Readonly<TypeCellRendererProps>) {
    return (
        childrenMetadata[data?.elementUuid] && (
            <Box sx={styles.tableCell}>
                <OverflowableText text={value} tooltipSx={styles.tooltip} data-testid="ElementType" />
            </Box>
        )
    );
}
