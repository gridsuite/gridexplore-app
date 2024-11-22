/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { SyntheticEvent } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { CancelButton, ElementType } from '@gridsuite/commons-ui';
import { UUID } from 'crypto';
import { useNameField } from './field-hook';

export interface CreateDirectoryDialogProps {
    open: boolean;
    onClose: () => void;
    onClick: (newName: string) => void;
    title: string;
    parentDirectory?: UUID;
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
export default function CreateDirectoryDialog({
    open,
    onClose,
    onClick,
    title,
    parentDirectory,
    error,
}: Readonly<CreateDirectoryDialogProps>) {
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

    return (
        <Dialog fullWidth open={open} onClose={handleClose} aria-labelledby="dialog-title-delete">
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                {nameField}
                <br />
                {nameError && <Alert severity="error">{nameError}</Alert>}
                {error !== '' && <Alert severity="error">{error}</Alert>}
            </DialogContent>
            <DialogActions>
                <CancelButton onClick={handleClose} />
                <Button disabled={!nameOk} onClick={handleClick} variant="outlined">
                    <FormattedMessage id="validate" />
                </Button>
            </DialogActions>
        </Dialog>
    );
}
