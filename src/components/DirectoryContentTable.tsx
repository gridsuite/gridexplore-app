/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { defaultColumnDefinition } from './utils/directory-content-utils';
import { CustomAGGrid, ElementType } from '@gridsuite/commons-ui';
import { AgGridReact } from 'ag-grid-react';
import { IElement } from '../redux/reducer.type';
import { GetRowIdParams } from 'ag-grid-community/dist/types/core/interfaces/iCallbackParams';
import { ColDef, GridReadyEvent, RowClassParams } from 'ag-grid-community';

interface DirectoryContentTableProps {
    gridRef: React.ForwardedRef<AgGridReact<IElement>>;
    rows: IElement[];
    handleRowSelected: () => void;
    handleCellClick: () => void;
    colDef: ColDef[];
}

const onGridReady = ({ api }: GridReadyEvent<IElement>) => {
    api?.sizeColumnsToFit();
};

const getRowId = (params: GetRowIdParams<IElement>): string =>
    params.data?.elementUuid;

const getRowStyle = (cellData: RowClassParams<IElement>) => {
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
            onGridReady={onGridReady}
            onCellClicked={handleCellClick}
            onRowSelected={handleRowSelected}
            animateRows={true}
            columnDefs={colDef}
            getRowStyle={getRowStyle}
        />
    );
};
