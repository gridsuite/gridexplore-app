/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
    DEFAULT_CELL_PADDING,
    MuiVirtualizedTable,
} from '@gridsuite/commons-ui';
import { withStyles } from '@mui/material';

const styles = (theme) => ({
    flexContainer: {
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
    },
    table: {
        // temporary right-to-left patch, waiting for
        // https://github.com/bvaughn/react-virtualized/issues/454
        '& .ReactVirtualized__Table__headerRow': {
            flip: false,
            paddingRight:
                theme.direction === 'rtl' ? '0 !important' : undefined,
        },
        '& .ReactVirtualized__Table__Grid': {
            outline: 'none',
        },
    },
    tableRow: {
        cursor: 'pointer',
    },
    tableRowHover: {
        '&:hover': {
            backgroundColor: theme.row.hover,
        },
    },
    tableCell: {
        flex: 1,
        padding: DEFAULT_CELL_PADDING,
    },
    noClick: {
        cursor: 'initial',
    },
    tableCellColor: {
        color: theme.link.color,
    },
    header: {
        backgroundColor: 'inherit',
    },
    rowBackgroundDark: {
        backgroundColor: theme.row.primary,
    },
    rowBackgroundLight: {
        backgroundColor: theme.row.secondary,
    },
});

const VirtualizedTable = withStyles(styles)(MuiVirtualizedTable);
export default VirtualizedTable;
