/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Alert from '@mui/material/Alert';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { FormattedMessage, useIntl } from 'react-intl';
import { useNameField } from './field-hook';
import { useSelector } from 'react-redux';
import { ElementType } from '@gridsuite/commons-ui';
import { CancelButton } from '@gridsuite/commons-ui';
import { FunctionComponent } from 'react';
import { AppState } from 'redux/reducer';

interface RenameDialogProps {
    open: boolean;
    onClose: () => void;
    onClick: (newName: string) => void;
    title: string;
    message: string;
    currentName: string;
    type: ElementType;
    error?: string;
    parentDirectory?: string;
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
const RenameDialog: FunctionComponent<RenameDialogProps> = ({
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
    const activeDirectory = useSelector(
        (state: AppState) => state.activeDirectory
    );
    const intl = useIntl();

    const [newName, newNameField, newNameError, newNameOk] = useNameField({
        label: message,
        autoFocus: true,
        active: open,
        defaultValue: currentName,
        // if current element is directory, activeDirectory is current element
        parentDirectoryId:
            type === ElementType.DIRECTORY ? parentDirectory : activeDirectory,
        elementType: type,
        alreadyExistingErrorMessage: intl.formatMessage({
            id: 'nameAlreadyUsed',
        }),
        style: { width: '90%' },
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

    const canRename = () => {
        return newNameOk;
    };

    return (
        <Dialog
            fullWidth={true}
            open={open}
            onClose={handleClose}
            aria-labelledby="dialog-title-rename"
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
                <CancelButton onClick={handleClose} />
                <Button
                    onClick={handleClick}
                    disabled={!canRename()}
                    variant="outlined"
                >
                    <FormattedMessage id="validate" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RenameDialog;
