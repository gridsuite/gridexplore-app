/*
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { elementExists } from '../../utils/rest-api';
import { CircularProgress, InputAdornment, TextField } from '@material-ui/core';
import CheckIcon from '@material-ui/icons/Check';
import { useSelector } from 'react-redux';
import { UploadCase } from './upload-case';
import makeStyles from '@material-ui/core/styles/makeStyles';

const useStyles = makeStyles((theme) => ({
    helperText: {
        margin: 0,
        marginTop: 4,
    },
}));

export const useTextValue = ({
    label,
    id = label,
    defaultValue = '',
    adornment,
    autoFocus = false,
    triggerReset,
    ...formProps
}) => {
    const [value, setValue] = useState(defaultValue);

    const classes = useStyles();

    const handleChangeValue = useCallback((event) => {
        setValue(event.target.value);
    }, []);

    const field = useMemo(() => {
        return (
            <TextField
                key={id}
                size="small"
                margin="dense"
                id={id}
                label={<FormattedMessage id={label} />}
                value={value}
                style={{ width: '100%' }}
                onChange={handleChangeValue}
                autoFocus={autoFocus}
                FormHelperTextProps={{
                    className: classes.helperText,
                }}
                {...formProps}
                {...(adornment && { InputProps: adornment })}
            />
        );
    }, [
        id,
        label,
        value,
        handleChangeValue,
        classes.helperText,
        formProps,
        adornment,
        autoFocus,
    ]);

    useEffect(() => setValue(defaultValue), [triggerReset, defaultValue]);

    return [value, field];
};

export const useFileValue = () => {
    const selectedFile = useSelector((state) => state.selectedFile);

    const field = <UploadCase />;
    return [selectedFile, field];
};

const makeAdornmentEndIcon = (content) => {
    return {
        endAdornment: (
            <InputAdornment
                position="end"
                // hack to circumviate centering of adornment
                // when TextField has variant 'filled' with 'end' position
                // : classes.adornRightOther
                //className={classes.adornRightFilled}
            >
                {content}
            </InputAdornment>
        ),
    };
};
export const useNameField = ({
    directoryId,
    elementType,
    triggerReset,
    ...props
}) => {
    const [error, setError] = useState();
    const timer = useRef();
    const intl = useIntl();
    const [checking, setChecking] = useState(undefined);
    const [adornment, setAdornment] = useState();

    const updateValidity = useCallback(
        (name) => {
            if (name.replace(/ /g, '') !== '') {
                //If the name is not only white spaces
                elementExists(directoryId, name, elementType)
                    .then((data) => {
                        setError(
                            data
                                ? intl.formatMessage({
                                      id: 'studyNameAlreadyUsed',
                                  })
                                : ''
                        );
                    })
                    .catch((error) => {
                        setError(
                            intl.formatMessage({
                                id: 'nameValidityCheckErrorMsg',
                            }) + error
                        );
                    })
                    .finally(() => {
                        setChecking(false);
                    });
            } else {
                setError(intl.formatMessage({ id: 'nameEmpty' }));
                setChecking(false);
            }
        },
        [directoryId, elementType, intl]
    );

    useEffect(() => {
        if (checking === undefined) return;
        if (checking)
            setAdornment(
                makeAdornmentEndIcon(<CircularProgress size="1rem" />)
            );
        else if (error) setAdornment(undefined);
        else
            setAdornment(
                makeAdornmentEndIcon(<CheckIcon style={{ color: 'green' }} />)
            );
    }, [checking, error]);

    const [name, field] = useTextValue({
        ...props,
        triggerReset,
        error: !!error,
        adornment: adornment,
    });

    useEffect(() => {
        if (name === '' && !timer.current) return; // initial render
        clearTimeout(timer.current);
        setChecking(true);
        setError(undefined);
        timer.current = setTimeout(() => updateValidity(name), 700);
    }, [name, updateValidity]);

    useEffect(() => {
        setError(undefined);
        timer.current = undefined;
        setChecking(undefined);
        setAdornment(undefined);
    }, [triggerReset]);
    return [name, field, error, !error && !checking];
};
