/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { CustomAGGrid, ElementAttributes, ElementType } from '@gridsuite/commons-ui';
import { AgGridReact, AgGridReactProps } from 'ag-grid-react';
import type {
    AgGridEvent,
    CellClickedEvent,
    CellContextMenuEvent,
    ColDef,
    GetRowIdParams,
    RowClassParams,
    RowStyle,
} from 'ag-grid-community';
import { RefObject, useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setReorderedColumns } from '../redux/actions';
import { defaultColumnDefinition } from './utils/directory-content-utils';
import { AppState } from '../redux/types';
import { AGGRID_LOCALES } from '../translations/not-intl/aggrid-locales';

export interface DirectoryContentTableProps
    extends Pick<AgGridReactProps<ElementAttributes>, 'getRowStyle' | 'onGridReady'> {
    gridRef: RefObject<AgGridReact<ElementAttributes>>;
    rows: ElementAttributes[];
    handleCellContextualMenu: (event: CellContextMenuEvent) => void;
    handleRowSelected: () => void;
    handleCellClick: (event: CellClickedEvent) => void;
    colDef: ColDef[];
    selectedDirectoryWritable: boolean;
}

const getRowId = (params: GetRowIdParams<ElementAttributes>) => params.data?.elementUuid;

const recomputeOverFlowableCells = ({ api }: AgGridEvent) =>
    api.refreshCells({ force: true, columns: ['elementName', 'type'] });

export const CUSTOM_ROW_CLASS = 'custom-row-class';

const reorderColumns = (colDef: ColDef[], newFieldOrder: string[] | undefined): ColDef[] => {
    const fieldIndexMap = new Map(newFieldOrder?.map((field, index) => [field, index]));
    return colDef
        .filter((col) => fieldIndexMap.has(col.field ?? ''))
        .sort((a, b) => {
            const indexA = fieldIndexMap.get(a.field ?? '') ?? -1;
            const indexB = fieldIndexMap.get(b.field ?? '') ?? -1;
            return indexA - indexB;
        });
};

export function DirectoryContentTable({
    gridRef,
    rows,
    getRowStyle,
    handleCellContextualMenu,
    handleRowSelected,
    handleCellClick,
    onGridReady,
    colDef,
    selectedDirectoryWritable,
}: Readonly<DirectoryContentTableProps>) {
    const [columnDefs, setColumnDefs] = useState<ColDef[]>(colDef);

    const getCustomRowStyle = useCallback(
        (cellData: RowClassParams<ElementAttributes>) => {
            const style: RowStyle = { fontSize: '1rem' };
            const unEditableElements = [
                ElementType.CASE,
                ElementType.DIAGRAM_CONFIG,
                ElementType.SPREADSHEET_CONFIG,
                ElementType.SPREADSHEET_CONFIG_COLLECTION,
            ];
            if (cellData.data) {
                if (cellData.data.type === ElementType.STUDY && !selectedDirectoryWritable) {
                    style.cursor = 'not-allowed';
                } else if (!unEditableElements.includes(cellData.data.type)) {
                    style.cursor = 'pointer';
                }
            }
            return {
                ...style,
                ...getRowStyle?.(cellData),
            };
        },
        [getRowStyle, selectedDirectoryWritable]
    );

    const dispatch = useDispatch();
    const columnOrder = useSelector((state: AppState) => state.reorderedColumns);

    useEffect(() => {
        const extractColumnOrder = (colDefs: ColDef[]): string[] =>
            colDefs.filter((col) => col.field).map((col) => col.field as string);
        if (!columnOrder || columnOrder.length === 0) {
            const initialColumnOrder = extractColumnOrder(colDef);
            dispatch(setReorderedColumns(initialColumnOrder));
        } else {
            const orderedColumnDefs = reorderColumns(colDef, columnOrder);
            setColumnDefs(orderedColumnDefs);
        }
    }, [columnOrder, colDef, dispatch]);

    const onColumnMoved = useCallback(() => {
        const extractFieldNames = (currentColumnDefs: ColDef[] | undefined): string[] =>
            (currentColumnDefs ?? [])
                .filter((obj): obj is ColDef => obj && typeof obj === 'object' && 'field' in obj)
                .map((def) => def.field)
                .filter((field): field is string => field !== undefined);
        const currentColumnDefs = gridRef?.current?.api?.getColumnDefs();
        const fieldNames = extractFieldNames(currentColumnDefs);
        dispatch(setReorderedColumns(fieldNames));
    }, [dispatch, gridRef]);
    return (
        <CustomAGGrid
            ref={gridRef}
            rowData={rows}
            getRowId={getRowId}
            defaultColDef={defaultColumnDefinition}
            rowSelection={{
                mode: 'multiRow',
                enableClickSelection: false,
                checkboxes: selectedDirectoryWritable,
                headerCheckbox: selectedDirectoryWritable,
            }}
            selectionColumnDef={{ pinned: 'left' }}
            onGridReady={onGridReady}
            onCellContextMenu={handleCellContextualMenu}
            onCellClicked={handleCellClick}
            onRowSelected={handleRowSelected}
            onGridSizeChanged={recomputeOverFlowableCells}
            onColumnMoved={onColumnMoved}
            animateRows
            columnDefs={columnDefs}
            getRowStyle={getCustomRowStyle}
            // We set a custom className for rows in order to easily determine if a context menu event is happening on a row or not
            rowClass={CUSTOM_ROW_CLASS}
            overrideLocales={AGGRID_LOCALES}
        />
    );
}
