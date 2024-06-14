/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { defaultColumnDefinition } from './utils/directory-content-utils';
import {
    CustomAGGrid,
    ElementType,
    ElementAttributes,
} from '@gridsuite/commons-ui';
import { AgGridReact } from 'ag-grid-react';
import { GetRowIdParams } from 'ag-grid-community/dist/types/core/interfaces/iCallbackParams';
import { ColDef, GridReadyEvent, RowClassParams } from 'ag-grid-community';
import { RefObject } from 'react';

interface DirectoryContentTableProps {
    gridRef: RefObject<AgGridReact<ElementAttributes>>;
    rows: ElementAttributes[];
    handleCellContextualMenu: () => void;
    handleRowSelected: () => void;
    handleCellClick: () => void;
    colDef: ColDef[];
}

const getRowId = (params: GetRowIdParams<ElementAttributes>) =>
    params.data?.elementUuid;

export const CUSTOM_ROW_CLASS = 'custom-row-class';

const getRowStyle = (cellData: RowClassParams<ElementAttributes>) => {
    const style: Record<string, string> = { fontSize: '1rem' };
    if (
        cellData.data &&
        ![
            ElementType.CASE,
            ElementType.LOADFLOW_PARAMETERS,
            ElementType.SENSITIVITY_PARAMETERS,
            ElementType.SECURITY_ANALYSIS_PARAMETERS,
            ElementType.VOLTAGE_INIT_PARAMETERS,
        ].includes(cellData.data.type)
    ) {
        style.cursor = 'pointer';
    }
    return style;
};

export const DirectoryContentTable = ({
    gridRef,
    rows,
    handleCellContextualMenu,
    handleRowSelected,
    handleCellClick,
    colDef,
}: DirectoryContentTableProps) => {
    return (
        <CustomAGGrid
            ref={gridRef}
            rowData={rows}
            getRowId={getRowId}
            defaultColDef={defaultColumnDefinition}
            rowSelection="multiple"
            suppressRowClickSelection
            onCellContextMenu={handleCellContextualMenu}
            onCellClicked={handleCellClick}
            onRowSelected={handleRowSelected}
            animateRows={true}
            columnDefs={colDef}
            getRowStyle={getRowStyle}
            //We set a custom className for rows in order to easily determine if a context menu event is happening on a row or not
            rowClass={CUSTOM_ROW_CLASS}
        />
    );
};
