import { useController } from 'react-hook-form';
import { MenuItem, Select } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import React from 'react';

const SelectInput = ({ name, options, label = '', ...props }) => {
    const {
        field: { onChange, value, ref },
        fieldState: { error },
    } = useController({ name });

    return (
        <Select
            label={<FormattedMessage id={'equipmentType'} />}
            value={value === null ? '' : value}
            onChange={(e) => onChange(e.target.value)}
            style={{ width: '100%' }}
            {...props}
        >
            {options?.length > 0 &&
                options.map(([key, value]) => (
                    <MenuItem key={key} value={key}>
                        <FormattedMessage id={value.label} />
                    </MenuItem>
                ))}
        </Select>
    );
};

export default SelectInput;
