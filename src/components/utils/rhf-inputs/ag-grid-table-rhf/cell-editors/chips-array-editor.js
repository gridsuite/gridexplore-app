/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { forwardRef } from 'react';
import TableCellWrapper from './table-cell-wrapper';
import MultipleAutocompleteInput from '../../autocomplete-inputs/multiple-autocomplete-input';

const ChipsArrayEditor = forwardRef(({ ...props }, ref) => {
    const { name, node, colDef } = props;
    const cellName = `${name}.${node.rowIndex}.${colDef.field}`;
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
