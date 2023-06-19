import { useController } from 'react-hook-form';
import { MenuItem, Select } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import React from 'react';

const SelectInput = ({ name, options, label, ...props }) => {
    const {
        field: { value, onChange },
    } = useController({
        name,
    });

    console.log(options);

    return (
        <Select
            fullWidth
            value={value}
            onChange={(e) => onChange(e.target.value)}
            labelId={label}
            {...props}
        >
            {options.map((option) => (
                <MenuItem key={option?.id} value={option?.id}>
                    <FormattedMessage id={option?.label} />
                </MenuItem>
            ))}
        </Select>
    );
};

export default SelectInput;
