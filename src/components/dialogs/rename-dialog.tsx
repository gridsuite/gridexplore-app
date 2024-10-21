/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { FormattedMessage, useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { CancelButton, ElementType } from '@gridsuite/commons-ui';
import { SyntheticEvent } from 'react';
import { useNameField } from './field-hook';
import { AppState } from '../../redux/types';

export interface RenameDialogProps {
    open: boolean;
    onClose: (e?: unknown, nextSelectedDirectoryId?: string | null) => void;
    onClick: (newName: string) => void;
    title: string;
    message: string;
    currentName: string;
    type: ElementType;
    error?: string;
    parentDirectory?: string | null;
}

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
export default function RenameDialog({
    open,
    onClose,
    onClick,
    title,
    message,
    currentName,
    type,
    error,
    parentDirectory,
}: Readonly<RenameDialogProps>) {
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    const intl = useIntl();

    const [newName, newNameField, newNameError, newNameOk] = useNameField({
        label: message,
        autoFocus: true,
        active: open,
        defaultValue: currentName,
        // if current element is directory, activeDirectory is current element
        parentDirectoryId: type === ElementType.DIRECTORY ? parentDirectory : activeDirectory,
        elementType: type,
        alreadyExistingErrorMessage: intl.formatMessage({
            id: 'nameAlreadyUsed',
        }),
        style: { width: '90%' },
    });

    const handleClick = () => {
        if (currentName !== newName) {
            console.debug(`Request for renaming : ${currentName} => ${newName}`);
            onClick(newName);
        } else {
            onClose();
        }
    };

    const handleClose = (_: SyntheticEvent, reason?: string) => {
        if (reason === 'backdropClick') {
            return;
        }
        onClose();
    };

    return (
        <Dialog fullWidth open={open} onClose={handleClose} aria-labelledby="dialog-title-rename">
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                {newNameField}
                <br />
                <br />
                {newNameError && <Alert severity="error">{newNameError}</Alert>}
                {error && <Alert severity="error">{error}</Alert>}
            </DialogContent>
            <DialogActions>
                <CancelButton onClick={handleClose} />
                <Button onClick={handleClick} disabled={!newNameOk} variant="outlined">
                    <FormattedMessage id="validate" />
                </Button>
            </DialogActions>
        </Dialog>
    );
}
