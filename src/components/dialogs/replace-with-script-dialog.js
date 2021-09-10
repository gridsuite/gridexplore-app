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
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import { useSelector } from 'react-redux';

/**
 * Dialog to replace a filters contingency list with a script contingency list
 * @param listId id of list to edit
 * @param open Is the dialog open ?
 * @param onClose Event to close the dialog
 * @param onClick Function to call to perform rename
 * @param onError handle errors
 * @param title Title of the dialog
 */
const ReplaceWithScriptDialog = ({
    listId,
    open,
    onClose,
    onClick,
    onError,
    title,
}) => {
    const selectedDirectory = useSelector((state) => state.selectedDirectory);

    const handleClose = () => {
        onClose();
    };

    const handleClick = () => {
        onClick(listId, selectedDirectory)
            .then((response) => {})
            .catch((error) => {
                onError(error.message);
            });
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="dialog-title-replace-with-script"
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    <FormattedMessage
                        id="alertBeforeReplaceWithScript"
                        values={{ br: <br /> }}
                    />
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} variant="outlined">
                    <FormattedMessage id="cancel" />
                </Button>
                <Button onClick={handleClick} variant="text">
                    <FormattedMessage id="replace" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

ReplaceWithScriptDialog.propTypes = {
    listId: PropTypes.string.isRequired,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
};

export default ReplaceWithScriptDialog;
