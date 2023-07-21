/*
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { elementExists, rootDirectoryExists } from '../../utils/rest-api';
import {
    Checkbox,
    CircularProgress,
    IconButton,
    InputAdornment,
    TextField,
    Tooltip,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useDispatch, useSelector } from 'react-redux';
import { UploadCase } from './upload-case';
import makeStyles from '@mui/styles/makeStyles';
import { removeSelectedFile } from '../../redux/actions';
import { ElementType } from '../../utils/elementType';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import DeleteIcon from '@mui/icons-material/Delete';
import { ArrowCircleDown, ArrowCircleUp, Upload } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/ControlPoint';
import CsvImportFilterCreationDialog from './csv-import-filter-creation-dialog';
import { useDebounce } from '@gridsuite/commons-ui';

const useStyles = makeStyles((theme) => ({
    helperText: {
        margin: 0,
        marginTop: 4,
    },
    dragIcon: {
        padding: theme.spacing(0),
        border: theme.spacing(1),
        borderRadius: theme.spacing(0),
        zIndex: 90,
    },
    iconColor: {
        color: theme.palette.primary.main,
    },
}));

export const useTextValue = ({
    label,
    id = label,
    defaultValue = '',
    adornment,
    triggerReset,
    ...formProps
}) => {
    const [value, setValue] = useState(defaultValue);
    const [hasChanged, setHasChanged] = useState(false);

    const classes = useStyles();

    const handleChangeValue = useCallback((event) => {
        setValue(event.target.value);
        setHasChanged(true);
    }, []);

    const field = useMemo(() => {
        return (
            <TextField
                key={id}
                margin="dense"
                id={id}
                label={id && <FormattedMessage id={label} />}
                value={value}
                style={{ width: '100%' }}
                onChange={handleChangeValue}
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
    ]);

    useEffect(() => setValue(defaultValue), [triggerReset, defaultValue]);

    return [value, field, setValue, hasChanged];
};

export const useFileValue = ({ fileExceedsLimitMessage, isLoading }) => {
    const selectedFile = useSelector((state) => state.selectedFile);
    const intl = useIntl();
    const dispatch = useDispatch();
    const [fileOk, setFileOk] = useState(false);
    const [fileError, setFileError] = useState();

    const field = <UploadCase isLoading={isLoading} />;

    const resetSelectedFile = useCallback(
        () => dispatch(removeSelectedFile()),
        [dispatch]
    );

    useEffect(() => {
        const MAX_FILE_SIZE_IN_MO = 100;
        const MAX_FILE_SIZE_IN_BYTES = MAX_FILE_SIZE_IN_MO * 1024 * 1024;
        if (!selectedFile) {
            setFileError();
            setFileOk(false);
        } else if (selectedFile.size <= MAX_FILE_SIZE_IN_BYTES) {
            setFileError();
            setFileOk(true);
        } else {
            setFileError(
                fileExceedsLimitMessage
                    ? fileExceedsLimitMessage
                    : intl.formatMessage(
                          {
                              id: 'uploadFileExceedingLimitSizeErrorMsg',
                          },
                          {
                              maxSize: MAX_FILE_SIZE_IN_MO,
                              br: <br />,
                          }
                      )
            );
            setFileOk(false);
        }
    }, [selectedFile, fileExceedsLimitMessage, intl]);
    return [
        selectedFile,
        field,
        fileError,
        fileOk,
        resetSelectedFile,
        setFileOk,
    ];
};

const makeAdornmentEndIcon = (content) => {
    return {
        endAdornment: <InputAdornment position="end">{content}</InputAdornment>,
    };
};
export const useNameField = ({
    parentDirectoryId,
    elementType,
    active,
    triggerReset,
    alreadyExistingErrorMessage,
    ...props
}) => {
    const [error, setError] = useState();
    const intl = useIntl();
    const [checking, setChecking] = useState(undefined);
    const [adornment, setAdornment] = useState();

    // if element is a root directory, we need to make a specific api rest call (elementType is directory, and no parent element)
    const doesElementExist = useCallback(
        (name) =>
            elementType === ElementType.DIRECTORY && !parentDirectoryId
                ? rootDirectoryExists(name)
                : elementExists(parentDirectoryId, name, elementType),
        [elementType, parentDirectoryId]
    );

    const updateValidity = useCallback(
        (name, touched) => {
            const nameFormatted = name.replace(/ /g, '');
            if (nameFormatted === '' && touched) {
                setError(intl.formatMessage({ id: 'nameEmpty' }));
                setChecking(false);
                return;
            }
            if (nameFormatted === '' && !touched) {
                setChecking(undefined);
                return;
            }

            if (nameFormatted !== '' && name === props.defaultValue) {
                setError(
                    alreadyExistingErrorMessage
                        ? alreadyExistingErrorMessage
                        : intl.formatMessage({
                              id: 'nameAlreadyUsed',
                          })
                );
                setChecking(false);
            }
            if (nameFormatted !== '') {
                //If the name is not only white spaces and not defaultValue
                doesElementExist(name)
                    .then((data) => {
                        setError(
                            data
                                ? alreadyExistingErrorMessage
                                    ? alreadyExistingErrorMessage
                                    : intl.formatMessage({
                                          id: 'nameAlreadyUsed',
                                      })
                                : ''
                        );
                    })
                    .catch((error) => {
                        setError(
                            intl.formatMessage({
                                id: 'nameValidityCheckErrorMsg',
                            }) + error.message
                        );
                    })
                    .finally(() => {
                        setChecking(false);
                    });
            }
        },
        [
            props.defaultValue,
            alreadyExistingErrorMessage,
            intl,
            doesElementExist,
        ]
    );

    const debouncedUpdateValidity = useDebounce(updateValidity, 700);

    useEffect(() => {
        if (checking === undefined || error) {
            setAdornment(undefined);
            return;
        }
        if (checking) {
            setAdornment(
                makeAdornmentEndIcon(<CircularProgress size="1rem" />)
            );
        } else {
            setAdornment(
                makeAdornmentEndIcon(<CheckIcon style={{ color: 'green' }} />)
            );
        }
    }, [checking, error]);

    const [name, field, setName, touched] = useTextValue({
        ...props,
        triggerReset,
        error: !!error,
        adornment: adornment,
    });

    useEffect(() => {
        if (!active || name === '' || name === props.defaultValue) {
            return; // initial render or hook in closed component to avoid sending unexpected request
        }
        setChecking(true);
        setError(undefined);
        debouncedUpdateValidity(name, touched);
    }, [active, props.defaultValue, name, debouncedUpdateValidity, touched]);

    useEffect(() => {
        setError(undefined);
        setChecking(undefined);
        setAdornment(undefined);
    }, [triggerReset]);
    return [
        name,
        field,
        error,
        name !== props.defaultValue &&
            name.replace(/ /g, '') !== '' &&
            !error &&
            !checking,
        setName,
        touched,
    ];
};

export const usePrefillNameField = ({
    nameRef,
    selectedFile,
    setValue,
    selectedFileOk,
    creationError,
    fileCheckedCase,
    touched,
}) => {
    useEffect(() => {
        if (setValue) {
            //here selectedFile is a file the user choosed through a picker
            if (
                selectedFile?.name &&
                !creationError &&
                selectedFileOk &&
                fileCheckedCase &&
                !touched
            ) {
                setValue(
                    selectedFile.name.substr(0, selectedFile.name.indexOf('.'))
                );
            }
            //here selectedFile is an already stored case
            else if (selectedFile?.elementName && !creationError) {
                setValue(selectedFile.elementName);
            } else if (selectedFile == null && !touched) {
                setValue('');
            }
        }
    }, [
        nameRef,
        selectedFile,
        setValue,
        touched,
        selectedFileOk,
        fileCheckedCase,
        creationError,
    ]);
};