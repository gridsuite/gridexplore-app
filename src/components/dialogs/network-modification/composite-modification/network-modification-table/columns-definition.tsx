/*
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { SetStateAction } from 'react';
import { NetworkModificationMetadata } from '@gridsuite/commons-ui';
import { ColumnDef } from '@tanstack/react-table';
import DragHandleCell from './renderers/drag-handle-cell';
import {
    NetworkModificationEditorNameHeader,
    NetworkModificationEditorNameHeaderProps,
} from './renderers/network-modification-node-editor-name-header';
import NameCell from './renderers/name-cell';
import SelectCell from './renderers/select-cell';
import SelectHeaderCell from './renderers/select-header-cell';
import { styles } from './styles';

export const BASE_MODIFICATION_TABLE_COLUMNS = {
    DRAG_HANDLE: {
        id: 'dragHandle',
        autoExtensible: false,
    },
    SELECT: {
        id: 'select',
        autoExtensible: false,
    },
    NAME: {
        id: 'modificationName',
        autoExtensible: true,
    },
    DESCRIPTION: {
        id: 'modificationDescription',
        autoExtensible: false,
    },
    SWITCH: {
        id: 'switch',
        autoExtensible: false,
    },
};

export const AUTO_EXTENSIBLE_COLUMNS = Object.values(BASE_MODIFICATION_TABLE_COLUMNS)
    .filter((column) => column.autoExtensible)
    .map((column) => column.id);

type NameHeaderProps = Omit<NetworkModificationEditorNameHeaderProps, 'modificationCount'>;

/**
 * Column definition is broken up in 2 parts : base columns which are always on display and root networks columns.
 * Since the amount of root network is inbetween 1-4 and we want to be able to control the status of a modification
 * for each individual root network hence they all have a dedicated column generated on the fly
 */

export const createBaseColumns = (
    isRowDragDisabled: boolean,
    modificationsCount: number,
    nameHeaderProps: NameHeaderProps,
    setModifications: React.Dispatch<SetStateAction<NetworkModificationMetadata[]>>
): ColumnDef<NetworkModificationMetadata>[] => [
    {
        id: BASE_MODIFICATION_TABLE_COLUMNS.DRAG_HANDLE.id,
        cell: () => <DragHandleCell isRowDragDisabled={isRowDragDisabled} />,
        size: 24,
        minSize: 24,
        meta: {
            cellStyle: {
                justifyContent: 'center',
            },
        },
    },
    {
        id: BASE_MODIFICATION_TABLE_COLUMNS.SELECT.id,
        header: ({ table }) => <SelectHeaderCell table={table} />,
        cell: ({ row, table }) => <SelectCell row={row} table={table} />,
        size: 32,
        minSize: 32,
        meta: {
            cellStyle: styles.columnCell.select,
        },
    },
    {
        id: BASE_MODIFICATION_TABLE_COLUMNS.NAME.id,
        header: () => (
            <NetworkModificationEditorNameHeader modificationCount={modificationsCount} {...nameHeaderProps} />
        ),
        cell: ({ row }) => <NameCell row={row} />,
        meta: {
            cellStyle: styles.columnCell.modificationName,
        },
        minSize: 160,
    },
];
