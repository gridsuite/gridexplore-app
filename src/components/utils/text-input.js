/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { TextField } from '@mui/material';
import React from 'react';
import { useController } from 'react-hook-form';
import makeStyles from '@mui/styles/makeStyles';
import { genHelperError } from './dialog-utils';

const useStyles = makeStyles((theme) => ({
    helperText: {
        margin: 0,
        marginTop: 4,
    },
}));

const TextInput = ({
    name,
    label,
    id,
    acceptValue = () => true, //used to check user entry before committing the input change, used mostly to prevent user from typing a character in number field
    ...props
}) => {
    const classes = useStyles();
    const {
        field: { onChange, value, ref },
        fieldState: { error },
    } = useController({ name });

    const handleValueChanged = (e) => {
        if (acceptValue(e.target.value)) {
            onChange(e.target.value);
        }
    };

    return (
        <TextField
            key={name}
            size="medium"
            fullWidth={true}
            label={label}
            value={value}
            onChange={handleValueChanged}
            FormHelperTextProps={{
                className: classes.helperText,
            }}
            inputRef={ref}
            {...genHelperError(error?.message)}
            {...props}
        />
    );
};

export default TextInput;
