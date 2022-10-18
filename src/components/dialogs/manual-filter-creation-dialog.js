/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import React, { useEffect, useState } from 'react';
import { FilterTypeSelection } from './generic-filter-dialog';
import Grid from '@mui/material/Grid';
import { useEquipmentTableValues } from './field-hook';
import makeStyles from '@mui/styles/makeStyles';
import { FormattedMessage, useIntl } from 'react-intl';
import { createFilter, getFilterById, saveFilter } from '../../utils/rest-api';
import { FilterType } from '../../utils/elementType';
import { useSelector } from 'react-redux';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import { ArrowCircleDown, ArrowCircleUp } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/ControlPoint';
import { Draggable } from 'react-beautiful-dnd';
import PropTypes from 'prop-types';
import { Input } from '@mui/material';

const useStyles = makeStyles((theme) => ({
    dialogPaper: {
        width: 'auto',
        minWidth: '1600px',
        minHeight: '600px',
        margin: 'auto',
    },
}));

const ManualFilterTable = ({
    id,
    index,
    isGeneratorOrLoad,
    value,
    isLastValue,
    handleAddValue,
    handleSetValue,
    handleChangeOrder,
    handleDeleteItem,
}) => {
    const intl = useIntl();
    function isNumber(val) {
        return /^-?[0-9]*[.,]?[0-9]*$/.test(val);
    }

    return (
        <Draggable draggableId={index + id} index={index}>
            {(provided) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    draggable={true}
                    key={index + id}
                >
                    <Grid
                        container
                        item
                        xs={12}
                        justifyContent="space-between"
                        width={'inherit'}
                        spacing={2}
                    >
                        <Grid xs={1} item key={id + index + 'drag'}>
                            <IconButton>
                                <DragIndicatorIcon />
                            </IconButton>
                        </Grid>
                        <Grid xs={7} item container>
                            <Grid xs item key={id + index + 'equipmentID'}>
                                <Input
                                    id={id + index}
                                    value={value?.equipmentID ?? ''}
                                    style={{
                                        border: 'hidden',
                                        backgroundColor: 'inherit',
                                        height: '100%',
                                        width: '100%',
                                    }}
                                    placeholder={intl.formatMessage({
                                        id: 'ID',
                                    })}
                                    onChange={(event) =>
                                        handleSetValue(index, {
                                            equipmentID: event.target.value,
                                            distributionKey:
                                                value?.distributionKey,
                                        })
                                    }
                                    error={value?.equipmentID === ''}
                                    required
                                />
                            </Grid>
                            {isGeneratorOrLoad && (
                                <Grid xs={5} item key={id + index + 'dKey'}>
                                    <Input
                                        id={id + index}
                                        value={value?.distributionKey ?? ''}
                                        style={{
                                            border: 'hidden',
                                            backgroundColor: 'inherit',
                                            height: '100%',
                                            width: '100%',
                                        }}
                                        onChange={(event) => {
                                            if (isNumber(event.target.value)) {
                                                handleSetValue(index, {
                                                    equipmentID:
                                                        value?.equipmentID,
                                                    distributionKey:
                                                        event.target.value,
                                                });
                                            }
                                        }}
                                        placeholder={intl.formatMessage({
                                            id: 'distributionKey',
                                        })}
                                    />
                                </Grid>
                            )}
                        </Grid>
                        <Grid item container xs={4} spacing={5}>
                            <Grid xs={1} item key={id + index + 'delete'}>
                                <IconButton
                                    onClick={() => handleDeleteItem(index)}
                                    disabled={index === 0}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Grid>
                            <Grid xs={1} item key={id + index + 'up'}>
                                <IconButton
                                    onClick={() => {
                                        if (index !== 0) {
                                            handleChangeOrder(index, -1);
                                        }
                                    }}
                                >
                                    <ArrowCircleUp />
                                </IconButton>
                            </Grid>
                            <Grid xs={1} item key={id + index + 'down'}>
                                <IconButton
                                    onClick={() => {
                                        if (isLastValue) {
                                            handleChangeOrder(index, 1);
                                        }
                                    }}
                                >
                                    <ArrowCircleDown />
                                </IconButton>
                            </Grid>
                            <Grid xs={1} item key={id + index + 'add'}>
                                <IconButton onClick={() => handleAddValue()}>
                                    <AddIcon />
                                </IconButton>
                            </Grid>
                        </Grid>
                    </Grid>
                </div>
            )}
        </Draggable>
    );
};

const ManualFilterCreationDialog = ({
    id,
    open,
    onClose,
    inputLabelText,
    name,
    title,
    setFilterCreationType,
    isFilterCreation,
}) => {
    const intl = useIntl();
    const classes = useStyles();
    const [isGeneratorOrLoad, setIsGeneratorOrLoad] = useState(false);
    const [equipmentType, setEquipmentType] = useState(null);
    const headersId = ['ID'];
    const generatorOrLoadHeadersId = ['ID', 'distributionKey'];
    const [createFilterErr, setCreateFilterErr] = React.useState('');
    const activeDirectory = useSelector((state) => state.activeDirectory);
    const [defaultValues, setDefaultValues] = useState(null);
    const [windowClosed, setWindowClose] = useState(false);

    const resetDialog = () => {
        setEquipmentType('');
        setCreateFilterErr('');
        setDefaultValues({
            filterEquipmentsAttributes: [],
            equipmentType: equipmentType,
        });
        setWindowClose(true);
    };

    useEffect(() => {
        console.log('id : ', id);
        if (id) {
            getFilterById(id).then((response) => {
                console.log('response : ', response);
                setDefaultValues(response);
                setEquipmentType(response?.equipmentType);
            });
            setWindowClose(false);
        }
    }, [id, windowClosed]);

    const [tableValues, tableValuesField] = useEquipmentTableValues({
        id: id ?? 'editFilterTable',
        tableHeadersIds: isGeneratorOrLoad
            ? generatorOrLoadHeadersId
            : headersId,
        Field: ManualFilterTable,
        isGeneratorOrLoad: isGeneratorOrLoad,
        equipmentType: equipmentType,
        defaultTableValues: defaultValues?.filterEquipmentsAttributes,
        defaultEquipmentType: defaultValues?.equipmentType,
    });

    useEffect(() => {
        setIsGeneratorOrLoad(
            equipmentType === 'GENERATOR' || equipmentType === 'LOAD'
        );
    }, [equipmentType]);

    const handleEquipmentTypeChange = (type) => {
        setEquipmentType(type);
        setDefaultValues({
            filterEquipmentsAttributes: [],
            equipmentType: equipmentType,
        });
    };

    const handleCreateFilter = () => {
        if (
            createFilterErr === '' &&
            tableValues.every((el) => {
                if (!el?.equipmentID) {
                    setCreateFilterErr(
                        intl.formatMessage({
                            id: 'missingEquipmentsIdsError',
                        })
                    );
                }
                return el.equipmentID;
            })
        ) {
            if (isGeneratorOrLoad) {
                // we check if all the distribution keys are null.
                // If one is set, all the distribution keys that are null take 0 as value
                let isAllKeysNull = false;
                tableValues.forEach((val, index) => {
                    if (val.distributionKey) {
                        isAllKeysNull = false;
                    }

                    if (!isAllKeysNull && !val.distributionKey) {
                        tableValues[index] = {
                            equipmentID: val.equipmentID,
                            distributionKey: 0,
                        };
                    }
                });
            }
            if (isFilterCreation) {
                createFilter(
                    {
                        type: FilterType.MANUAL,
                        equipmentType: equipmentType,
                        filterEquipmentsAttributes: tableValues,
                    },
                    name,
                    activeDirectory
                )
                    .then(() => {
                        handleClose();
                        resetDialog();
                    })
                    .catch((message) => {
                        setCreateFilterErr(message);
                    });
            } else {
                saveFilter({
                    id: id,
                    type: FilterType.MANUAL,
                    equipmentType: equipmentType,
                    filterEquipmentsAttributes: tableValues,
                })
                    .then(() => {
                        handleClose();
                        resetDialog();
                    })
                    .catch((message) => {
                        setCreateFilterErr(message);
                    });
            }
        }
    };

    const handleClose = () => {
        if (onClose) onClose();
        if (setFilterCreationType) setFilterCreationType(FilterType.AUTOMATIC);
        resetDialog();
    };

    return (
        <Dialog
            classes={classes.dialogPaper}
            fullWidth={true}
            open={open}
            onClose={onClose}
        >
            <DialogTitle onClose={onClose}>{title}</DialogTitle>
            <DialogContent>
                <div>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <FilterTypeSelection
                                type={equipmentType}
                                disabled={false}
                                onChange={handleEquipmentTypeChange}
                            />
                        </Grid>
                        <Grid item xs={12} />
                        {equipmentType && tableValuesField}
                        {createFilterErr !== '' && (
                            <Alert severity="error">{createFilterErr}</Alert>
                        )}
                    </Grid>
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>
                    <FormattedMessage id="cancel" />
                </Button>
                <Button
                    variant="outlined"
                    onClick={handleCreateFilter}
                    disabled={tableValues.length === 0}
                >
                    <FormattedMessage id="validate" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

ManualFilterCreationDialog.prototype = {
    id: PropTypes.string,
    inputLabelText: PropTypes.string,
    name: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool,
    title: PropTypes.string,
    isFilterCreation: PropTypes.bool,
    setFilterCreationType: PropTypes.func,
};

export default ManualFilterCreationDialog;
