import { useController } from 'react-hook-form';
import {FormControl, FormHelperText, InputLabel, MenuItem, Select} from '@mui/material';
import {FormattedMessage, useIntl} from 'react-intl';
import React from 'react';
import FormControlLabel from "@mui/material/FormControlLabel";

const SelectInput = ({ name, options, labelId = '', ...props }) => {
    const intl = useIntl()
    const {
        field: { onChange, value, ref },
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
                    <FormHelperText error={!!error?.message} >
                        <FormattedMessage id={error?.message}/>
                    </FormHelperText>
                )}
            </FormControl>
        </>
    );
};

export default SelectInput;
