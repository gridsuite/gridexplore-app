/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { forwardRef } from 'react';
import TableCellWrapper from './table-cell-wrapper';
import { useFormContext } from 'react-hook-form';
import { FieldConstants, MultipleAutocompleteInput } from '@gridsuite/commons-ui';

const ChipsArrayEditor = forwardRef(({ ...props }, ref) => {
    const { name, node, colDef } = props;
    const { getValues } = useFormContext();

    const getIndexInFormData = (nodeData) => {
        return getValues(name).findIndex(
            (row) =>
                row[FieldConstants.AG_GRID_ROW_UUID] ===
                nodeData[FieldConstants.AG_GRID_ROW_UUID]
        );
    };

    const cellName = `${name}.${getIndexInFormData(node.data)}.${colDef.field}`;

    return (
        <TableCellWrapper agGridRef={ref} name={cellName}>
            <MultipleAutocompleteInput
                name={cellName}
                size={'small'}
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
