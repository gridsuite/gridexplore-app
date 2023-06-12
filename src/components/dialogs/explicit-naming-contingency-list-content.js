/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

import Grid from '@mui/material/Grid';
import { useEquipmentTableValues } from './field-hook';
import makeStyles from '@mui/styles/makeStyles';
import { FormattedMessage, useIntl } from 'react-intl';
import { getContingencyList } from '../../utils/rest-api';

import IconButton from '@mui/material/IconButton';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import { Draggable } from 'react-beautiful-dnd';
import PropTypes from 'prop-types';
import { Alert, Checkbox, Chip, Input, Tooltip } from '@mui/material';
import { ContingencyListType, ElementType } from '../../utils/elementType';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { getIdentifierContingencyListFromResponse } from './contingency-list-helper';

const useStyles = makeStyles((theme) => ({
    chip: {
        cursor: 'pointer',
        marginRight: theme.spacing(0.5),
    },
    tableRow: {
        width: '100%',
        height: '50%',
        paddingTop: theme.spacing(1),
    },
}));

export const ExplicitNamingFilterRow = ({
    id,
    index,
    value,
    handleSetValue,
    handleSelection,
    selectedIds,
    tableLength,
    handleSetClean,
}) => {
    const intl = useIntl();
    const classes = useStyles();
    const [unsavedAutoCompleteValue, setUnsavedAutoCompleteValue] =
        useState('');
    const [isClean, setIsClean] = useState(true);

    const handleAutoCompleteChange = useCallback(
        (newVal) => {
            const noBlankEntries = newVal
                .filter((e) => String(e).trim().length > 0)
                .map((e) => e.trim());
            const noBlankOrDuplicatesEntries = [...new Set(noBlankEntries)];
            handleSetValue(index, {
                contingencyName: value?.contingencyName,
                equipmentIDs: noBlankOrDuplicatesEntries,
            });
            handleSetClean(index, true);
            setIsClean(true);
        },
        [index, value, handleSetValue, handleSetClean]
    );

    const handleAutoCompleteInputChange = useCallback(
        (newVal) => {
            if (isClean && newVal.trim().length > 0) {
                handleSetClean(index, false);
                setIsClean(false);
            } else if (!isClean && newVal.trim().length === 0) {
                handleSetClean(index, true);
                setIsClean(true);
            }
            setUnsavedAutoCompleteValue(newVal);
        },
        [
            index,
            isClean,
            setIsClean,
            setUnsavedAutoCompleteValue,
            handleSetClean,
        ]
    );

    const handleNameChange = useCallback(
        (newVal) => {
            handleSetValue(index, {
                contingencyName: newVal,
                equipmentIDs: value?.equipmentIDs,
            });
        },
        [index, value, handleSetValue]
    );

    const handleAutoCompleteDeleteItem = useCallback(
        (item, indexInArray) => {
            if (value?.equipmentIDs) {
                let arr = [...value.equipmentIDs];
                arr.splice(indexInArray, 1);
                handleAutoCompleteChange(arr);
            }
        },
        [value, handleAutoCompleteChange]
    );

    // If the user typed something in the autocomplete field but did not press Enter,
    // when the focus is lost on the field, its value is purged. To not lose the user's
    // input, we save it here.
    const handleAutoCompleteBlur = useCallback(() => {
        if (unsavedAutoCompleteValue?.trim().length > 0) {
            let arr = [...value.equipmentIDs];
            arr.push(unsavedAutoCompleteValue);
            handleAutoCompleteChange(arr);
        }
    }, [value, unsavedAutoCompleteValue, handleAutoCompleteChange]);

    return (
        <Draggable
            isDragDisabled={tableLength === 1}
            draggableId={id}
            index={index}
            key={id + value + index}
        >
            {(provided) => (
                <div
                    style={{ width: '100%' }}
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                >
                    <Grid
                        container
                        item
                        spacing={2}
                        key={index + id + 'container item'}
                        className={classes.tableRow}
                    >
                        <Grid xs={0.6} item>
                            {tableLength !== 1 ? (
                                <IconButton
                                    {...provided.dragHandleProps}
                                    key={id + index + 'drag'}
                                >
                                    <Tooltip
                                        title={intl.formatMessage({
                                            id: 'dragAndDrop',
                                        })}
                                        placement="right"
                                    >
                                        <DragIndicatorIcon spacing={0} />
                                    </Tooltip>
                                </IconButton>
                            ) : (
                                <></>
                            )}
                        </Grid>
                        <Grid xs={1} item>
                            <Checkbox
                                checked={selectedIds.has(index)}
                                onClick={() => handleSelection(index)}
                                className={classes.checkboxes}
                            ></Checkbox>
                        </Grid>
                        <Grid
                            container
                            alignItems="center"
                            xs={3}
                            item
                            key={id + index + 'name'}
                        >
                            <Input
                                id={id + index + 'nameInput'}
                                value={value?.contingencyName ?? ''}
                                fullWidth={true}
                                placeholder={intl.formatMessage({
                                    id: 'elementName',
                                })}
                                onChange={(event) =>
                                    handleNameChange(event.target.value)
                                }
                            />
                        </Grid>

                        <Grid
                            container
                            alignItems="center"
                            xs={7.4}
                            item
                            key={id + index + 'equipments'}
                            justifyContent="flex-end"
                        >
                            <Autocomplete
                                id={id + index + 'equipmentsInput'}
                                value={value?.equipmentIDs ?? []}
                                freeSolo // Allow any string from the user in the field
                                multiple // Allow multiple strings in the field
                                // Saves the user's input when pressing Enter. The value goes in a Chip.
                                onChange={(_, newVal) =>
                                    handleAutoCompleteChange(newVal)
                                }
                                // The following three parameters allow to save the user's input and put it in
                                // a Chip if the user loses focus on the field.
                                onBlur={handleAutoCompleteBlur} // To save the value and put it in a Chip when focus is lost
                                clearOnBlur={true} // To clear the field when focus is lost, to not have the value and the chip at the same time
                                onInputChange={(_, value) =>
                                    handleAutoCompleteInputChange(value)
                                } // To store the current value with each keystroke
                                style={{ width: '100%' }}
                                size="small"
                                options={[]}
                                renderInput={(props) => (
                                    <TextField
                                        label={
                                            <FormattedMessage id="equipments" />
                                        }
                                        {...props}
                                    />
                                )}
                                renderTags={(values) => {
                                    return values.map((item, indexInArray) => (
                                        <Chip
                                            key={
                                                id +
                                                index +
                                                'chip_' +
                                                indexInArray
                                            }
                                            size="small"
                                            onDelete={() =>
                                                handleAutoCompleteDeleteItem(
                                                    item,
                                                    indexInArray
                                                )
                                            }
                                            label={item}
                                            className={classes.chip}
                                        />
                                    ));
                                }}
                            />
                        </Grid>
                    </Grid>
                </div>
            )}
        </Draggable>
    );
};

const ExplicitNamingContingencyListDialogContent = ({
    id,
    open,
    name,
    isCreation,
    onChange,
}) => {
    const headersId = ['elementName', 'equipments'];
    const [createFilterErr, setCreateFilterErr] = React.useState('');
    const [defaultValues, setDefaultValues] = useState({
        identifierContingencyList: [],
    });
    const [isEdited, setIsEdited] = useState(false);
    const fetchFilter = useRef(null);
    fetchFilter.current = open && !isCreation;

    useEffect(() => {
        if (id && fetchFilter.current) {
            getContingencyList(ContingencyListType.EXPLICIT_NAMING, id)
                .then((response) => {
                    setDefaultValues(
                        getIdentifierContingencyListFromResponse(response)
                    );
                })
                .catch((error) => setCreateFilterErr(error));
        }
    }, [id]);

    const [tableValues, tableValuesField, isDragged, isClean] =
        useEquipmentTableValues({
            id: id ?? 'editFilterTable',
            name: name,
            tableHeadersIds: headersId,
            Row: ExplicitNamingFilterRow,
            isGeneratorOrLoad: false,
            defaultTableValues: defaultValues?.identifierContingencyList,
            setCreateFilterErr: setCreateFilterErr,
            equipmentType: '',
            setIsEdited: setIsEdited,
            minNumberOfEquipments: 3,
            formType: ElementType.CONTINGENCY_LIST,
        });

    useEffect(() => {
        onChange(tableValues, isEdited, isDragged, isClean);
    }, [onChange, tableValues, isEdited, isDragged, isClean]);

    return (
        <div>
            <Grid container spacing={2}>
                <Grid item xs={12} />
                {/* // TODO Remove this temporary message with the next Powsybl version, when contingency names can be saved */}
                <Grid item xs={12}>
                    <Alert severity="warning">
                        <FormattedMessage id="temporaryContingencyWarning" />
                    </Alert>
                </Grid>
                {/* // End of temporary message to remove */}

                {tableValuesField}
            </Grid>
            {createFilterErr !== '' && (
                <Alert severity="error">{createFilterErr}</Alert>
            )}
        </div>
    );
};

ExplicitNamingContingencyListDialogContent.prototype = {
    id: PropTypes.string,
    name: PropTypes.string,
    open: PropTypes.bool,
    isCreation: PropTypes.bool,
};

export default ExplicitNamingContingencyListDialogContent;
