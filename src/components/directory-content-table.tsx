/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { defaultColumnDefinition } from './utils/directory-content-utils';
import { CustomAGGrid, ElementAttributes, ElementType } from '@gridsuite/commons-ui';
import { AgGridReact, AgGridReactProps } from 'ag-grid-react';
import { ColDef, RowClassParams, AgGridEvent, GetRowIdParams } from 'ag-grid-community';
import { RefObject, useCallback, useEffect, useState } from 'react';
import { setReorderedColumns } from '../redux/actions';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../redux/reducer';

interface DirectoryContentTableProps extends Pick<AgGridReactProps<ElementAttributes>, 'getRowStyle' | 'onGridReady'> {
    gridRef: RefObject<AgGridReact<ElementAttributes>>;
    rows: ElementAttributes[];
    handleCellContextualMenu: () => void;
    handleRowSelected: () => void;
    handleCellClick: () => void;
    colDef: ColDef[];
}

const getRowId = (params: GetRowIdParams<ElementAttributes>) => params.data?.elementUuid;

const recomputeOverFlowableCells = ({ api }: AgGridEvent) =>
    api.refreshCells({ force: true, columns: ['elementName', 'type'] });

export const CUSTOM_ROW_CLASS = 'custom-row-class';

const getClickableRowStyle = (cellData: RowClassParams<ElementAttributes>) => {
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
        ].includes(cellData.data.type)
    ) {
        style.cursor = 'pointer';
    }
    return style;
};

const reorderColumns = (colDef: ColDef[], newFieldOrder: string[] | undefined): ColDef[] => {
    const fieldIndexMap = new Map(newFieldOrder?.map((field, index) => [field, index]));
    return colDef
        .filter((col) => fieldIndexMap.has(col.field || ''))
        .sort((a, b) => {
            const indexA = fieldIndexMap.get(a.field || '') ?? -1;
            const indexB = fieldIndexMap.get(b.field || '') ?? -1;
            return indexA - indexB;
        });
};

export const DirectoryContentTable = ({
    gridRef,
    rows,
    getRowStyle,
    handleCellContextualMenu,
    handleRowSelected,
    handleCellClick,
    onGridReady,
    colDef,
}: DirectoryContentTableProps) => {
    const [columnDefs, setColumnDefs] = useState<ColDef[]>(colDef);
    const getCustomRowStyle = useCallback(
        (cellData: RowClassParams<ElementAttributes>) => {
            return {
                ...getClickableRowStyle(cellData),
                ...getRowStyle?.(cellData),
            };
        },
        [getRowStyle]
    );

    const dispatch = useDispatch();
    const columnOrder = useSelector((state: AppState) => state.reorderedColumns);

    useEffect(() => {
        const extractColumnOrder = (columnDefs: ColDef[]): string[] => {
            return columnDefs.filter((col) => col.field).map((col) => col.field as string);
        };

        if (!columnOrder || columnOrder.length === 0) {
            const initialColumnOrder = extractColumnOrder(colDef);
            dispatch(setReorderedColumns(initialColumnOrder));
        } else {
            const orderedColumnDefs = reorderColumns(colDef, columnOrder);
            setColumnDefs(orderedColumnDefs);
        }
    }, [columnOrder, colDef, dispatch]);

    const onColumnMoved = useCallback(() => {
        const extractFieldNames = (currentColumnDefs: ColDef[] | undefined): string[] => {
            return (currentColumnDefs ?? [])
                .filter((obj): obj is ColDef => obj && typeof obj === 'object' && 'field' in obj)
                .map((def) => def.field)
                .filter((field): field is string => field !== undefined);
        };

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
            rowSelection="multiple"
            suppressRowClickSelection
            onGridReady={onGridReady}
            onCellContextMenu={handleCellContextualMenu}
            onCellClicked={handleCellClick}
            onRowSelected={handleRowSelected}
            onGridSizeChanged={recomputeOverFlowableCells}
            onColumnMoved={onColumnMoved}
            animateRows={true}
            columnDefs={columnDefs}
            getRowStyle={getCustomRowStyle}
            //We set a custom className for rows in order to easily determine if a context menu event is happening on a row or not
            rowClass={CUSTOM_ROW_CLASS}
        />
    );
};
