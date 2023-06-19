/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {Autocomplete, TextField} from '@mui/material';
import React, {useEffect} from 'react';
import {FieldLabel, genHelperError, genHelperPreviousValue,} from './inputs/hooks-helpers';
import PropTypes from 'prop-types';
import {useController, useFormContext} from 'react-hook-form';
import {func_identity, isFieldRequired} from "./dialog-utils";
import makeStyles from "@mui/styles/makeStyles";

/**
 * Autocomplete input
 * @param label field label id, will be translated
 * @param required required state to append '(optional)' to the end of the label
 * @param options select options, each option needs a label that will be translated and an id
 * @param errorMessage errorMessage that will be displayed if not empty
 * @param onChange callback that need to be called on input value change
 * @param value input value
 * @returns autocomplete field containing the options values
 */

const useStyles = makeStyles((theme) => ({
    helperText: {
        margin: 0,
            marginTop: 4,
    },
}))
const AutocompleteInput = ({
    name,
    label,
    outputTransform = func_identity, //transform materialUi input value before sending it to react hook form, mostly used to deal with select fields that need to return a string
    inputTransform = func_identity, //transform react hook form value before sending it to materialUi input, mostly used to deal with select fields that need to return a string
    options,
    readOnly = false,
    previousValue,
    formProps,
    allowNewValue,
    onChangeCallback, // method called when input value is changing
    ...props
}) => {
    const { validationSchema, getValues, removeOptional } = useFormContext();
    const {
        field: { onChange, value, ref },
        fieldState: { error },
    } = useController({ name });
    const classes = useStyles();

    const handleChange = (value) => {
        console.log('handleChange 1 : ', value);
        onChangeCallback && onChangeCallback();
        //if free solo not enabled or if value is not of string type, we call onChange right away
        if (!allowNewValue || typeof value !== 'string') {
            console.log('handleChange 2', outputTransform(value));
            onChange(value);
            return;
        }

        //otherwise, we check if user input matches with one of the options
        console.log('handleChange 3');
        const matchingOption = options.find((option) => option.id === value);
        //if it does, we send the matching option to react hook form
        if (matchingOption) {
            console.log('handleChange 4 ');
            onChange(outputTransform(matchingOption));
            return;
        }

        //otherwise, we send the user input
        onChange(outputTransform(value));
    };

    useEffect(() => {
        console.log('new value : ', value);
    }, [value])
    return (
        <Autocomplete
            size={'medium'}
            value={inputTransform(value)}
            onChange={(_, data) => handleChange(data)}
            {...(allowNewValue && {
                freeSolo: true,
                autoComplete: true,
                blurOnSelect: true,
                autoSelect: false,
                onInputChange: (_, data) => {
                    handleChange(data);
                },
            })}
            options={options}
            renderInput={({ inputProps, ...rest }) => (
                <TextField
                    label={label ? FieldLabel({
                        label: label,
                        optional: false,
                    }) : ''}
                    FormHelperTextProps={{
                        className: classes.helperText,
                    }}
                    inputRef={ref}
                    inputProps={{ ...inputProps, readOnly: readOnly }}
                    {...genHelperPreviousValue(previousValue)}
                    {...genHelperError(error?.message)}
                    {...formProps}
                    {...rest}
                />
            )}
            {...props}
        />
    );
};

AutocompleteInput.propTypes = {
    name: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    isRequired: PropTypes.bool,
    options: PropTypes.array.isRequired,
    outputTransform: PropTypes.func,
    inputTransform: PropTypes.func,
    readOnly: PropTypes.bool,
    previousValue: PropTypes.any,
    allowNewValue: PropTypes.bool,
    formProps: PropTypes.object,
};

export default AutocompleteInput;
