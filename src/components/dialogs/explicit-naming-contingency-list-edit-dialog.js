/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import React, { useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import Alert from '@mui/material/Alert';
import PropTypes from 'prop-types';

import makeStyles from '@mui/styles/makeStyles';
import ExplicitNamingContingencyListDialogContent from './explicit-naming-contingency-list-content';
import { saveExplicitNamingContingencyList } from '../../utils/rest-api';
import { prepareContingencyListForBackend } from './contingency-list-helper';

const useStyles = makeStyles((theme) => ({
    dialogPaper: {
        width: 'auto',
        minWidth: '800px',
        minHeight: '600px',
        margin: 'auto',
    },
}));

const ExplicitNamingContingencyListEditDialog = ({
    id,
    open,
    onClose,
    name,
    title,
    isCreation,
}) => {
    const classes = useStyles();

    const [editContingencyListErr, setEditContingencyListErr] =
        React.useState('');
    const [tableValues, setTablesValues] = useState([]);
    const [isUnsavedChanges, setUnsavedChanges] = useState(false);
    const [isExplicitNamingFormClean, setIsExplicitNamingFormClean] =
        useState(true);
    const fetchFilter = useRef(null);
    fetchFilter.current = open && !isCreation;
    const [nameValue, setNameValue] = useState('');

    const onChangeHandler = (
        tableValues,
        isEdited,
        isDragged,
        isClean,
        newName
    ) => {
        setTablesValues(tableValues);
        setEditContingencyListErr('');
        setUnsavedChanges(isEdited);
        setIsExplicitNamingFormClean(isClean);
        setNameValue(newName);
        if (isDragged) {
            setUnsavedChanges(true);
        }
    };

    const isFormValidationAllowed = () => {
        return (
            (tableValues &&
                tableValues.length > 0 &&
                editContingencyListErr === '' &&
                isUnsavedChanges &&
                isExplicitNamingFormClean) ||
            nameValue !== ''
        );
    };

    const handleEditContingencyList = () => {
        if (!isFormValidationAllowed()) {
            return;
        }
        saveExplicitNamingContingencyList({
            ...prepareContingencyListForBackend(id, name, tableValues),
            name: nameValue,
        })
            .then(() => {
                setUnsavedChanges(false);
                onClose();
            })
            .catch((error) => {
                setEditContingencyListErr(error.message);
            });
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        }
    };

    return (
        <Dialog
            classes={{ paper: classes.dialogPaper }}
            fullWidth={true}
            open={open}
            onClose={handleClose}
            scroll="body"
        >
            <DialogTitle onClose={onClose}>{title}</DialogTitle>
            <DialogContent style={{ overflow: 'hidden' }}>
                <ExplicitNamingContingencyListDialogContent
                    id={id}
                    open={open}
                    name={name}
                    isCreation={isCreation}
                    onChange={onChangeHandler}
                />
                {editContingencyListErr !== '' && (
                    <Alert severity="error">{editContingencyListErr}</Alert>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>
                    <FormattedMessage id="cancel" />
                </Button>
                <Button
                    variant="outlined"
                    onClick={handleEditContingencyList}
                    disabled={!isFormValidationAllowed()}
                >
                    <FormattedMessage id="validate" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

ExplicitNamingContingencyListEditDialog.prototype = {
    id: PropTypes.string,
    name: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool,
    title: PropTypes.string,
    isCreation: PropTypes.bool,
};

export default ExplicitNamingContingencyListEditDialog;
