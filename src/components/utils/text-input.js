/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { InputAdornment, TextField } from '@mui/material';
import React from 'react';
import { useController, useFormContext } from 'react-hook-form';
import makeStyles from '@mui/styles/makeStyles';
import { func_identity, isFieldRequired } from './dialog-utils';
import IconButton from '@mui/material/IconButton';
import {
    FieldLabel,
    genHelperError,
    genHelperPreviousValue,
} from './inputs/hooks-helpers';
import PropTypes from 'prop-types';
import TextFieldWithAdornment from './text-field-with-adornment';
import ClearIcon from '@mui/icons-material/Clear';

const useStyles = makeStyles((theme) => ({
    helperText: {
        margin: 0,
        marginTop: 4,
    },
}));

const TextInput = ({
    name,
    label,
    labelValues, // this prop is used to add a value to label. this value is displayed without being translated
    id,
    adornment,
    outputTransform = func_identity, //transform materialUi input value before sending it to react hook form, mostly used to deal with number fields
    inputTransform = func_identity, //transform react hook form value before sending it to materialUi input, mostly used to deal with number fields
    acceptValue = () => true, //used to check user entry before committing the input change, used mostly to prevent user from typing a character in number field
    formProps,
    previousValue,
    clearable,
    customAdornment,
    ...props
}) => {
    const { validationSchema, getValues, removeOptional } = useFormContext();
    const classes = useStyles();
    const {
        field: { onChange, value, ref },
        fieldState: { error },
    } = useController({ name });

    const Field = adornment ? TextFieldWithAdornment : TextField;

    const handleClearValue = () => {
        onChange(outputTransform(''));
    };

    const handleValueChanged = (e) => {
        if (acceptValue(e.target.value)) {
            onChange(outputTransform(e.target.value));
        }
    };

    const transformedValue = inputTransform(value);

    const fieldLabel = !label
        ? null
        : FieldLabel({
              label,
              values: labelValues,
              optional:
                  isFieldRequired(name, validationSchema, getValues()) &&
                  !formProps?.disabled &&
                  !removeOptional,
          });

    return (
        <Field
            key={id ? id : label}
            fullWidth
            id={id ? id : label}
            label={fieldLabel}
            {...(adornment && {
                adornmentPosition: adornment.position,
                adornmentText: adornment?.text,
            })}
            value={transformedValue}
            onChange={handleValueChanged}
            FormHelperTextProps={{
                className: classes.helperText,
            }}
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end">
                        {clearable &&
                            transformedValue !== undefined &&
                            transformedValue !== '' && (
                                <IconButton onClick={handleClearValue}>
                                    <ClearIcon />
                                </IconButton>
                            )}
                        {customAdornment && { ...customAdornment }}
                    </InputAdornment>
                ),
                ...props.inputProps,
            }}
            inputRef={ref}
            {...(clearable &&
                adornment && {
                    handleClearValue: handleClearValue,
                })}
            {...genHelperPreviousValue(previousValue, adornment)}
            {...genHelperError(error?.message)}
            {...formProps}
        />
    );
};

TextInput.propTypes = {
    label: PropTypes.string,
    labelValues: PropTypes.object,
    errorMessage: PropTypes.string,
    value: PropTypes.any,
    onChange: PropTypes.func,
    adornment: PropTypes.object,
    customAdornment: PropTypes.object,
    transformValue: PropTypes.func,
    acceptValue: PropTypes.func,
    formProps: PropTypes.object,
    previousValue: PropTypes.any,
    clearable: PropTypes.bool,
};

export default TextInput;
