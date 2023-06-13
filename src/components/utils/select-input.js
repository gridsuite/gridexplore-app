import { useController } from 'react-hook-form';
import {
    FormControl,
    FormHelperText,
    InputLabel,
    MenuItem,
    Select,
} from '@mui/material';
import { FormattedMessage } from 'react-intl';
import React from 'react';

const SelectInput = ({ name, options, labelId = '', ...props }) => {
    const {
        field: { onChange, value },
        fieldState: { error },
    } = useController({ name });

    return (
        <>
            <FormControl fullWidth margin="dense">
                <InputLabel>
                    <FormattedMessage id={labelId} />
                </InputLabel>

                <Select
                    label={<FormattedMessage id={labelId} />}
                    value={value === null ? '' : value}
                    onChange={(e) => onChange(e.target.value)}
                    error={!!error?.message}
                >
                    {options?.length > 0 &&
                        options.map(([key, value]) => (
                            <MenuItem key={key} value={key}>
                                <FormattedMessage id={value.label} />
                            </MenuItem>
                        ))}
                </Select>
                {error?.message && (
                    <FormHelperText error={!!error?.message}>
                        <FormattedMessage id={error?.message} />
                    </FormHelperText>
                )}
            </FormControl>
        </>
    );
};

export default SelectInput;
