/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import Alert from '@material-ui/lab/Alert';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import { ElementType } from '../../utils/elementType';
import { useFileValue, useNameField, useTextValue } from './field-hook';
import { createCase } from '../../utils/rest-api';
import { useSnackbarMessage } from '../../utils/messages';

export function CreateCaseDialog({ onClose, open }) {
    const activeDirectory = useSelector((state) => state.activeDirectory);

    const [triggerReset, setTriggerReset] = useState(true);

    const [name, nameField, nameError, nameOk] = useNameField({
        label: 'CaseName',
        autoFocus: true,
        elementType: ElementType.CASE,
        directoryId: activeDirectory,
        triggerReset,
    });

    const [description, DescriptionField] = useTextValue({
        label: 'CaseDescriptionOptional',
    });
    const [file, FileField] = useFileValue({ label: 'Case' });

    function validate() {
        return file && nameOk;
    }

    const snackbarMessage = useSnackbarMessage();

    const handleCreateNewStudy = () => {
        if (!validate()) return;
        createCase({
            name,
            description,
            file,
            parentDirectoryUuid: activeDirectory,
        })
            .then()
            .catch((message) => {
                snackbarMessage(message, 'caseCreationError', { name });
            });
        handleCloseDialog();
    };

    const handleKeyPressed = (event) => {
        if (event.key === 'Enter') {
            handleCreateNewStudy(name, file);
        }
    };

    const handleCloseDialog = () => {
        setTriggerReset((oldVal) => !oldVal);
        onClose();
    };

    return (
        <Dialog
            fullWidth={true}
            open={open}
            onClose={handleCloseDialog}
            aria-labelledby="form-dialog-title"
            onKeyPress={handleKeyPressed}
        >
            <DialogTitle id="form-dialog-title">
                <FormattedMessage id="ImportNewCase" />
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    <FormattedMessage id="createNewStudyDescription" />
                </DialogContentText>
                <div>{nameField}</div>
                {DescriptionField}
                {FileField}
                {nameError && <Alert severity="error">{nameError}</Alert>}
            </DialogContent>
            <DialogActions>
                <Button onClick={() => handleCloseDialog()} variant="text">
                    <FormattedMessage id="cancel" />
                </Button>
                <Button
                    onClick={() => handleCreateNewStudy()}
                    disabled={!validate()}
                    variant="outlined"
                >
                    <FormattedMessage id="create" />
                </Button>
            </DialogActions>
        </Dialog>
    );
}

CreateCaseDialog.propTypes = {
    onClose: PropTypes.func,
    open: PropTypes.bool,
};
