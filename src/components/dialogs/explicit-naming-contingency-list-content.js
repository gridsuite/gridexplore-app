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
import { getContingencyList } from '../../utils/rest-api';

import IconButton from '@mui/material/IconButton';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

import { Draggable } from 'react-beautiful-dnd';
import PropTypes from 'prop-types';
import { Alert, Checkbox, Input, Tooltip } from '@mui/material';
import { ContingencyListType, ElementType } from '../../utils/elementType';

const useStyles = makeStyles(() => ({}));

export const charlyTempFormatConverter = (id, name, values) => {
    const identifiersList = values
        .filter(
            (line) => line?.equipmentIDs && line.equipmentIDs.trim().length > 0
        ) // We only take lines that have an equipmentIDs value
        .map((line) => {
            const identifierList = line.equipmentIDs
                .split('|')
                .map((identifier) => {
                    return {
                        type: 'ID_BASED',
                        identifier: identifier,
                    };
                });

            return {
                type: 'LIST',
                // contingencyName: line.contingencyName, // Not used for now
                identifierList: identifierList,
            };
        });

    return {
        id: id,
        identifierContingencyList: {
            type: 'identifier',
            version: '1.0',
            name: name,
            identifiableType: 'LINE', // hardcoded for the moment
            identifiers: identifiersList,
        },
        type: 'IDENTIFIERS',
    };
};

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

    const charlyConverterTemp = (idContingencyList) => {
        const result = idContingencyList.identifiers.map(
            (identifiers, index) => {
                return {
                    contingencyName: 'contingencyName' + index,
                    equipmentIDs: identifiers.identifierList
                        .map((identifier) => identifier.identifier)
                        .join('|'),
                };
            }
        );
        return { identifierContingencyList: result };
    };

    useEffect(() => {
        if (id && fetchFilter.current) {
            getContingencyList(ContingencyListType.EXPLICIT_NAMING, id)
                .then((response) => {
                    setDefaultValues(
                        charlyConverterTemp(response?.identifierContingencyList)
                    );
                })
                .catch((error) => setCreateFilterErr(error));
        }
    }, [id]);

    const [tableValues, tableValuesField, isDragged] = useEquipmentTableValues({
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
        onChange(tableValues, isEdited, isDragged);
    }, [onChange, isDragged, isEdited, tableValues]);

    return (
        <div>
            <Grid container spacing={2}>
                <Grid item xs={12} />
                {tableValuesField}
            </Grid>
            {createFilterErr !== '' && (
                <Alert severity="error">{createFilterErr}</Alert>
            )}
        </div>
    );
};

ExplicitNamingContingencyListDialogContent.prototype = {
    // TODO CHARLY clean this
    id: PropTypes.string,
    name: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool,
    title: PropTypes.string,
    isCreation: PropTypes.bool,
};

export default ExplicitNamingContingencyListDialogContent;
