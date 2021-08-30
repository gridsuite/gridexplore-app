/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useEffect } from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import InputLabel from '@material-ui/core/InputLabel';
import TextField from '@material-ui/core/TextField';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { newScriptFromFiltersContingencyList } from '../../utils/rest-api';
import { useSelector } from 'react-redux';

/**
 * Dialog to copy a filters contingency list to a script contingency list
 * @param listId id of list to edit
 * @param open Is the dialog open ?
 * @param onClose Event to close the dialog
 * @param onError handle errors
 * @param currentName Name before renaming
 * @param title Title of the dialog
 */
const ContingencyCopyToScriptDialog = ({
    listId,
    open,
    onClose,
    onError,
    currentName,
    title,
}) => {
    const [newNameValue, setNewNameValue] = React.useState(currentName);
    const selectedDirectory = useSelector((state) => state.selectedDirectory);

    const updateNameValue = (event) => {
        setNewNameValue(event.target.value);
    };

    const handleClick = () => {
        newScriptFromFiltersContingencyList(
            listId,
            newNameValue,
            selectedDirectory
        )
            .then((response) => {})
            .catch((error) => {
                onError(error.message);
            });
        onClose();
    };

    const handleClose = () => {
        onClose();
    };

    const handleExited = () => {
        setNewNameValue(currentName);
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
            onExited={handleExited}
            aria-labelledby="dialog-title-rename"
            onKeyPress={handleKeyPressed}
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <InputLabel htmlFor="newName">
                    <FormattedMessage id="newNameList" />
                </InputLabel>
                <TextField
                    autoFocus
                    value={newNameValue}
                    required={true}
                    onChange={updateNameValue}
                />
                <br />
                <br />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} variant="text">
                    <FormattedMessage id="cancel" />
                </Button>
                <Button onClick={handleClick} variant="outlined">
                    <FormattedMessage id="copy" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

ContingencyCopyToScriptDialog.propTypes = {
    listId: PropTypes.string.isRequired,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
    currentName: PropTypes.string,
    title: PropTypes.string.isRequired,
};

export default ContingencyCopyToScriptDialog;
