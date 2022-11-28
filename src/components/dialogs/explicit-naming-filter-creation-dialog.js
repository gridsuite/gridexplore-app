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
import React, { useEffect, useRef, useState } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { FormattedMessage, useIntl } from 'react-intl';
import { createFilter, saveFilter } from '../../utils/rest-api';
import { FilterType } from '../../utils/elementType';
import { useSelector } from 'react-redux';
import Alert from '@mui/material/Alert';
import PropTypes from 'prop-types';

import ExplicitNamingFilterDialogContent from './explicit-naming-filter-dialog-content';

const useStyles = makeStyles((theme) => ({
    dialogPaper: {
        width: 'auto',
        minWidth: '800px',
        minHeight: '400px',
        margin: 'auto',
    },
}));

const ExplicitNamingCreationDialog = ({
    id,
    open,
    onClose,
    name,
    title,
    isFilterCreation,
}) => {
    const intl = useIntl();
    const classes = useStyles();
    const [isGeneratorOrLoad, setIsGeneratorOrLoad] = useState(false);
    const [equipmentType, setEquipmentType] = useState(null);

    const [createFilterErr, setCreateFilterErr] = React.useState('');
    const activeDirectory = useSelector((state) => state.activeDirectory);

    const [tableValues, setTablesValues] = useState([]);

    const fetchFilter = useRef(null);
    fetchFilter.current = open && !isFilterCreation;

    const resetDialog = () => {
        setEquipmentType('');
        setCreateFilterErr('');
    };

    useEffect(() => {
        setIsGeneratorOrLoad(
            equipmentType === 'GENERATOR' || equipmentType === 'LOAD'
        );
    }, [equipmentType]);

    const handleEditCallback = (
        tableValues,
        isGeneratorOrLoad,
        isFilterCreation,
        equipmentType,
        name,
        id
    ) => {
        setEquipmentType(equipmentType);
        setTablesValues(tableValues);
    };

    useEffect(() => {
        setCreateFilterErr('');
    }, [tableValues]);

    const handleCreateFilter = () => {
        if (
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
                let isAllKeysNull = tableValues.every(
                    (row) => !row.distributionKey
                );
                tableValues.forEach((val, index) => {
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
                        type: FilterType.EXPLICIT_NAMING,
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
            } else {
                saveFilter({
                    id: id,
                    type: FilterType.EXPLICIT_NAMING,
                    equipmentType: equipmentType,
                    filterEquipmentsAttributes: tableValues,
                })
                    .then(() => {
                        handleClose();
                    })
                    .catch((message) => {
                        setCreateFilterErr(message);
                    });
            }
        }
    };

    const handleClose = () => {
        if (onClose) onClose();
        resetDialog();
    };

    return (
        <Dialog
            classes={{ paper: classes.dialogPaper }}
            fullWidth={true}
            open={open}
            onClose={handleClose}
        >
            <DialogTitle onClose={onClose}>{title}</DialogTitle>
            <DialogContent>
                <ExplicitNamingFilterDialogContent
                    id={id}
                    open={open}
                    title={title}
                    onClose={onClose}
                    name={name}
                    isFilterCreation={isFilterCreation}
                    handleFilterCreation={handleEditCallback}
                />
                {createFilterErr !== '' && (
                    <Alert severity="error">{createFilterErr}</Alert>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>
                    <FormattedMessage id="cancel" />
                </Button>
                <Button
                    variant="outlined"
                    onClick={handleCreateFilter}
                    disabled={
                        tableValues.length === 0 ||
                        createFilterErr !== '' ||
                        !equipmentType
                    }
                >
                    <FormattedMessage id="validate" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

ExplicitNamingCreationDialog.prototype = {
    id: PropTypes.string,
    name: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool,
    title: PropTypes.string,
    isFilterCreation: PropTypes.bool,
};

export default ExplicitNamingCreationDialog;
