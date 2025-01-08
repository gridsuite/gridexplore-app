/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { CustomAGGrid, ElementAttributes, ElementType } from '@gridsuite/commons-ui';
import { AgGridReact, AgGridReactProps } from 'ag-grid-react';
import type {
    CellClickedEvent,
    CellContextMenuEvent,
    ColDef,
    ColDefField,
    GetRowIdParams,
    GridOptions,
} from 'ag-grid-community';
import { RefObject, useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setReorderedColumns } from '../redux/actions';
import { defaultColumnDefinition } from './utils/directory-content-utils';
import { AppState } from '../redux/types';

export interface DirectoryContentTableProps
    extends Pick<AgGridReactProps<ElementAttributes>, 'getRowStyle' | 'onGridReady'> {
    gridRef: RefObject<AgGridReact<ElementAttributes>>;
    rows: ElementAttributes[];
    handleCellContextualMenu: (event: CellContextMenuEvent<ElementAttributes>) => void;
    handleRowSelected: () => void;
    handleCellClick: (event: CellClickedEvent<ElementAttributes>) => void;
    colDef: ColDef<ElementAttributes>[];
}

type GetGridOpt<TOption extends keyof GridOptions> = NonNullable<GridOptions<ElementAttributes>[TOption]>;

const getRowId: GetGridOpt<'getRowId'> = (params: GetRowIdParams<ElementAttributes>) => params.data?.elementUuid;

const recomputeOverFlowableCells: GetGridOpt<'onGridSizeChanged'> = ({ api }) =>
    api.refreshCells({ force: true, columns: ['elementName', 'type'] });

export const CUSTOM_ROW_CLASS = 'custom-row-class';

const getClickableRowStyle: GetGridOpt<'getRowStyle'> = (cellData) => {
    const style: Record<string, string> = { fontSize: '1rem' };
    if (
        cellData.data &&
        ![
            ElementType.CASE,
            ElementType.LOADFLOW_PARAMETERS,
            ElementType.SENSITIVITY_PARAMETERS,
            ElementType.SECURITY_ANALYSIS_PARAMETERS,
            ElementType.VOLTAGE_INIT_PARAMETERS,
            ElementType.SHORT_CIRCUIT_PARAMETERS,
            ElementType.SPREADSHEET_CONFIG,
            ElementType.SPREADSHEET_CONFIG_COLLECTION,
        ].includes(cellData.data.type)
    ) {
        style.cursor = 'pointer';
    }
    return style;
};

const reorderColumns = (
    colDef: ColDef<ElementAttributes>[],
    newFieldOrder: string[] | undefined
): ColDef<ElementAttributes>[] => {
    const fieldIndexMap = new Map(newFieldOrder?.map((field, index) => [field, index]));
    return colDef
        .filter((col) => fieldIndexMap.has(col.field ?? ''))
        .sort((a, b) => {
            const indexA = fieldIndexMap.get(a.field ?? '') ?? -1;
            const indexB = fieldIndexMap.get(b.field ?? '') ?? -1;
            return indexA - indexB;
        });
};

function extractColumnOrder(colDefs: ColDef<ElementAttributes>[]): string[] {
    return colDefs
        .map((col) => col.field)
        .filter((field): field is ColDefField<ElementAttributes> => field !== undefined);
}

function extractFieldNames(currentColumnDefs: ColDef<ElementAttributes>[] = []): string[] {
    return currentColumnDefs
        .filter((obj): obj is ColDef<ElementAttributes> => obj && typeof obj === 'object' && 'field' in obj)
        .map((def) => def.field)
        .filter((field): field is ColDefField<ElementAttributes> => field !== undefined);
}

export function DirectoryContentTable({
    gridRef,
    rows,
    getRowStyle,
    handleCellContextualMenu,
    handleRowSelected,
    handleCellClick,
    onGridReady,
    colDef,
}: Readonly<DirectoryContentTableProps>) {
    const [columnDefs, setColumnDefs] = useState(colDef);
    const getCustomRowStyle = useCallback<NonNullable<GridOptions<ElementAttributes>['getRowStyle']>>(
        (cellData) => ({
            ...getClickableRowStyle(cellData),
            ...getRowStyle?.(cellData),
        }),
        [getRowStyle]
    );

    const dispatch = useDispatch();
    const columnOrder = useSelector((state: AppState) => state.reorderedColumns);

    useEffect(() => {
        if (!columnOrder || columnOrder.length === 0) {
            dispatch(setReorderedColumns(extractColumnOrder(colDef)));
        } else {
            setColumnDefs(reorderColumns(colDef, columnOrder));
        }
    }, [columnOrder, colDef, dispatch]);

    const onColumnMoved = useCallback<GetGridOpt<'onColumnMoved'>>(() => {
        dispatch(setReorderedColumns(extractFieldNames(gridRef?.current?.api?.getColumnDefs())));
    }, [dispatch, gridRef]);

    return (
        <CustomAGGrid
            ref={gridRef}
            rowData={rows}
            getRowId={getRowId}
            defaultColDef={defaultColumnDefinition}
            rowSelection="multiple"
            suppressRowClickSelection
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
        />
    );
}
