/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { DialogContentText } from '@mui/material';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { FormattedMessage } from 'react-intl';
import React from 'react';
import { CancelButton } from '@gridsuite/commons-ui';

const PopupConfirmationDialog = ({
    message,
    validateButtonLabel,
    openConfirmationPopup,
    setOpenConfirmationPopup,
    handlePopupConfirmation,
}) => {
    return (
        <Dialog
            open={openConfirmationPopup}
            aria-labelledby="dialog-title-change-equipment-type"
        >
            <DialogTitle id={'dialog-title-change-equipment-type'}>
                {'Confirmation'}
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    <FormattedMessage id={message} />
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <CancelButton onClick={() => setOpenConfirmationPopup(false)} />
                <Button onClick={handlePopupConfirmation} variant="outlined">
                    <FormattedMessage id={validateButtonLabel ?? 'validate'} />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

PopupConfirmationDialog.defaultProps = {
    validateButtonLabel: undefined,
};

export default PopupConfirmationDialog;
