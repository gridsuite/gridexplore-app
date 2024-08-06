/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { FormattedMessage } from 'react-intl';
import { CancelButton } from '@gridsuite/commons-ui';
import { FunctionComponent } from 'react';

interface ReplaceWithScriptDialogProps {
    id: string;
    open: boolean;
    onClose: () => void;
    onClick: (id: string) => void;
    title: string;
}

/**
 * Dialog to replace a filters contingency list with a script contingency list or a filter with a script
 * @param id id of list or filter to replace
 * @param open Is the dialog open ?
 * @param onClose Event to close the dialog
 * @param onClick Function to call to perform rename
 * @param title Title of the dialog
 */
const ReplaceWithScriptDialog: FunctionComponent<ReplaceWithScriptDialogProps> = ({
    id,
    open,
    onClose,
    onClick,
    title,
}) => {
    const handleClose = (): void => {
        onClose();
    };

    const handleClick = (): void => {
        onClick(id);
    };

    return (
        <Dialog open={open} onClose={handleClose} aria-labelledby="dialog-title-replace-with-script">
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    <FormattedMessage id="alertBeforeReplaceWithScript" values={{ br: <br /> }} />
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <CancelButton onClick={handleClose} />
                <Button onClick={handleClick} variant="outlined">
                    <FormattedMessage id="button.replace" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReplaceWithScriptDialog;
