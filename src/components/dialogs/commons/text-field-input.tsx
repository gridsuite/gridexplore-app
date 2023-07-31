/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FormattedMessage } from 'react-intl';
import { TextField } from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { useCallback, useEffect } from 'react';

const useStyles = makeStyles(() => ({
    helperText: {
        margin: 0,
        marginTop: 4,
    },
}));

interface TextFieldInputProps {
    label: string;
    defaultValue?: string;
    adornment?: React.ReactNode;
    triggerReset?: boolean;
    autoFocus?: boolean;
    error?: boolean;
    value: string;
    setValue: (value: string) => void;
    setValueHasChanged?: (value: boolean) => void;
}

const TextFieldInput: React.FC<TextFieldInputProps> = ({
    label,
    defaultValue = '',
    adornment,
    triggerReset,
    autoFocus = false,
    error,
    value,
    setValue,
    setValueHasChanged,
}) => {
    const classes = useStyles();

    const handleChangeValue = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = event.target.value;
            setValue(newValue);

            if (setValueHasChanged && newValue) {
                setValueHasChanged(true);
            }
        },
        [setValue, setValueHasChanged]
    );

    useEffect(() => {
        if (triggerReset) {
            setValue(defaultValue);
        }
    }, [triggerReset, defaultValue, setValue]);

    return (
        <TextField
            key={label}
            margin="dense"
            id={label}
            label={label && <FormattedMessage id={label} />}
            value={value}
            onChange={handleChangeValue}
            FormHelperTextProps={{
                className: classes.helperText,
            }}
            style={{ width: '90%' }}
            error={error}
            autoFocus={autoFocus}
            {...(adornment && { InputProps: { endAdornment: adornment } })}
        />
    );
};

export default TextFieldInput;
