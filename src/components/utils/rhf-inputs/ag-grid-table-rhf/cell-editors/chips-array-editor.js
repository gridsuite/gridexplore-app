import { forwardRef } from 'react';
import TableCellWrapper from './table-cell-wrapper';
import MultipleAutocompleteInput from '../../autocomplete-inputs/multiple-autocomplete-input';

const ChipsArrayEditor = forwardRef(({ ...props }, ref) => {
    const { name, rowIndex, colDef } = props;
    const cellName = `${name}.${rowIndex}.${colDef.field}`;
    return (
        <TableCellWrapper agGridRef={ref} name={cellName} {...props}>
            <MultipleAutocompleteInput
                name={cellName}
                formProps={{
                    sx: {
                        '& .MuiOutlinedInput-notchedOutline': {
                            border: 'unset', // Remove the border
                        },
                        '&:hover .MuiOutlinedInput-root': {
                            border: 'unset', // Remove the border on hover
                        },
                        '& .Mui-focused .MuiOutlinedInput-root': {
                            border: 'unset', // Remove the border when focused
                        },
                    },
                }}
            />
        </TableCellWrapper>
    );
});

export default ChipsArrayEditor;
