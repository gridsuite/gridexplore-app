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

    return [value, field, setValue];
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

    const [name, field, setName] = useTextValue({
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
        setName,
    ];
};

export const usePrefillNameField = ({ nameRef, selectedFile, setValue }) => {
    useEffect(() => {
        if (setValue) {
            if (
                nameRef !== undefined &&
                nameRef.current.trim().length === 0 &&
                selectedFile != null
            ) {
                setValue(
                    selectedFile.name.substr(0, selectedFile.name.indexOf('.'))
                );
            } else if (selectedFile == null) {
                setValue('');
            }
        }
    }, [nameRef, selectedFile, setValue]);
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
    equipmentType,
    setIsEdited,
}) => {
    const classes = useStyles();
    const [values, setValues] = useState([]);
    const intl = useIntl();
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
    const [openCSVImportDialog, setOpenCSVImportDialog] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const handleDeleteItem = useCallback(() => {
        setValues((oldValues) => {
            let newValues = [...oldValues];
            if (selectedIds.size === newValues.length) {
                setSelectedIds(new Set());
                return [{}];
            }
            selectedIds.forEach((index) => {
                newValues.splice(index, 1);
            });
            setSelectedIds(new Set());
            setIsEdited(true);
            return newValues.length === 0 ? [{}] : newValues;
        });
        setCreateFilterErr('');
    }, [selectedIds, setCreateFilterErr, setIsEdited]);

    const handleSetValue = useCallback(
        (index, newValue) => {
            setValues((oldValues) => {
                let newValues = [...oldValues];
                newValues[index] = newValue;
                return newValues;
            });
            setCreateFilterErr('');
            setIsEdited(true);
        },
        [setCreateFilterErr, setIsEdited]
    );

    const handleChangeOrder = useCallback(
        (direction) => {
            const res = [...values];
            const result = [...selectedIds];
            result.sort();

            let isContiguous = true;
            for (let i = 0; i < result.length - 1; i++) {
                if (result[i + 1] - result[i] !== 1) {
                    isContiguous = false;
                    break;
                }
            }

            if (isContiguous) {
                if (direction === -1) {
                    const [item] = res.splice(result[0] - 1, 1);
                    res.splice(result[result.length - 1], 0, item);
                } else {
                    const [item] = res.splice(result[result.length - 1] + 1, 1);
                    res.splice(result[0], 0, item);
                }
            } else {
                selectedIds.forEach((elem) => {
                    const [item] = res.splice(elem, 1);
                    res.splice(elem + direction, 0, item);
                });
            }
            const array = Array.from(selectedIds)
                .sort()
                .map((val) => val + direction);
            setSelectedIds(new Set(array));
            setIsEdited(true);
            setValues(res);
        },
        [selectedIds, setIsEdited, values]
    );

    const commit = useCallback(
        ({ source, destination }) => {
            if (destination === null || source.index === destination.index)
                return;
            const res = [...values];
            res.forEach((e) => {
                e['isChecked'] = false;
            });
            selectedIds.forEach((e) => {
                res[e].isChecked = true;
            });
            setSelectedIds(new Set());

            const [item] = res.splice(source.index, 1);
            res.splice(
                destination ? destination.index : values.length,
                0,
                item
            );
            setValues(res);

            const array = res
                .filter((val) => val.isChecked)
                .map((val) => {
                    return res.indexOf(val);
                });
            setSelectedIds(new Set(array));
        },
        [selectedIds, values]
    );

    const toggleSelection = useCallback(
        (val) => {
            let newSelection = new Set(selectedIds);
            if (!newSelection?.has(val)) {
                newSelection.add(val);
            } else {
                newSelection.delete(val);
            }
            setSelectedIds(newSelection);
        },
        [selectedIds]
    );

    const toggleSelectAll = useCallback(() => {
        if (selectedIds.size === 0) {
            selectAllItems();
        } else if (selectedIds.size === values.length) {
            setSelectedIds(new Set());
        } else {
            selectAllItems();
        }

        function selectAllItems() {
            const array = new Set(values.map((v, i) => i));
            setSelectedIds(new Set(array));
        }
    }, [selectedIds.size, values]);

    const updateTableValues = useCallback(
        (csvData, keepTableValues) => {
            if (csvData) {
                if (!keepTableValues) {
                    values.splice(0);
                }
                let objects = Object.keys(csvData).map(function (key) {
                    return {
                        equipmentID: csvData[key][0]?.trim(),
                        distributionKey: csvData[key][1]?.trim() || undefined,
                    };
                });
                values.push(...objects);
            }
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
                                    <Grid item xs={1}></Grid>
                                    <Grid item xs={1}>
                                        <Checkbox
                                            onClick={(e) => {
                                                toggleSelectAll();
                                                e.stopPropagation();
                                            }}
                                            checked={selectedIds?.size > 0}
                                            indeterminate={
                                                selectedIds.size !== 0 &&
                                                selectedIds.size !==
                                                    values.length
                                            }
                                        ></Checkbox>
                                    </Grid>
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
                                        handleSetValue={handleSetValue}
                                        selectedIds={selectedIds}
                                        handleSelection={toggleSelection}
                                        key={name + index}
                                    />
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
                <Grid container>
                    <Grid item xs justifyContent={'flex-end'}>
                        <IconButton
                            className={classes.iconColor}
                            onClick={() => setOpenCSVImportDialog(true)}
                        >
                            <Tooltip
                                title={intl.formatMessage({ id: 'ImportCSV' })}
                                placement="bottom"
                            >
                                <Upload />
                            </Tooltip>
                        </IconButton>
                    </Grid>
                    <Grid item justifyContent={'flex-end'}>
                        <IconButton
                            className={classes.iconColor}
                            onClick={() => handleAddValue()}
                        >
                            <AddIcon />
                        </IconButton>

                        <IconButton
                            className={classes.iconColor}
                            onClick={() => handleDeleteItem()}
                            disabled={selectedIds.size === 0}
                        >
                            <DeleteIcon />
                        </IconButton>
                        <IconButton
                            key={id + name + 'upButton'}
                            disabled={
                                selectedIds?.size === 0 || selectedIds?.has(0)
                            }
                            onClick={() => {
                                handleChangeOrder(-1);
                            }}
                            className={classes.iconColor}
                        >
                            <ArrowCircleUp />
                        </IconButton>
                        <IconButton
                            key={id + name + 'downButton'}
                            disabled={
                                selectedIds?.size === 0 ||
                                selectedIds.has(values.length - 1)
                            }
                            onClick={() => {
                                handleChangeOrder(1);
                            }}
                            className={classes.iconColor}
                        >
                            <ArrowCircleDown />
                        </IconButton>
                    </Grid>
                </Grid>
                <CsvImportFilterCreationDialog
                    open={openCSVImportDialog}
                    title={intl.formatMessage({ id: 'chooseCSVFile' })}
                    onClose={() => setOpenCSVImportDialog(false)}
                    equipmentType={equipmentType}
                    handleValidateCSV={(csvData, keepTableValues) =>
                        updateTableValues(csvData, keepTableValues)
                    }
                    tableValues={values}
                />
            </Box>
        );
    }, [
        commit,
        id,
        name,
        intl,
        classes,
        selectedIds,
        values,
        openCSVImportDialog,
        equipmentType,
        isGeneratorOrLoad,
        tableHeadersIds,
        toggleSelectAll,
        handleSetValue,
        toggleSelection,
        handleAddValue,
        handleDeleteItem,
        handleChangeOrder,
        updateTableValues,
    ]);

    return [values, field];
};
