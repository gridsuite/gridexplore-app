/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useCallback, useEffect, useState } from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import FiltersEditor from './filters-editor';
import { EquipmentTypes } from '../../utils/equipment-types';
import { makeStyles } from '@material-ui/core/styles';
import {
    getContingencyList,
    saveFormContingencyList,
} from '../../utils/rest-api';
import { ContingencyListType } from '../../utils/elementType';

const emptyFormContingency = {
    equipmentID: '*',
    equipmentName: '*',
    equipmentType: EquipmentTypes.LINE,
    nominalVoltageOperator: '=',
    nominalVoltage: '',
    countries: [],
};

const useStyles = makeStyles(() => ({
    dialogPaper: {
        minWidth: '600px',
        minHeight: '450px',
        margin: 'auto',
    },
    filtersEditor: {
        minWidth: '570px',
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

    function onChangeFiltersContingency(newFiltersContingency) {
        if (currentFormContingency !== null) {
            if (
                newFiltersContingency.equipmentID !==
                    currentFormContingency.equipmentID ||
                newFiltersContingency.equipmentName !==
                    currentFormContingency.equipmentName ||
                newFiltersContingency.equipmentType !==
                    currentFormContingency.equipmentType ||
                newFiltersContingency.nominalVoltageOperator !==
                    currentFormContingency.nominalVoltageOperator ||
                newFiltersContingency.nominalVoltage !==
                    currentFormContingency.nominalVoltage + '' ||
                newFiltersContingency.countries.sort().join(',') !==
                    currentFormContingency.countries.sort().join(',')
            ) {
                setBtnSaveListDisabled(false);
            } else {
                setBtnSaveListDisabled(true);
            }
        } else {
            setBtnSaveListDisabled(false);
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
                <div className={classes.filtersEditor}>
                    <FiltersEditor
                        filters={newFormContingency}
                        onChange={onChangeFiltersContingency}
                    />
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancel} variant="text">
                    <FormattedMessage id="cancel" />
                </Button>
                <Button
                    disabled={btnSaveListDisabled}
                    onClick={handleClick}
                    variant="outlined"
                >
                    <FormattedMessage id="save" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

FormContingencyDialog.propTypes = {
    listId: PropTypes.string.isRequired,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
};

export default FormContingencyDialog;
