/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useCallback, useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import FiltersEditor from './filters-editor';
import { EquipmentTypes } from '../../utils/equipment-types';
import makeStyles from '@mui/styles/makeStyles';
import {
    getContingencyList,
    saveFormContingencyList,
} from '../../utils/rest-api';
import { ContingencyListType } from '../../utils/elementType';

const emptyFormContingency = {
    equipmentType: EquipmentTypes.LINE,
    nominalVoltage1: {
        operator: 'EQUAL',
        value1: null,
        value2: null,
    },
    nominalVoltage2: {
        operator: 'EQUAL',
        value1: null,
        value2: null,
    },
    countries: [],
    countries2: [],
};

const useStyles = makeStyles(() => ({
    dialogPaper: {
        minWidth: '600px',
        minHeight: '400px',
        margin: 'auto',
    },
}));

/**
 * Dialog to edit a form contingency list
 * @param listId id of list to edit
 * @param open Is the dialog open ?
 * @param onClose Event to close the dialog
 * @param onError handle errors
 * @param title Title of the dialog
 */
const FormContingencyDialog = ({ listId, open, onClose, onError, title }) => {
    const classes = useStyles();
    const [btnSaveListDisabled, setBtnSaveListDisabled] = useState(true);
    const [currentFormContingency, setCurrentFormContingency] = useState(null);
    const [newFormContingency, setNewFormContingency] =
        useState(emptyFormContingency);
    const [voltageNumber, setVoltageNumber] = useState(1);
    const [countryNumber, setCountryNumber] = useState(1);

    const handleClose = () => {
        handleCancel();
    };

    const handleCancel = () => {
        setNewFormContingency(currentFormContingency);
        setBtnSaveListDisabled(true);
        onClose();
    };

    const handleClick = () => {
        let newFiltersContingencyList = {
            ...currentFormContingency,
            ...newFormContingency,
            id: listId,
        };
        saveFormContingencyList(newFiltersContingencyList)
            .then(() => {})
            .catch((errorMessage) => {
                onError(errorMessage);
            });
        setBtnSaveListDisabled(true);
        onClose();
        setCurrentFormContingency(newFiltersContingencyList);
    };

    const getCurrentContingencyList = useCallback(
        (currentItemId) => {
            if (currentItemId !== null) {
                getContingencyList(ContingencyListType.FORM, currentItemId)
                    .then((data) => {
                        if (data) {
                            setCurrentFormContingency(data);
                            setNewFormContingency(data);
                            onEquipmentTypeChanged(data.equipmentType);
                        }
                    })
                    .catch((errorMessage) => {
                        onError(errorMessage);
                    });
            }
        },
        [onError]
    );

    useEffect(() => {
        // get contingency list
        getCurrentContingencyList(listId);
    }, [listId, getCurrentContingencyList]);

    function onEquipmentTypeChanged(newEquipmentType) {
        setVoltageNumber(1);
        setCountryNumber(1);
        if (newEquipmentType === 'LINE' || newEquipmentType === 'HVDC_LINE') {
            setCountryNumber(2);
        } else if (newEquipmentType === 'TWO_WINDINGS_TRANSFORMER') {
            setVoltageNumber(2);
        }
    }

    function areDifferent(newFiltersContingency, currentFormContingency) {
        // make copies of objects with relevant data, sort countries, and compare
        const newData = {
            equipmentType: newFiltersContingency?.equipmentType,
            nominalVoltage1: {
                operator: newFiltersContingency?.nominalVoltage1?.operator,
                value1: newFiltersContingency?.nominalVoltage1?.value1?.toString(), // to avoid '56' vs 56
                value2: newFiltersContingency?.nominalVoltage1?.value2?.toString(),
            },
            nominalVoltage2: {
                operator: newFiltersContingency?.nominalVoltage2?.operator,
                value1: newFiltersContingency?.nominalVoltage2?.value1?.toString(), // to avoid '56' vs 56
                value2: newFiltersContingency?.nominalVoltage2?.value2?.toString(),
            },
            countries: newFiltersContingency?.countries.sort().join(','),
            countries2: newFiltersContingency?.countries2.sort().join(','),
        };
        const currentData = {
            equipmentType: currentFormContingency?.equipmentType,
            nominalVoltage1: {
                operator: currentFormContingency?.nominalVoltage1?.operator,
                value1: currentFormContingency?.nominalVoltage1?.value1?.toString(),
                value2: currentFormContingency?.nominalVoltage1?.value2?.toString(),
            },
            nominalVoltage2: {
                operator: currentFormContingency?.nominalVoltage2?.operator,
                value1: currentFormContingency?.nominalVoltage2?.value1?.toString(),
                value2: currentFormContingency?.nominalVoltage2?.value2?.toString(),
            },
            countries: currentFormContingency?.countries.sort().join(','),
            countries2: currentFormContingency?.countries2.sort().join(','),
        };
        return JSON.stringify(newData) !== JSON.stringify(currentData);
    }

    function onChangeFiltersContingency(newFiltersContingency) {
        if (
            currentFormContingency === null ||
            areDifferent(newFiltersContingency, currentFormContingency)
        ) {
            setBtnSaveListDisabled(false);
        } else {
            setBtnSaveListDisabled(true);
        }
        if (
            newFiltersContingency.equipmentType !==
            newFormContingency.equipmentType
        ) {
            onEquipmentTypeChanged(newFiltersContingency.equipmentType);
        }
        setNewFormContingency(newFiltersContingency);
    }

    return (
        <Dialog
            classes={{ paper: classes.dialogPaper }}
            open={open}
            onClose={handleClose}
            aria-labelledby="dialog-title-form-contingency-edit"
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <FiltersEditor
                    filters={newFormContingency}
                    onChange={onChangeFiltersContingency}
                    nbVoltage={voltageNumber}
                    nbCountry={countryNumber}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancel}>
                    <FormattedMessage id="cancel" />
                </Button>
                <Button
                    disabled={btnSaveListDisabled}
                    onClick={handleClick}
                    variant="outlined"
                >
                    <FormattedMessage id="validate" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

FormContingencyDialog.propTypes = {
    listId: PropTypes.string,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
};

export default FormContingencyDialog;
