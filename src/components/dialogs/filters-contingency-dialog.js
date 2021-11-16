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
import FiltersEditor from '../filters-editor';
import { EquipmentTypes } from '../../utils/equipment-types';
import { makeStyles } from '@material-ui/core/styles';
import {
    getContingencyList,
    saveFiltersContingencyList,
} from '../../utils/rest-api';
import { contingencyListSubtype } from '../../utils/elementType';

const emptyFiltersContingency = {
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
 * Dialog to edit a filters contingency list
 * @param listId id of list to edit
 * @param open Is the dialog open ?
 * @param onClose Event to close the dialog
 * @param onError handle errors
 * @param title Title of the dialog
 */
const FiltersContingencyDialog = ({
    listId,
    open,
    onClose,
    onError,
    title,
}) => {
    const classes = useStyles();
    const [btnSaveListDisabled, setBtnSaveListDisabled] = useState(true);
    const [currentFiltersContingency, setCurrentFiltersContingency] =
        useState(null);
    const [newFiltersContingency, setNewFiltersContingency] = useState(
        emptyFiltersContingency
    );

    const handleClose = () => {
        handleCancel();
    };

    const handleCancel = () => {
        setNewFiltersContingency(currentFiltersContingency);
        setBtnSaveListDisabled(true);
        onClose();
    };

    const handleClick = () => {
        let newFiltersContingencyList = {
            ...currentFiltersContingency,
            ...newFiltersContingency,
            id: listId,
        };
        saveFiltersContingencyList(newFiltersContingencyList)
            .then((response) => {})
            .catch((error) => {
                onError(error.message);
            });
        onClose();
        setCurrentFiltersContingency(newFiltersContingencyList);
    };

    const getCurrentContingencyList = useCallback(
        (currentItemId) => {
            getContingencyList(contingencyListSubtype.FILTERS, currentItemId)
                .then((data) => {
                    if (data) {
                        setCurrentFiltersContingency(data);
                        setNewFiltersContingency(data);
                    }
                })
                .catch((error) => {
                    onError(error.message);
                });
        },
        [onError]
    );

    useEffect(() => {
        // get contingency list
        getCurrentContingencyList(listId);
    }, [listId, getCurrentContingencyList]);

    function onChangeFiltersContingency(newFiltersContingency) {
        if (currentFiltersContingency !== null) {
            if (
                newFiltersContingency.equipmentID !==
                    currentFiltersContingency.equipmentID ||
                newFiltersContingency.equipmentName !==
                    currentFiltersContingency.equipmentName ||
                newFiltersContingency.equipmentType !==
                    currentFiltersContingency.equipmentType ||
                newFiltersContingency.nominalVoltageOperator !==
                    currentFiltersContingency.nominalVoltageOperator ||
                newFiltersContingency.nominalVoltage !==
                    currentFiltersContingency.nominalVoltage + '' ||
                newFiltersContingency.countries.sort().join(',') !==
                    currentFiltersContingency.countries.sort().join(',')
            ) {
                setBtnSaveListDisabled(false);
            } else {
                setBtnSaveListDisabled(true);
            }
        } else {
            setBtnSaveListDisabled(false);
        }
        setNewFiltersContingency(newFiltersContingency);
    }

    return (
        <Dialog
            classes={{ paper: classes.dialogPaper }}
            open={open}
            onClose={handleClose}
            aria-labelledby="dialog-title-filters-contingency-edit"
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <div className={classes.filtersEditor}>
                    <FiltersEditor
                        filters={newFiltersContingency}
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

FiltersContingencyDialog.propTypes = {
    listId: PropTypes.string.isRequired,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
};

export default FiltersContingencyDialog;
