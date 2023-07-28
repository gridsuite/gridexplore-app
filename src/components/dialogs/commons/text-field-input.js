import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { TextField } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { useCallback, useEffect, useState } from 'react';

const useStyles = makeStyles((theme) => ({
    helperText: {
        margin: 0,
        marginTop: 4,
    },
}));

const TextFieldInput = ({
    label,
    defaultValue = '',
    adornment,
    triggerReset,
    autoFocus = false,
    error,
    value,
    setValue,
    setHasChanged,
}) => {
    const classes = useStyles();

    const handleChangeValue = useCallback(
        (event) => {
            setValue(event.target.value);
            if (setHasChanged) {
                setHasChanged(true);
            }
        },
        [setHasChanged, setValue]
    );

    useEffect(
        () => setValue(defaultValue),
        [triggerReset, defaultValue, setValue]
    );

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

TextFieldInput.propTypes = {};

export default TextFieldInput;
