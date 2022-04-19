/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import Dialog from '@mui/material/Dialog';
import React, { useEffect } from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';

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
    error,
}) => {
    const [newNameValue, setNewNameValue] = React.useState(currentName);

    const updateNameValue = (event) => {
        setNewNameValue(event.target.value);
    };

    const handleClick = () => {
        if (currentName !== newNameValue) {
            console.debug(
                'Request for renaming : ' + currentName + ' => ' + newNameValue
            );
            onClick(newNameValue);
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        setNewNameValue(currentName);
        onClose();
    };

    const handleKeyPressed = (event) => {
        if (open && event.key === 'Enter') {
            handleClick();
        }
    };

    useEffect(() => {
        setNewNameValue(currentName || '');
    }, [currentName]);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="dialog-title-rename"
            onKeyPress={handleKeyPressed}
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <InputLabel htmlFor="newName">{message}</InputLabel>
                <TextField
                    autoFocus
                    value={newNameValue}
                    required={true}
                    onChange={updateNameValue}
                />
                <br />
                <br />
                {error !== '' && <Alert severity="error">{error}</Alert>}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>
                    <FormattedMessage id="cancel" />
                </Button>
                <Button onClick={handleClick} variant="outlined">
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
};

export default RenameDialog;
