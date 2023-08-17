/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import ClearIcon from '@mui/icons-material/Clear';
import { TextField } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';

const styles = {
    inputRight: {
        textAlign: 'end',
    },
    inputLeft: {
        textAlign: 'start',
    },
    adornRightFilled: {
        alignItems: 'start',
        marginBottom: '0.4em',
    },
    adornRightOther: {
        marginBottom: '0.3em',
    },
};

const TextFieldWithAdornment = (props) => {
    const {
        adornmentPosition,
        adornmentText,
        value,
        variant,
        handleClearValue,
        ...otherProps
    } = props;
    const [isFocused, setIsFocused] = useState(false);

    const getAdornmentStyle = useCallback((variant) => {
        if (variant === 'filled') {
            return styles.adornRightFilled;
        }
        if (variant === 'standard') {
            return styles.adornRightOther;
        }
        return null;
    }, []);

    const getClearAdornment = useCallback(
        (position) => {
            return (
                <InputAdornment position={position}>
                    <IconButton onClick={handleClearValue}>
                        <ClearIcon />
                    </IconButton>
                </InputAdornment>
            );
        },
        [handleClearValue]
    );

    const getTextAdornment = useCallback(
        (position) => {
            return (
                <InputAdornment
                    position={position}
                    sx={getAdornmentStyle(variant)}
                >
                    {adornmentText}
                </InputAdornment>
            );
        },
        [adornmentText, variant, getAdornmentStyle]
    );

    const withEndAdornmentText = useCallback(() => {
        return value !== '' || isFocused
            ? {
                  startAdornment:
                      value && handleClearValue
                          ? getClearAdornment('start')
                          : undefined,
                  endAdornment: getTextAdornment('end'),
                  sx: { input: styles.inputRight },
              }
            : {};
    }, [
        value,
        handleClearValue,
        getClearAdornment,
        isFocused,
        getTextAdornment,
    ]);

    const withStartAdornmentText = useCallback(() => {
        return value !== '' || isFocused
            ? {
                  startAdornment: getTextAdornment('start'),
                  endAdornment:
                      value && handleClearValue && getClearAdornment('end'),
                  sx: { input: styles.inputLeft },
              }
            : {};
    }, [
        value,
        handleClearValue,
        getClearAdornment,
        isFocused,
        getTextAdornment,
    ]);

    return (
        <TextField
            {...otherProps}
            variant={variant}
            value={value}
            InputProps={
                adornmentPosition === 'start'
                    ? withStartAdornmentText()
                    : withEndAdornmentText()
            }
            onFocus={(e) => setIsFocused(true)}
            onBlur={(e) => setIsFocused(false)}
        />
    );
};

TextFieldWithAdornment.propTypes = {
    adornmentPosition: PropTypes.string.isRequired,
    adornmentText: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default TextFieldWithAdornment;
