/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { forwardRef, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { FieldConstants, MultipleAutocompleteInput } from '@gridsuite/commons-ui';
import { ColDef, GridApi, IRowNode } from 'ag-grid-community';
import TableCellWrapper from './table-cell-wrapper';

export interface ChipsArrayEditorProps {
    name: string;
    node: IRowNode<AgGridData>;
    colDef: ColDef;
    api: GridApi;
    sideActionCallback: Function;
}

export interface SideActionProps {
    api: GridApi;
    node: IRowNode<AgGridData>;
}

type AgGridData = {
    [FieldConstants.AG_GRID_ROW_UUID]: string;
    [key: string]: any;
};

const ChipsArrayEditor = forwardRef(({ ...props }: ChipsArrayEditorProps, ref) => {
    const { name, node, colDef, api, sideActionCallback } = props;
    const { control, getValues } = useFormContext();
    const rows = (getValues(name) ?? []) as AgGridData[];

    const indexByUuid = rows.findIndex(
        (row) => row[FieldConstants.AG_GRID_ROW_UUID] === node.data?.[FieldConstants.AG_GRID_ROW_UUID]
    );
    // AG Grid can briefly retain stale row data after a field-array replacement.
    const candidateIndex = indexByUuid !== -1 ? indexByUuid : node.sourceRowIndex;
    const rowIndex = candidateIndex >= 0 && candidateIndex < rows.length ? candidateIndex : -1;
    const cellName = `${name}.${rowIndex}.${colDef.field}`;

    const valuesInChips = useWatch({ control, name: cellName, exact: true });

    useEffect(() => {
        sideActionCallback({ api, node });
    }, [valuesInChips, sideActionCallback, api, node]);

    return rowIndex < 0 ? null : (
        <TableCellWrapper ref={ref} name={cellName}>
            <MultipleAutocompleteInput
                name={cellName}
                size="small"
                formProps={{
                    sx: {
                        '& .MuiOutlinedInput-notchedOutline': {
                            border: 'unset', // Remove the border
                        },
                    },
                }}
            />
        </TableCellWrapper>
    );
});

export default ChipsArrayEditor;
