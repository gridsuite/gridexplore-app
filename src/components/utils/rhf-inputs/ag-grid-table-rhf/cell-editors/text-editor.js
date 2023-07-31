/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { forwardRef } from 'react';
import TableCellWrapper from './table-cell-wrapper';
import { useController } from 'react-hook-form';
import TextField from '@mui/material/TextField';

const TextEditor = forwardRef(({ ...props }, ref) => {
    const { name, node, colDef } = props;
    const cellName = `${name}.${node.rowIndex}.${colDef.field}`;
    const {
        field: { value, onChange },
    } = useController({
        name: cellName,
    });

    return (
        <TableCellWrapper agGridRef={ref} name={cellName}>
            <TextField
                fullWidth
                value={value}
                size={'small'}
                onChange={onChange}
                sx={{
                    height: '100%',
                    '& .MuiOutlinedInput-notchedOutline': {
                        border: 'unset', // Remove the border
                    },
                    '&:hover .MuiOutlinedInput-root': {
                        border: 'unset', // Remove the border on hover
                    },
                    '& .Mui-focused .MuiOutlinedInput-root': {
                        border: 'unset', // Remove the border when focused
                    },
                }}
            />
        </TableCellWrapper>
    );
});

export default TextEditor;
