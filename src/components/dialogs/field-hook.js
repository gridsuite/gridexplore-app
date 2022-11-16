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
import { elementExists, rootDirectoryExists } from '../../utils/rest-api';
import { CircularProgress, InputAdornment, TextField } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useDispatch, useSelector } from 'react-redux';
import { UploadCase } from './upload-case';
import makeStyles from '@mui/styles/makeStyles';
import { removeSelectedFile } from '../../redux/actions';
import { ElementType } from '../../utils/elementType';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';

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

    const classes = useStyles();

    const handleChangeValue = useCallback((event) => {
        setValue(event.target.value);
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

    return [value, field];
};

export const useFileValue = ({
    triggerReset,
    fileExceedsLimitMessage,
    isLoading,
}) => {
    const selectedFile = useSelector((state) => state.selectedFile);
    const intl = useIntl();
    const dispatch = useDispatch();
    const [isFileOk, setIsFileOk] = useState(false);
    const [fileError, setFileError] = useState();

    const field = <UploadCase isLoading={isLoading} />;
    useEffect(() => {
        dispatch(removeSelectedFile());
    }, [dispatch, triggerReset]);

    useEffect(() => {
        const MAX_FILE_SIZE_IN_MO = 100;
        const MAX_FILE_SIZE_IN_BYTES = MAX_FILE_SIZE_IN_MO * 1024 * 1024;
        if (!selectedFile) {
            setFileError();
            setIsFileOk(false);
        } else if (selectedFile.size <= MAX_FILE_SIZE_IN_BYTES) {
            setFileError();
            setIsFileOk(true);
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
            setIsFileOk(false);
        }
    }, [selectedFile, fileExceedsLimitMessage, intl]);
    return [selectedFile, field, fileError, isFileOk];
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
    const timer = useRef();
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
        (name) => {
            if (name.replace(/ /g, '') === '') {
                setError(intl.formatMessage({ id: 'nameEmpty' }));
                setChecking(false);
            } else if (name === props.defaultValue) {
                setError(
                    alreadyExistingErrorMessage
                        ? alreadyExistingErrorMessage
                        : intl.formatMessage({
                              id: 'nameAlreadyUsed',
                          })
                );
                setChecking(false);
            } else {
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
                            }) + error
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
        if (
            !active ||
            ((name === '' || name === props.defaultValue) && !timer.current)
        ) {
            return; // initial render or hook in closed component to avoid sending unexpected request
        }
        clearTimeout(timer.current);
        setChecking(true);
        setError(undefined);
        timer.current = setTimeout(() => updateValidity(name), 700);
    }, [active, props.defaultValue, name, updateValidity]);

    useEffect(() => {
        setError(undefined);
        timer.current = undefined;
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
    ];
};

export const useEquipmentTableValues = ({
    id,
    tableHeadersIds,
    Row,
    inputForm,
    isGeneratorOrLoad = false,
    defaultTableValues,
    setCreateFilterErr,
    name,
}) => {
    const [values, setValues] = useState([]);

    const handleAddValue = useCallback(() => {
        setValues((oldValues) => [...oldValues, {}]);
    }, []);

    const checkValues = useCallback(() => {
        if (
            defaultTableValues !== undefined &&
            defaultTableValues.length !== 0
        ) {
            setValues([...defaultTableValues]);
        } else {
            setValues([]);
            handleAddValue();
        }
    }, [defaultTableValues, handleAddValue]);

    useEffect(() => {
        checkValues();
    }, [checkValues]);

    const handleDeleteItem = useCallback(
        (index) => {
            setValues((oldValues) => {
                let newValues = [...oldValues];
                newValues.splice(index, 1);
                return newValues.length === 0 ? [{}] : newValues;
            });
            setCreateFilterErr('');
        },
        [setCreateFilterErr]
    );

    const handleSetValue = useCallback(
        (index, newValue) => {
            setValues((oldValues) => {
                let newValues = [...oldValues];
                newValues[index] = newValue;
                return newValues;
            });
            setCreateFilterErr('');
        },
        [setCreateFilterErr]
    );

    const handleChangeOrder = useCallback(
        (index, direction) => {
            const res = [...values];
            const [item] = res.splice(index, 1);
            res.splice(index + direction, 0, item);
            setValues(res);
        },
        [values]
    );

    const commit = useCallback(
        ({ source, destination }) => {
            if (destination === null || source.index === destination.index)
                return;
            const res = [...values];
            const [item] = res.splice(source.index, 1);
            res.splice(
                destination ? destination.index : values.length,
                0,
                item
            );
            setValues(res);
        },
        [values]
    );

    const field = useMemo(() => {
        return (
            <Box sx={{ flexGrow: 1 }}>
                <DragDropContext onDragEnd={commit}>
                    <Droppable droppableId={id + name} key={id + name}>
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                key={id + name}
                            >
                                <Grid
                                    container
                                    key={name + 'container'}
                                    spacing={isGeneratorOrLoad ? 2 : 0}
                                >
                                    <Grid item xs={1} />
                                    {tableHeadersIds.map((value, index) => (
                                        <Grid
                                            xs={
                                                isGeneratorOrLoad
                                                    ? value === 'ID'
                                                        ? 6
                                                        : 3
                                                    : 9
                                            }
                                            item
                                            key={index + name + value}
                                            style={{
                                                width: '100%',
                                                borderBottom: '3px solid grey',
                                            }}
                                        >
                                            <span key={'header' + name + index}>
                                                <FormattedMessage id={value} />
                                            </span>
                                        </Grid>
                                    ))}
                                    <Grid xs={3} item />
                                </Grid>
                                {values.map((value, index) => (
                                    <Row
                                        id={index + id}
                                        value={value}
                                        isLastValue={
                                            index === values.length - 1
                                        }
                                        index={index}
                                        isGeneratorOrLoad={isGeneratorOrLoad}
                                        handleAddValue={handleAddValue}
                                        handleSetValue={handleSetValue}
                                        handleChangeOrder={handleChangeOrder}
                                        handleDeleteItem={handleDeleteItem}
                                        key={name + index}
                                    />
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </Box>
        );
    }, [
        values,
        id,
        handleAddValue,
        handleDeleteItem,
        handleSetValue,
        handleChangeOrder,
        tableHeadersIds,
        commit,
        isGeneratorOrLoad,
        name,
    ]);

    return [values, field];
};
