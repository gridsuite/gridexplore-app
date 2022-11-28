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
import { Checkbox, Input, Tooltip } from '@mui/material';
import { filterEquipmentDefinition } from '../../utils/equipment-types';
import { FilterTypeSelection } from './criteria-filter-dialog-content';

const useStyles = makeStyles((theme) => ({
    dialogPaper: {
        width: 'auto',
        minWidth: '800px',
        minHeight: '400px',
        margin: 'auto',
    },
}));

function isNumber(val) {
    return /^-?[0-9]*[.,]?[0-9]*$/.test(val);
}

export const ExplicitNamingFilterRow = ({
    id,
    index,
    isGeneratorOrLoad,
    value,
    handleSetValue,
    handleSelection,
    selectedIds,
}) => {
    const intl = useIntl();
    const classes = useStyles();
    const getXs = () => {
        return isGeneratorOrLoad ? 6 : 9;
    };

    return (
        <Draggable draggableId={id} index={index} key={id + value + index}>
            {(provided) => (
                <div
                    style={{ width: '100%' }}
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                >
                    <Grid
                        container
                        item
                        spacing={2}
                        key={index + id + 'container item'}
                        sx={{ width: '100%', height: '50%' }}
                    >
                        <Grid xs={1} item>
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
                        </Grid>
                        <Grid xs={1} item>
                            <Checkbox
                                checked={selectedIds.has(index)}
                                onClick={() => handleSelection(index)}
                                className={classes.checkboxes}
                            ></Checkbox>
                        </Grid>
                        <Grid
                            xs={getXs()}
                            item
                            key={id + index + 'equipmentID'}
                        >
                            <Input
                                id={id + index + 'IdInput'}
                                value={value?.equipmentID ?? ''}
                                fullWidth={true}
                                placeholder={intl.formatMessage({
                                    id: 'ID',
                                })}
                                onChange={(event) =>
                                    handleSetValue(index, {
                                        equipmentID: event.target.value,
                                        distributionKey: value?.distributionKey,
                                    })
                                }
                                error={value?.equipmentID === ''}
                                required
                            />
                        </Grid>
                        {isGeneratorOrLoad && (
                            <Grid
                                xs={3}
                                item
                                key={id + index + 'dKey'}
                                justifyContent="flex-end"
                            >
                                <Input
                                    id={id + index + 'dKeyInput'}
                                    value={value?.distributionKey ?? ''}
                                    style={{
                                        border: 'hidden',
                                        backgroundColor: 'inherit',
                                        width: '100%',
                                    }}
                                    onChange={(event) => {
                                        if (isNumber(event.target.value)) {
                                            handleSetValue(index, {
                                                equipmentID: value?.equipmentID,
                                                distributionKey:
                                                    event.target.value,
                                            });
                                        }
                                    }}
                                    placeholder={intl.formatMessage({
                                        id: 'key',
                                    })}
                                />
                            </Grid>
                        )}
                    </Grid>
                </div>
            )}
        </Draggable>
    );
};

const ExplicitNamingFilterDialogContent = ({
    id,
    open,
    onClose,
    name,
    title,
    isFilterCreation,
    handleFilterCreation,
}) => {
    const [isGeneratorOrLoad, setIsGeneratorOrLoad] = useState(false);
    const [equipmentType, setEquipmentType] = useState(null);
    const headersId = ['ID'];
    const generatorOrLoadHeadersId = ['ID', 'distributionKey'];
    const [createFilterErr, setCreateFilterErr] = React.useState('');
    const [defaultValues, setDefaultValues] = useState(null);

    const fetchFilter = useRef(null);
    fetchFilter.current = open && !isFilterCreation;

    useEffect(() => {
        if (id && fetchFilter.current) {
            getFilterById(id)
                .then((response) => {
                    setDefaultValues(response);
                    setEquipmentType(response?.equipmentType);
                })
                .catch((error) => setCreateFilterErr(error));
        }
    }, [id]);

    const [tableValues, tableValuesField] = useEquipmentTableValues({
        id: id ?? 'editFilterTable',
        name: name,
        tableHeadersIds: isGeneratorOrLoad
            ? generatorOrLoadHeadersId
            : headersId,
        Row: ExplicitNamingFilterRow,
        isGeneratorOrLoad: isGeneratorOrLoad,
        defaultTableValues: defaultValues?.filterEquipmentsAttributes,
        setCreateFilterErr: setCreateFilterErr,
        equipmentType: equipmentType,
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

    const sendData = useCallback(() => {
        handleFilterCreation(
            tableValues,
            isGeneratorOrLoad,
            isFilterCreation,
            equipmentType,
            name,
            id
        );
    }, [
        equipmentType,
        handleFilterCreation,
        id,
        isFilterCreation,
        isGeneratorOrLoad,
        name,
        tableValues,
    ]);

    useEffect(() => {
        sendData();
    }, [sendData]);

    return (
        <div>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <FilterTypeSelection
                        type={equipmentType}
                        disabled={false}
                        onChange={handleEquipmentTypeChange}
                        equipmentDefinition={filterEquipmentDefinition}
                    />
                </Grid>
                <Grid item xs={12} />
                {equipmentType && tableValuesField}
            </Grid>
        </div>
    );
};

ExplicitNamingFilterDialogContent.prototype = {
    id: PropTypes.string,
    name: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool,
    title: PropTypes.string,
    isFilterCreation: PropTypes.bool,
};

export default ExplicitNamingFilterDialogContent;
