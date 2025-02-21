/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { IntlShape } from 'react-intl';
import { UUID } from 'crypto';
import { AgGridReact } from 'ag-grid-react';
import { MutableRefObject } from 'react';
import { ColDef, IRowNode } from 'ag-grid-community';
import type { ElementAttributes } from '@gridsuite/commons-ui';
import { NameCellRenderer } from './renderers/name-cell-renderer';
import { DescriptionCellRenderer } from './renderers/description-cell-renderer';
import { TypeCellRenderer } from './renderers/type-cell-renderer';
import { UserCellRenderer } from './renderers/user-cell-renderer';
import { DateCellRenderer } from './renderers/date-cell-renderer';
import { getElementTypeTranslation } from './translation-utils';

export const formatMetadata = (
    data: ElementAttributes,
    childrenMetadata: Record<UUID, ElementAttributes>
): ElementAttributes => ({
    ...data,
    subtype: childrenMetadata[data.elementUuid]?.specificMetadata.type,
    hasMetadata: !!childrenMetadata[data.elementUuid],
});

export const computeCheckedElements = (
    gridRef: MutableRefObject<AgGridReact | null>,
    childrenMetadata: Record<UUID, ElementAttributes>
): ElementAttributes[] =>
    gridRef.current?.api?.getSelectedRows().map((row: ElementAttributes) => formatMetadata(row, childrenMetadata)) ??
    [];

export const isRowUnchecked = (row: ElementAttributes, checkedRows: ElementAttributes[]) =>
    checkedRows?.length &&
    row?.elementUuid &&
    !checkedRows.find((checkedRow) => checkedRow.elementUuid === row.elementUuid);

export const defaultColumnDefinition: ColDef<unknown> = {
    sortable: true,
    resizable: true,
    lockPinned: true,
    wrapHeaderText: true,
    autoHeaderHeight: true,
    lockVisible: true,
    comparator: (valueA: string | null | undefined, valueB: string | null | undefined) => {
        // Need to check because ghost elements (uploading ones) don't have
        // created or modification dates yet
        if (!valueA || !valueB) {
            return -1;
        }
        return valueA.toLowerCase().localeCompare(valueB.toLowerCase());
    },
};

export const getColumnsDefinition = (childrenMetadata: Record<UUID, ElementAttributes>, intl: IntlShape): ColDef[] => [
    {
        headerName: intl.formatMessage({
            id: 'elementName',
        }),
        field: 'elementName',
        pinned: true,
        cellRenderer: NameCellRenderer,
        cellRendererParams: {
            childrenMetadata,
        },
        cellStyle: { display: 'flex' },
        minWidth: 400,
    },
    {
        headerName: intl.formatMessage({
            id: 'description',
        }),
        field: 'description',
        cellRenderer: DescriptionCellRenderer,
        sortable: false,
        minWidth: 110,
        flex: 1,
    },
    {
        headerName: intl.formatMessage({
            id: 'type',
        }),
        field: 'type',
        sortable: true,
        cellRenderer: TypeCellRenderer,
        cellRendererParams: {
            childrenMetadata,
        },
        minWidth: 200,
        flex: 2,
        comparator: (
            valueA: string,
            valueB: string,
            nodeA: IRowNode<ElementAttributes>,
            nodeB: IRowNode<ElementAttributes>
        ) => {
            const getTranslatedOrOriginalValue = (node: IRowNode<ElementAttributes>): string => {
                const { type, elementUuid } = node.data ?? {};
                if (!type) {
                    return '';
                }

                const metaData = elementUuid ? childrenMetadata[elementUuid]?.specificMetadata : null;
                const subtype = metaData?.type?.toString() ?? null;
                const formatCase = metaData?.format?.toString() ?? null;

                return getElementTypeTranslation(type, subtype, formatCase, intl);
            };

            const translatedA = getTranslatedOrOriginalValue(nodeA);
            const translatedB = getTranslatedOrOriginalValue(nodeB);

            return translatedA.localeCompare(translatedB);
        },
    },
    {
        headerName: intl.formatMessage({
            id: 'creator',
        }),
        field: 'ownerLabel',
        cellRenderer: UserCellRenderer,
        minWidth: 110,
        flex: 1,
    },
    {
        headerName: intl.formatMessage({
            id: 'created',
        }),
        field: 'creationDate',
        cellRenderer: DateCellRenderer,
        minWidth: 130,
        flex: 2,
    },
    {
        headerName: intl.formatMessage({
            id: 'modifiedBy',
        }),
        field: 'lastModifiedByLabel',
        cellRenderer: UserCellRenderer,
        minWidth: 110,
        flex: 1,
    },
    {
        headerName: intl.formatMessage({
            id: 'modified',
        }),
        field: 'lastModificationDate',
        cellRenderer: DateCellRenderer,
        minWidth: 130,
        flex: 2,
    },
];
