/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

import Grid from '@mui/material/Grid';
import { useEquipmentTableValues } from './field-hook';
import makeStyles from '@mui/styles/makeStyles';
import { useIntl } from 'react-intl';
import { getFilterById } from '../../utils/rest-api';

import IconButton from '@mui/material/IconButton';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import { Draggable } from 'react-beautiful-dnd';
import PropTypes from 'prop-types';
import { Alert, Checkbox, Input, Tooltip } from '@mui/material';
import { filterEquipmentDefinition } from '../../utils/equipment-types';
import { FilterTypeSelection } from './criteria-based-filter-dialog-content';
import { renderPopup } from './create-filter-dialog';
import { ElementType } from '../../utils/elementType';

const useStyles = makeStyles(() => ({}));

export const ExplicitNamingFilterRow = ({
    id,
    index,
    isGeneratorOrLoad,
    value,
    handleSetValue,
    handleSelection,
    selectedIds,
    tableLength,
}) => {
    const intl = useIntl();
    const classes = useStyles();

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
                        sx={{ width: '100%', height: '50%' }}
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
                            key={id + index + 'equipmentID'}
                        >
                            <Input
                                id={id + index + 'IdInput'}
                                value={value?.contingencyName ?? ''}
                                fullWidth={true}
                                placeholder={intl.formatMessage({
                                    id: 'elementName',
                                })}
                                onChange={(event) =>
                                    handleSetValue(index, {
                                        contingencyName: event.target.value,
                                        equipmentIDs: value?.equipmentIDs,
                                    })
                                }
                            />
                        </Grid>

                        <Grid
                            container
                            alignItems="center"
                            xs={6}
                            item
                            key={id + index + 'dKey'}
                            justifyContent="flex-end"
                        >
                            <Input
                                id={id + index + 'dKeyInput'}
                                value={value?.equipmentIDs ?? ''}
                                style={{
                                    border: 'hidden',
                                    backgroundColor: 'inherit',
                                    width: '100%',
                                }}
                                onChange={(event) => {
                                    handleSetValue(index, {
                                        contingencyName: value?.contingencyName,
                                        equipmentIDs: event.target.value,
                                    });
                                }}
                                placeholder={intl.formatMessage({
                                    id: 'equipments',
                                })}
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
    isFilterCreation,
    handleFilterCreation,
}) => {
    //const [isGeneratorOrLoad, setIsGeneratorOrLoad] = useState(false);
    //const [equipmentType, setEquipmentType] = useState(null);
    const headersId = ['elementName', 'equipments'];
    const [createFilterErr, setCreateFilterErr] = React.useState('');
    const [defaultValues, setDefaultValues] = useState({
        filterEquipmentsAttributes: [],
    });
    const [isEdited, setIsEdited] = useState(false);
    const fetchFilter = useRef(null);
    fetchFilter.current = open && !isFilterCreation;
    //const [isConfirmationPopupOpen, setOpenConfirmationPopup] = useState(false);
    //const [newEquipmentType, setNewEquipmentType] = useState(null);

    useEffect(() => {
        if (id && fetchFilter.current) {
            getFilterById(id)
                .then((response) => {
                    setDefaultValues(response); // TODO CHARLY analyser le retour du back d'Etienne et mapper le résultat ici ... (GOTO LBL A)
                    //setEquipmentType(response?.equipmentType);
                })
                .catch((error) => setCreateFilterErr(error));
        }
    }, [id]);

    const [tableValues, tableValuesField, isDragged] = useEquipmentTableValues({
        id: id ?? 'editFilterTable',
        name: name,
        tableHeadersIds: headersId,
        Row: ExplicitNamingFilterRow,
        //isGeneratorOrLoad: isGeneratorOrLoad,
        isGeneratorOrLoad: false,
        defaultTableValues: defaultValues?.filterEquipmentsAttributes, // TODO CHARLY (LBL A) ... et là
        setCreateFilterErr: setCreateFilterErr,
        //equipmentType: equipmentType,
        equipmentType: '',
        setIsEdited: setIsEdited,
        minNumberOfEquipments: 3,
        formType: ElementType.CONTINGENCY_LIST,
    });

    /*useEffect(() => {
        setIsGeneratorOrLoad(
            equipmentType === 'GENERATOR' || equipmentType === 'LOAD'
        );
    }, [equipmentType]);*/

    /*const handleEquipmentTypeChange = (type, isTableEdited) => {
        if (isTableEdited) {
            setNewEquipmentType(type);
            setOpenConfirmationPopup(true);
        } else {
            setEquipmentType(type);
            setDefaultValues({
                filterEquipmentsAttributes: [],
                equipmentType: equipmentType,
            });
        }
    };*/

    /*const handlePopupConfirmation = () => {
        setOpenConfirmationPopup(false);
        setIsEdited(false);
        setEquipmentType(newEquipmentType);
        setDefaultValues({
            filterEquipmentsAttributes: [],
            equipmentType: equipmentType,
        });
    };*/

    const sendData = useCallback(() => {
        handleFilterCreation(
            tableValues,
            //isGeneratorOrLoad,
            false,
            isFilterCreation,
            //equipmentType,
            '',
            name,
            id,
            isEdited,
            isDragged
        );
    }, [
        //equipmentType,
        handleFilterCreation,
        id,
        isDragged,
        isEdited,
        isFilterCreation,
        //isGeneratorOrLoad,
        name,
        tableValues,
    ]);

    useEffect(() => {
        sendData();
    }, [sendData]);

    return (
        <div>
            <Grid container spacing={2}>
                {/*<Grid item xs={12}>*/}
                {/*    REMOVED*/}
                {/*    <FilterTypeSelection*/}
                {/*        type={'GENERATOR'}*/}
                {/*        disabled={false}*/}
                {/*        onChange={() => {}}*/}
                {/*        equipmentDefinition={filterEquipmentDefinition}*/}
                {/*        isEdited={isEdited}*/}
                {/*    />*/}
                {/*</Grid>*/}
                <Grid item xs={12} />
                {/*equipmentType && */ tableValuesField}
            </Grid>
            {createFilterErr !== '' && (
                <Alert severity="error">{createFilterErr}</Alert>
            )}
            {/*renderPopup(
                isConfirmationPopupOpen,
                intl,
                setOpenConfirmationPopup,
                handlePopupConfirmation
            )*/}
        </div>
    );
};

ExplicitNamingContingencyListDialogContent.prototype = {
    id: PropTypes.string,
    name: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool,
    title: PropTypes.string,
    isFilterCreation: PropTypes.bool,
};

export default ExplicitNamingContingencyListDialogContent;
