/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Box } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { ColumnDef } from '@tanstack/react-table';
import {
    BASE_MODIFICATION_TABLE_COLUMNS,
    ComposedModificationMetadata,
    computeTagMinSize,
    NetworkModificationMetadata,
    networkModificationTableStyles,
    rootNetworkChipCellSx,
} from '@gridsuite/commons-ui';
import { ActivationSwitchCell, RootNetworkApplicabilityCell } from './applicability-cells';
import RootNetworkColumnHeader, { DeleteSelectedRootNetworksHeader } from './root-network-column-header';

const MIN_COLUMN_SIZE = 56;
// wide enough for the title of the column
const SWITCH_COLUMN_SIZE = 104;
// computeTagMinSize leaves no room for the icon of the chip nor between the chips, with many columns side by side
const CHIP_EXTRA_WIDTH = 12;
const DELETE_COLUMN_SIZE = 30;
const DELETE_COLUMN_ID = 'deleteSelectedRootNetworks';

// Stuck on the right so that the delete button stays visible when the table scrolls horizontally. The chips scroll
// beneath it, so it has to be opaque while keeping the background of its row (composite, hovered...), which may be
// translucent: the row color, inherited, is painted by ::after over the paper painted by ::before.
const deleteColumnCellStyle = {
    position: 'sticky',
    right: 0,
    zIndex: 0,
    backgroundColor: 'inherit',
    '&::before, &::after': {
        content: '""',
        position: 'absolute',
        inset: 0,
        zIndex: -1,
    },
    '&::before': { backgroundColor: 'background.paper' },
    '&::after': { backgroundColor: 'inherit' },
};

/**
 * The columns are the global applicability then the root network tags, each one selectable from its header. A row
 * shows and edits the applicabilities of a modification of the composite, taking the composite itself into account.
 */
export function createApplicabilityColumns(
    composite: NetworkModificationMetadata,
    tags: string[],
    withDeleteColumn: boolean
): ColumnDef<ComposedModificationMetadata>[] {
    const tagMinSizes = tags.map((tag) => computeTagMinSize(tag) + CHIP_EXTRA_WIDTH);
    const sharedSize = Math.max(Math.min(...tagMinSizes), MIN_COLUMN_SIZE);

    const rootNetworkColumns: ColumnDef<ComposedModificationMetadata>[] = tags.map((tag, index) => ({
        id: tag,
        header: RootNetworkColumnHeader,
        cell: ({ row, table }) => (
            <Box sx={rootNetworkChipCellSx}>
                <RootNetworkApplicabilityCell
                    row={row}
                    table={table}
                    compositeModificationId={composite.uuid}
                    tag={tag}
                />
            </Box>
        ),
        size: sharedSize,
        minSize: tagMinSizes[index],
        meta: {
            cellStyle: networkModificationTableStyles.columnCell.rootNetworkChip,
        },
    }));

    return [
        {
            id: BASE_MODIFICATION_TABLE_COLUMNS.SWITCH.id,
            header: () => <FormattedMessage id="activeInactive" />,
            cell: ({ row, table }) => (
                <ActivationSwitchCell row={row} table={table} compositeModificationId={composite.uuid} />
            ),
            size: SWITCH_COLUMN_SIZE,
            minSize: SWITCH_COLUMN_SIZE,
        },
        ...rootNetworkColumns,
        ...(withDeleteColumn
            ? [
                  {
                      id: DELETE_COLUMN_ID,
                      header: DeleteSelectedRootNetworksHeader,
                      size: DELETE_COLUMN_SIZE,
                      minSize: DELETE_COLUMN_SIZE,
                      meta: { cellStyle: deleteColumnCellStyle },
                  },
              ]
            : []),
    ];
}
