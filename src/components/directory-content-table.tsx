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
import { RefObject, useCallback } from 'react';

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
    const getCustomRowStyle = useCallback(
        (cellData: RowClassParams<ElementAttributes>) => {
            return {
                ...getClickableRowStyle(cellData),
                ...getRowStyle?.(cellData),
            };
        },
        [getRowStyle]
    );

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
            animateRows={true}
            columnDefs={colDef}
            getRowStyle={getCustomRowStyle}
            //We set a custom className for rows in order to easily determine if a context menu event is happening on a row or not
            rowClass={CUSTOM_ROW_CLASS}
        />
    );
};
