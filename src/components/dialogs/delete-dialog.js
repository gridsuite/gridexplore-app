/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import Alert from '@material-ui/lab/Alert';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * Dialog to delete an element
 * @param {Boolean} open Is the dialog open ?
 * @param {EventListener} onClose Event to close the dialog
 * @param {EventListener} onClick Event to submit the deletion
 * @param {String} title Title of the dialog
 * @param {Object} message Message of the dialog
 * @param {String} error Error message
 */
const DeleteDialog = ({ open, onClose, onClick, title, message, error }) => {
    const handleClose = () => {
        onClose();
    };

    const handleClick = () => {
        console.debug('Request for deletion');
        onClick();
    };

    const handleKeyPressed = (event) => {
        if (open && event.key === 'Enter') {
            handleClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="dialog-title-delete"
            onKeyPress={handleKeyPressed}
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText>{message}</DialogContentText>
                {error !== '' && <Alert severity="error">{error}</Alert>}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} variant="outlined">
                    <FormattedMessage id="cancel" />
                </Button>
                <Button onClick={handleClick} variant="text">
                    <FormattedMessage id="delete" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

DeleteDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.object.isRequired,
    error: PropTypes.string.isRequired,
};

export default DeleteDialog;
