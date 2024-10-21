/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { forwardRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { FieldConstants, MultipleAutocompleteInput } from '@gridsuite/commons-ui';
import { ColDef, IRowNode } from 'ag-grid-community';
import TableCellWrapper from './table-cell-wrapper';

export interface ChipsArrayEditorProps {
    name: string;
    node: IRowNode<AgGridData>;
    colDef: ColDef;
}

type AgGridData = {
    [FieldConstants.AG_GRID_ROW_UUID]: string;
    [key: string]: any;
};

const ChipsArrayEditor = forwardRef(({ ...props }: ChipsArrayEditorProps, ref) => {
    const { name, node, colDef } = props;
    const { getValues } = useFormContext();

    const getIndexInFormData = (nodeData: AgGridData | undefined) =>
        getValues(name).findIndex(
            (row: AgGridData) =>
                nodeData && row[FieldConstants.AG_GRID_ROW_UUID] === nodeData[FieldConstants.AG_GRID_ROW_UUID]
        );

    const cellName = `${name}.${getIndexInFormData(node.data)}.${colDef.field}`;

    return (
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
