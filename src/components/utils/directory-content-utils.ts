/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { IntlShape } from 'react-intl';
import { UUID } from 'crypto';
import { AgGridReact } from 'ag-grid-react';
import React from 'react';
import { ColDef } from 'ag-grid-community';
import { NameCellRenderer } from './renderers/name-cell-renderer';
import { DescriptionCellRenderer } from './renderers/description-cell-renderer';
import { TypeCellRenderer } from './renderers/type-cell-renderer';
import { UserCellRenderer } from './renderers/user-cell-renderer';
import { DateCellRenderer } from './renderers/date-cell-renderer';
import type { ElementAttributes } from '@gridsuite/commons-ui';

export const formatMetadata = (
    data: ElementAttributes,
    childrenMetadata: Record<UUID, ElementAttributes>
) => ({
    ...data,
    subtype: childrenMetadata[data.elementUuid]?.specificMetadata.type,
    hasMetadata: !!childrenMetadata[data.elementUuid],
});

export const computeCheckedElements = (
    gridRef: React.MutableRefObject<AgGridReact | null>,
    childrenMetadata: Record<UUID, ElementAttributes>
) => {
    return (
        gridRef.current?.api
            ?.getSelectedRows()
            .map((row: ElementAttributes) =>
                formatMetadata(row, childrenMetadata)
            ) ?? []
    );
};

export const isRowUnchecked = (
    row: ElementAttributes,
    checkedRows: ElementAttributes[]
) =>
    checkedRows?.length &&
    row?.elementUuid &&
    !checkedRows.find(
        (checkedRow) => checkedRow.elementUuid === row.elementUuid
    );

export const defaultColumnDefinition = {
    sortable: true,
    resizable: false,
    lockPinned: true,
    wrapHeaderText: true,
    autoHeaderHeight: true,
    suppressMovable: true,
    flex: 1,
};
export const getColumnsDefinition = (
    childrenMetadata: Record<UUID, ElementAttributes>,
    intl: IntlShape
): ColDef[] => [
    {
        headerName: intl.formatMessage({
            id: 'elementName',
        }),
        field: 'elementName',
        cellRenderer: NameCellRenderer,
        cellRendererParams: {
            childrenMetadata: childrenMetadata,
        },
        headerCheckboxSelection: true,
        checkboxSelection: true,
        flex: 5,
    },
    {
        headerName: intl.formatMessage({
            id: 'description',
        }),
        field: 'description',
        cellRenderer: DescriptionCellRenderer,
        flex: 1.1,
    },
    {
        headerName: intl.formatMessage({
            id: 'type',
        }),
        field: 'type',
        cellRenderer: TypeCellRenderer,
        cellRendererParams: {
            childrenMetadata: childrenMetadata,
        },
        flex: 2,
    },
    {
        headerName: intl.formatMessage({
            id: 'creator',
        }),
        field: 'owner',
        cellRenderer: UserCellRenderer,
        flex: 1,
    },
    {
        headerName: intl.formatMessage({
            id: 'created',
        }),
        field: 'creationDate',
        cellRenderer: DateCellRenderer,
        flex: 2,
    },
    {
        headerName: intl.formatMessage({
            id: 'modifiedBy',
        }),
        field: 'lastModifiedBy',
        cellRenderer: UserCellRenderer,
        flex: 1,
    },
    {
        headerName: intl.formatMessage({
            id: 'modified',
        }),
        field: 'lastModificationDate',
        cellRenderer: DateCellRenderer,
        flex: 2,
    },
];
