/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import NameWrapper from './name-wrapper';
import { ElementType } from 'utils/elementType';

/**
 * Dialog to copy a filters contingency list to a script contingency list or a filter to a script
 * @param id id of list or filter to edit
 * @param open Is the dialog open ?
 * @param onClose Event to close the dialog
 * @param onClick Function to call to perform copy
 * @param currentName Name before renaming
 * @param title Title of the dialog
 */
const CopyToScriptDialog = ({
    id,
    open,
    onClose,
    onClick,
    currentName,
    title,
}) => {
    const [newNameValue, setNewNameValue] = useState(currentName);
    const [isValidName, setIsValidName] = useState(false);

    const updateNameValue = (isValid, newName) => {
        setIsValidName(isValid);
        setNewNameValue(newName);
    };
    const handleClick = () => {
        onClick(id, newNameValue);
    };

    const handleClose = () => {
        onClose();
    };

    useEffect(() => {
        setNewNameValue(currentName || '');
    }, [currentName]);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="dialog-title-rename"
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <NameWrapper
                    initialValue={currentName}
                    titleMessage={'newNameList'}
                    contentType={ElementType.CONTINGENCY_LIST}
                    handleNameValidation={updateNameValue}
                    autoFocus
                />
                <br />
                <br />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>
                    <FormattedMessage id="cancel" />
                </Button>
                <Button
                    onClick={handleClick}
                    variant="outlined"
                    disabled={!isValidName}
                >
                    <FormattedMessage id="validate" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

CopyToScriptDialog.propTypes = {
    id: PropTypes.string.isRequired,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired,
    currentName: PropTypes.string,
    title: PropTypes.string.isRequired,
};

export default CopyToScriptDialog;
