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
import { useIntl } from 'react-intl';
import { createFilter } from '../../utils/rest-api';
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

const useStyles = makeStyles(() => ({
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

    return (
        <Draggable draggableId={index + id} index={index}>
            {(provided) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    draggable={true}
                >
                    <Grid
                        container
                        xs={12}
                        spacing={0}
                        id={id + index}
                        key={id + index}
                        style={{ borderBottom: '1px solid grey' }}
                    >
                        <Grid xs={1} item>
                            <IconButton size={'small'}>
                                <DragIndicatorIcon />
                            </IconButton>
                        </Grid>
                        <Grid xs={isGeneratorOrLoad ? 4 : 7} item>
                            <input
                                value={value?.equipmentId ?? ''}
                                style={{
                                    border: 'hidden',
                                    backgroundColor: 'inherit',
                                    height: '100%',
                                    width: '100%',
                                }}
                                placeholder={intl.formatMessage({ id: 'ID' })}
                                onChange={(event) =>
                                    handleSetValue(index, {
                                        equipmentId: event.target.value,
                                        distributionKey: value?.distributionKey,
                                    })
                                }
                            />
                        </Grid>
                        {isGeneratorOrLoad && (
                            <Grid xs={3} item>
                                <input
                                    value={value?.distributionKey}
                                    style={{
                                        border: 'hidden',
                                        backgroundColor: 'inherit',
                                        height: '100%',
                                        width: '100%',
                                    }}
                                    onChange={(event) =>
                                        handleSetValue(index, {
                                            equipmentId: value?.equipmentId,
                                            distributionKey: event.target.value,
                                        })
                                    }
                                    type={'number'}
                                    placeholder={intl.formatMessage({
                                        id: 'distributionKey',
                                    })}
                                />
                            </Grid>
                        )}
                        <Grid xs={1} item>
                            <IconButton
                                key={id + index}
                                onClick={() => handleDeleteItem(index)}
                                disabled={index === 0}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Grid>
                        <Grid xs={1} item>
                            <IconButton
                                key={id + index}
                                onClick={() => {
                                    if (index !== 0) {
                                        handleChangeOrder(index, -1);
                                    }
                                }}
                            >
                                <ArrowCircleUp />
                            </IconButton>
                        </Grid>
                        <Grid xs={1} item>
                            <IconButton
                                key={id + index}
                                onClick={() => {
                                    if (isLastValue) {
                                        handleChangeOrder(index, 1);
                                    }
                                }}
                            >
                                <ArrowCircleDown />
                            </IconButton>
                        </Grid>
                        <Grid xs={1} item>
                            <IconButton
                                key={id + index}
                                onClick={() => handleAddValue()}
                            >
                                <AddIcon />
                            </IconButton>
                        </Grid>
                    </Grid>
                </div>
            )}
        </Draggable>
    );
};

const ManualFilterCreationDialog = ({
    open,
    onClose,
    inputLabelText,
    name,
    title,
    customTextValidationBtn,
    customTextCancelBtn,
    setFilterCreationType,
}) => {
    const classes = useStyles();
    const [isGeneratorOrLoad, setIsGeneratorOrLoad] = useState(false);
    const [equipmentType, setEquipmentType] = useState(null);
    const headersId = ['ID'];
    const generatorOrLoadHeadersId = ['ID', 'distributionKey'];
    const [createFilterErr, setCreateFilterErr] = React.useState('');
    const activeDirectory = useSelector((state) => state.activeDirectory);

    const resetDialog = () => {
        setEquipmentType(null);
        setCreateFilterErr('');
        setFilterCreationType(FilterType.AUTOMATIC);
    };

    const [tableValues, tableValuesField] = useEquipmentTableValues({
        id: 'editFilterTable',
        tableHeadersIds: isGeneratorOrLoad
            ? generatorOrLoadHeadersId
            : headersId,
        Field: ManualFilterTable,
        isGeneratorOrLoad: isGeneratorOrLoad,
    });

    useEffect(() => {
        setIsGeneratorOrLoad(
            equipmentType === 'GENERATOR' || equipmentType === 'LOAD'
        );
    }, [equipmentType]);

    const handleCreateFilter = () => {
        if (createFilterErr === '') {
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
                })
                .catch((message) => {
                    setCreateFilterErr(message);
                });
        }
    };

    const handleClose = () => {
        setFilterCreationType(FilterType.AUTOMATIC);
        resetDialog();
    };

    return (
        <Dialog
            classes={classes.dialogPaper}
            fullWidth={true}
            open={open}
            onClose={onClose}
            aria-setsize={2000}
        >
            <DialogTitle onClose={onClose}>{title}</DialogTitle>
            <DialogContent>
                <div>
                    <FilterTypeSelection
                        type={equipmentType}
                        disabled={false}
                        onChange={setEquipmentType}
                    />
                    {equipmentType && tableValuesField}
                    {createFilterErr !== '' && (
                        <Alert severity="error">{createFilterErr}</Alert>
                    )}
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>{customTextCancelBtn}</Button>
                <Button
                    variant="outlined"
                    onClick={handleCreateFilter}
                    disabled={tableValues.length === 0}
                >
                    {customTextValidationBtn}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

ManualFilterCreationDialog.prototype = {
    inputLabelText: PropTypes.string,
    name: PropTypes.string,
    onClose: PropTypes.func,
    open: PropTypes.bool,
    title: PropTypes.string,
    customTextCancelBtn: PropTypes.string,
    customTextValidationBtn: PropTypes.string,
    setFilterCreationType: PropTypes.func,
};

export default ManualFilterCreationDialog;
