/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { ColumnDef } from '@tanstack/react-table';
import type { ComposedModificationMetadata, NetworkModificationMetadata } from '@gridsuite/commons-ui';
import { DeleteSelectedRootNetworksHeader } from './root-network-column-header';

// paddings, margins, border and vertical scrollbar around the table
const TABLE_SURROUNDINGS_WIDTH = 82;
const NAME_COLUMN_EXTRA_WIDTH = 160;
const DIALOG_MARGINS_WIDTH = 64;

/**
 * 75% of the screen, more when the columns need it, within the screen
 */
export function computeDialogWidth(tableMinWidth: number) {
    const neededWidth = tableMinWidth + NAME_COLUMN_EXTRA_WIDTH + TABLE_SURROUNDINGS_WIDTH;
    return `min(calc(100vw - ${DIALOG_MARGINS_WIDTH}px), max(75vw, ${neededWidth}px))`;
}

/**
 * Out of a study, the root networks are the tags found in the whole modification tree, plus the extra ones, sorted
 */
export function collectRootNetworkTags(
    modifications: NetworkModificationMetadata[],
    extraTags: string[] = []
): string[] {
    const tags = new Set<string>(extraTags);
    const collect = (modification: NetworkModificationMetadata) => {
        Object.keys(modification.applicabilityByRootNetworkTag ?? {}).forEach((tag) => tags.add(tag));
        modification.modificationsInfos?.forEach(collect);
        if (modification.referencedInfos) {
            collect(modification.referencedInfos);
        }
    };
    modifications.forEach(collect);
    return [...tags].sort((tag1, tag2) => tag1.localeCompare(tag2));
}

// Sticky on the right, opaque over the scrolling chips while keeping the (possibly translucent) row background
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

const DELETE_COLUMN_SIZE = 30;

export const deleteSelectedRootNetworksColumn: ColumnDef<ComposedModificationMetadata> = {
    id: 'deleteSelectedRootNetworks',
    header: DeleteSelectedRootNetworksHeader,
    size: DELETE_COLUMN_SIZE,
    minSize: DELETE_COLUMN_SIZE,
    meta: { cellStyle: deleteColumnCellStyle },
};
