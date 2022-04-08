/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useEffect, useReducer, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Alert from '@mui/material/Alert';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { useNameField } from './field-hook';
import { useSelector } from 'react-redux';
import { ElementType } from '../../utils/elementType';

/**
 * Dialog to rename an element
 * @param {Boolean} open Is the dialog open ?
 * @param {EventListener} onClose Event to close the dialog
 * @param {EventListener} onClick Event to submit the renaming
 * @param {String} title Title of the dialog
 * @param {String} message Message of the dialog
 * @param {String} currentName Name before renaming
 * @param {String} error Error message
 */
const RenameDialog = ({
    open,
    onClose,
    onClick,
    title,
    message,
    currentName,
    type,
    error,
    parentDirectory,
}) => {
    const activeDirectory = useSelector((state) => state.activeDirectory);
    const intl = useIntl();

    const initialState = {
        nameFieldType: '',
        nameFieldDirectoryId: '',
        defaultNameFieldValue: '',
        triggerReset: false,
    };

    // Props passed to the nameField are only updated when the dialog is closed or opened to avoid requests to be made when Dialogs is closed
    const [state, dispatch] = useReducer((lastState, action) => {
        switch (action.type) {
            case 'OPEN_DIALOG':
                return {
                    ...lastState,
                    defaultNameFieldValue: currentName,
                    nameFieldDirectoryId:
                        type === ElementType.DIRECTORY
                            ? parentDirectory
                            : activeDirectory,
                    nameFieldType: type,
                };
            case 'CLOSE_DIALOG':
                return {
                    ...lastState,
                    defaultNameFieldValue: currentName,
                    triggerReset: !lastState.triggerReset,
                };
            default:
                return {
                    ...lastState,
                };
        }
    }, initialState);

    const [newName, newNameField, newNameError, newNameOk] = useNameField({
        label: message,
        autoFocus: true,
        triggerReset: state.triggerReset,
        defaultValue: state.defaultNameFieldValue,
        directoryId: state.nameFieldDirectoryId,
        elementType: state.nameFieldType,
        alreadyExistingErrorMessage: intl.formatMessage({
            id: 'nameAlreadyUsed',
        }),
    });

    const handleClick = () => {
        if (currentName !== newName) {
            console.debug(
                'Request for renaming : ' + currentName + ' => ' + newName
            );
            onClick(newName);
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        onClose();
    };

    const handleKeyPressed = (event) => {
        if (open && event.key === 'Enter' && canRename()) {
            handleClick();
        }
    };

    const canRename = () => {
        return newNameOk;
    };

    useEffect(() => {
        //Initialisation des paramètres par défaut du useNameField uniquement lorsque la modale est ouverte, quand elle est fermée, on repasse à une valeur vide pour le defaultValue
        if (open) {
            dispatch({ type: 'OPEN_DIALOG' });
        } else {
            dispatch({ type: 'CLOSE_DIALOG' });
        }
    }, [open]);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="dialog-title-rename"
            onKeyPress={handleKeyPressed}
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                {newNameField}
                <br />
                <br />
                {newNameError && <Alert severity="error">{newNameError}</Alert>}
                {error && <Alert severity="error">{error}</Alert>}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>
                    <FormattedMessage id="cancel" />
                </Button>
                <Button
                    onClick={handleClick}
                    disabled={!canRename()}
                    variant="outlined"
                >
                    <FormattedMessage id="rename" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

RenameDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    error: PropTypes.string.isRequired,
    currentName: PropTypes.string,
    tye: PropTypes.string,
    parentDirectory: PropTypes.string,
};

export default RenameDialog;
