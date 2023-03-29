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
        setFileOk,
        resetSelectedFile,
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
        (name, touched) => {
            const nameFormated = name.replace(/ /g, '');
            if (nameFormated === '' && touched) {
                setError(intl.formatMessage({ id: 'nameEmpty' }));
                setChecking(false);
                return;
            }
            if (nameFormated === '' && !touched) {
                setChecking(undefined);
                return;
            }

            if (nameFormated !== '' && name === props.defaultValue) {
                setError(
                    alreadyExistingErrorMessage
                        ? alreadyExistingErrorMessage
                        : intl.formatMessage({
                              id: 'nameAlreadyUsed',
                          })
                );
                setChecking(false);
            }
            if (nameFormated !== '') {
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
        if (
            !active ||
            ((name === '' || name === props.defaultValue) && !timer.current)
        ) {
            return; // initial render or hook in closed component to avoid sending unexpected request
        }
        clearTimeout(timer.current);
        setChecking(true);
        setError(undefined);
        timer.current = setTimeout(() => updateValidity(name, touched), 700);
    }, [active, props.defaultValue, name, updateValidity, touched]);

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

function generateNamingArray(
    defaultValues,
    isGeneratorOrLoad,
    minNumberOfEquipments,
    formType // TODO This whole function should be refactored, but won't be now because of time constraints
) {
    let values = defaultValues ?? [];
    let n = values
        ? minNumberOfEquipments - values.length
        : minNumberOfEquipments;
    for (var i = 0; i < n; i++) {
        // TODO Refactor : we should not have hardcoded value parameters like this in this function.
        if (formType === ElementType.FILTER) {
            if (isGeneratorOrLoad) {
                values.push({ equipmentID: '', distributionKey: undefined });
            } else {
                values.push({ equipmentID: '' });
            }
        } else if (formType === ElementType.CONTINGENCY_LIST) {
            values.push({ contingencyName: '', equipmentIDs: [] });
        }
    }
    return values;
}

export const useEquipmentTableValues = ({
    id,
    tableHeadersIds,
    Row,
    isGeneratorOrLoad = false, // TODO This function should be refactored to remove the business logic. The refactor won't be done now because of time constraints.
    defaultTableValues,
    setCreateFilterErr,
    name,
    equipmentType,
    setIsEdited,
    minNumberOfEquipments,
    formType = ElementType.FILTER, // TODO This is temporary : should be refactored to remove the business logic.
}) => {
    const classes = useStyles();
    const [values, setValues] = useState(defaultTableValues);
    const [cleanValues, setCleanValues] = useState([]); // Stores the clean state of each row if needed
    const intl = useIntl();
    const [isDragged, setIsDragged] = useState(false);
    const [isClean, setIsClean] = useState(true); // true if there is nothing dirty (===false) in cleanValues.

    const handleAddValue = useCallback(() => {
        // TODO This is temporary : should be refactored to remove the business logic.
        if (formType === ElementType.CONTINGENCY_LIST) {
            setValues((oldValues) => [
                ...oldValues,
                { contingencyName: '', equipmentIDs: [] },
            ]);
        } else {
            setValues((oldValues) => [...oldValues, {}]);
        }
    }, [formType]);

    const checkValues = useCallback(() => {
        if (defaultTableValues !== undefined) {
            setValues(
                generateNamingArray(
                    [...defaultTableValues],
                    isGeneratorOrLoad,
                    minNumberOfEquipments,
                    formType
                )
            );
        }
    }, [
        defaultTableValues,
        isGeneratorOrLoad,
        minNumberOfEquipments,
        formType,
    ]);

    useEffect(() => {
        checkValues();
    }, [checkValues]);

    // Updates the isClean boolean, so that it is true if there is nothing dirty (===false) in cleanValues.
    useEffect(() => {
        // The cleanValues array can contain undefined values, so we strictly compare them to "false".
        if (isClean && cleanValues.some((n) => n === false)) {
            setIsClean(false);
        } else if (!isClean && !cleanValues.some((n) => n === false)) {
            setIsClean(true);
        }
    }, [isClean, cleanValues]);

    const [openCSVImportDialog, setOpenCSVImportDialog] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const handleDeleteItem = useCallback(() => {
        setValues((oldValues) => {
            if (selectedIds.size === oldValues.length) {
                setSelectedIds(new Set());
                return generateNamingArray(
                    [],
                    isGeneratorOrLoad,
                    minNumberOfEquipments,
                    formType
                );
            }
            const newValues = oldValues.filter(
                (val) => !selectedIds.has(oldValues.indexOf(val))
            );
            return generateNamingArray(
                newValues,
                isGeneratorOrLoad,
                minNumberOfEquipments,
                formType
            );
        });
        setSelectedIds(new Set());
        setIsEdited(true);
        setCreateFilterErr('');
    }, [
        selectedIds,
        setCreateFilterErr,
        setIsEdited,
        isGeneratorOrLoad,
        minNumberOfEquipments,
        formType,
    ]);

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

    const handleSetClean = useCallback(
        (index, cleanValue) => {
            setCleanValues((oldValues) => {
                let newValues = [...oldValues];
                newValues[index] = cleanValue;
                return newValues;
            });
        },
        [setCleanValues]
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

    const handleOnDragEnd = useCallback(
        ({ source, destination }) => {
            if (destination === null || source.index === destination.index)
                return;
            setIsDragged(true);
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

            // When a row is dragged, the non-clean values are lost, so we clean the cleanValues array.
            setCleanValues([]);
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
                let newValues = [...values];
                let objects;

                // TODO This is temporary : should be refactored to remove the business logic.
                if (formType === ElementType.FILTER) {
                    if (!keepTableValues) {
                        newValues.splice(0);
                    } else {
                        // TODO Refactor : we should not have hardcoded value parameters like this in this function.
                        newValues = newValues.filter(
                            (v) => v?.equipmentID?.trim().length > 0
                        );
                    }
                    objects = Object.keys(csvData).map(function (key) {
                        return {
                            equipmentID: csvData[key][0]?.trim(),
                            distributionKey:
                                csvData[key][1]?.trim() || undefined,
                        };
                    });
                } else if (formType === ElementType.CONTINGENCY_LIST) {
                    if (!keepTableValues) {
                        newValues.splice(0);
                    } else {
                        // TODO Refactor : we should not have hardcoded value parameters like this in this function.
                        newValues = newValues.filter(
                            (v) =>
                                v?.contingencyName?.trim().length > 0 ||
                                v?.equipmentIDs?.length > 0
                        );
                    }
                    objects = Object.keys(csvData).map(function (key) {
                        return {
                            contingencyName: csvData[key][0]?.trim() || '',
                            equipmentIDs:
                                csvData[key][1]
                                    ?.split('|')
                                    .map((n) => n.trim())
                                    .filter((n) => n) || undefined,
                        };
                    });
                }

                newValues.push(...objects);
                setValues(
                    generateNamingArray(
                        newValues,
                        isGeneratorOrLoad,
                        minNumberOfEquipments,
                        formType
                    )
                );
                setIsEdited(true);
            }
        },
        [
            values,
            isGeneratorOrLoad,
            minNumberOfEquipments,
            setIsEdited,
            formType,
        ]
    );

    const field = useMemo(() => {
        return (
            values && (
                <>
                    <Box sx={{ flexGrow: 1 }}>
                        <DragDropContext onDragEnd={handleOnDragEnd}>
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
                                        >
                                            <Grid item xs={0.6}></Grid>
                                            <Grid item xs={1}>
                                                <Checkbox
                                                    onClick={(e) => {
                                                        toggleSelectAll();
                                                        e.stopPropagation();
                                                    }}
                                                    checked={
                                                        selectedIds?.size > 0
                                                    }
                                                    indeterminate={
                                                        selectedIds.size !==
                                                            0 &&
                                                        selectedIds.size !==
                                                            values.length
                                                    }
                                                ></Checkbox>
                                            </Grid>
                                            {tableHeadersIds.map(
                                                (value, index) => (
                                                    <Grid
                                                        container
                                                        direction="row"
                                                        justifyContent="flex-start"
                                                        alignItems="flex-end"
                                                        xs={
                                                            isGeneratorOrLoad ||
                                                            formType ===
                                                                ElementType.CONTINGENCY_LIST
                                                                ? value ===
                                                                      'ID' ||
                                                                  value ===
                                                                      'equipments' // TODO This should be refactored, we should not have hardcoded value parameters like this in this function.
                                                                    ? 6
                                                                    : 3
                                                                : 9
                                                        }
                                                        item
                                                        key={
                                                            index + name + value
                                                        }
                                                        style={{
                                                            width: '100%',
                                                            borderBottom:
                                                                '3px solid grey',
                                                            marginBottom: 15,
                                                            paddingTop: 5,
                                                        }}
                                                    >
                                                        <span
                                                            key={
                                                                'header' +
                                                                name +
                                                                index
                                                            }
                                                        >
                                                            <FormattedMessage
                                                                id={value}
                                                            />
                                                        </span>
                                                    </Grid>
                                                )
                                            )}
                                            <Grid xs={3} item />
                                        </Grid>
                                        <Grid
                                            overflow={'auto'}
                                            style={{ maxHeight: '45vh' }}
                                        >
                                            {values.map((value, index) => (
                                                <Row
                                                    id={index + id}
                                                    value={value}
                                                    isLastValue={
                                                        index ===
                                                        values.length - 1
                                                    }
                                                    index={index}
                                                    isGeneratorOrLoad={
                                                        isGeneratorOrLoad
                                                    }
                                                    handleSetValue={
                                                        handleSetValue
                                                    }
                                                    selectedIds={selectedIds}
                                                    handleSelection={
                                                        toggleSelection
                                                    }
                                                    key={name + index}
                                                    tableLength={values.length}
                                                    handleSetClean={
                                                        handleSetClean
                                                    }
                                                />
                                            ))}
                                        </Grid>
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </Box>
                    <Grid container>
                        <Grid item xs={1}></Grid>
                        <Grid item xs justifyContent={'flex-end'}>
                            <IconButton
                                className={classes.iconColor}
                                onClick={() => setOpenCSVImportDialog(true)}
                            >
                                <Tooltip
                                    title={intl.formatMessage({
                                        id: 'ImportCSV',
                                    })}
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
                                    selectedIds?.size === 0 ||
                                    selectedIds?.has(0)
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
                        <CsvImportFilterCreationDialog
                            open={openCSVImportDialog}
                            title={intl.formatMessage({ id: 'chooseCSVFile' })}
                            onClose={() => setOpenCSVImportDialog(false)}
                            equipmentType={equipmentType}
                            handleValidateCSV={(csvData, keepTableValues) =>
                                updateTableValues(csvData, keepTableValues)
                            }
                            tableValues={values}
                            formType={formType}
                        />
                    </Grid>
                </>
            )
        );
    }, [
        handleOnDragEnd,
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
        handleSetClean,
        updateTableValues,
        formType,
    ]);

    return [values, field, isDragged, isClean];
};
