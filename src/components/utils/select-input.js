import { useController } from 'react-hook-form';
import { InputLabel, MenuItem, Select } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import React from 'react';
import FormControl from '@mui/material/FormControl';

const SelectInput = ({ name, options, label, ...props }) => {
    const {
        field: { value, onChange },
    } = useController({
        name,
    });

    return (
        <FormControl fullWidth>
            <InputLabel>
                <FormattedMessage id={label} />
            </InputLabel>
            <Select
                fullWidth
                value={value}
                onChange={(e) => onChange(e.target.value)}
                {...props}
            >
                {options.map((option) => (
                    <MenuItem key={option?.id} value={option?.id}>
                        <FormattedMessage id={option?.label} />
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

export default SelectInput;
