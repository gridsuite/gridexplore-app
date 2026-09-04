/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { type ElementAttributes, type MuiStyles } from '@gridsuite/commons-ui';
import { DatasetLinked as DatasetLinkedIcon } from '@mui/icons-material';
import { Box } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { isElementShared } from '../../../utils/element-utils';

const styles = {
    tableCell: {
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
    },
} as const satisfies MuiStyles;

export type SharingStatusCellRendererProps = {
    data: ElementAttributes;
};

export function SharingStatusCellRenderer({ data }: Readonly<SharingStatusCellRendererProps>) {
    if (!isElementShared(data)) {
        return (
            <Box sx={styles.tableCell} data-testid="ElementSharingStatus">
                -
            </Box>
        );
    }
    return (
        <Box sx={styles.tableCell} data-testid="ElementSharingStatus">
            <DatasetLinkedIcon fontSize="small" />
            <FormattedMessage id="directoryContent.column.shared" />
        </Box>
    );
}
