/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { SyntheticEvent } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import { FormattedMessage } from 'react-intl';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import { ElementType } from '@gridsuite/commons-ui';
import { useNameField } from './field-hook';
import { CancelButton } from '@gridsuite/commons-ui';
import { FunctionComponent } from 'react';

interface CreateDirectoryDialogProps {
    open: boolean;
    onClose: () => void;
    onClick: (newName: string) => void;
    title: string;
    parentDirectory?: string;
    error: string;
}

/**
 * Dialog to create a directory
 * @param {Boolean} open Is the dialog open ?
 * @param {EventListener} onClose Event to close the dialog
 * @param {EventListener} onClick Event to submit the deletion
 * @param {String} title Title of the dialog
 * @param {String} message Message of the dialog
 */
export const CreateDirectoryDialog: FunctionComponent<CreateDirectoryDialogProps> = ({
    open,
    onClose,
    onClick,
    title,
    parentDirectory,
    error,
}) => {
    const [name, nameField, nameError, nameOk] = useNameField({
        label: 'nameProperty',
        autoFocus: true,
        elementType: ElementType.DIRECTORY,
        parentDirectoryId: parentDirectory,
        active: open,
        style: {
            width: '90%',
        },
    });

    const handleClose = (_: SyntheticEvent, reason?: string) => {
        if (reason === 'backdropClick') {
            return;
        }
        onClose();
    };

    const handleClick = () => {
        onClick(name);
    };

    const canCreate = () => {
        return nameOk;
    };

    return (
        <Dialog fullWidth={true} open={open} onClose={handleClose} aria-labelledby="dialog-title-delete">
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                {nameField}
                <br />
                {nameError && <Alert severity="error">{nameError}</Alert>}
                {error !== '' && <Alert severity="error">{error}</Alert>}
            </DialogContent>
            <DialogActions>
                <CancelButton onClick={handleClose} />
                <Button disabled={!canCreate()} onClick={handleClick} variant="outlined">
                    <FormattedMessage id="validate" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};
export default CreateDirectoryDialog;
