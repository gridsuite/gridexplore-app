/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import Dialog from '@mui/material//Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Alert from '@mui/material/Alert';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { ElementType } from '../../utils/elementType';
import { useFileValue, useNameField, useTextValue } from './field-hook';
import { createCase } from '../../utils/rest-api';
import { useSnackbarMessage } from '../../utils/messages';
import {
    addUploadingElement,
    removeUploadingElement,
} from '../../redux/actions';
import { keyGenerator } from '../../utils/functions';

/**
 * Dialog to create a case
 * @param {Boolean} open Is the dialog open ?
 * @param {EventListener} onClose Event to close the dialog
 */
export function CreateCaseDialog({ onClose, open }) {
    const activeDirectory = useSelector((state) => state.activeDirectory);
    const userId = useSelector((state) => state.user.profile.sub);
    const dispatch = useDispatch();
    const [triggerReset, setTriggerReset] = useState(true);

    const [name, NameField, nameError, nameOk] = useNameField({
        label: 'nameProperty',
        autoFocus: true,
        elementType: ElementType.CASE,
        parentDirectoryId: activeDirectory,
        triggerReset,
        active: open,
        style: {
            width: '90%',
        },
    });

    const [description, DescriptionField] = useTextValue({
        label: 'descriptionProperty',
        triggerReset,
        style: {
            width: '90%',
        },
    });
    const [file, FileField, fileError, isFileOk] = useFileValue({
        label: 'Case',
        triggerReset,
    });

    function validate() {
        return file && nameOk && isFileOk;
    }

    const snackbarMessage = useSnackbarMessage();

    const handleCreateNewCase = () => {
        if (!validate()) return;
        const uploadingCase = {
            id: keyGenerator(),
            elementName: name,
            directory: activeDirectory,
            type: 'CASE',
            owner: userId,
            uploading: true,
        };
        createCase({
            name,
            description,
            file,
            parentDirectoryUuid: activeDirectory,
        })
            .then()
            .catch((message) => {
                snackbarMessage(message, 'caseCreationError', { name });
            })
            .finally(() => dispatch(removeUploadingElement(uploadingCase)));
        dispatch(addUploadingElement(uploadingCase));
        handleCloseDialog();
    };

    const handleKeyPressed = (event) => {
        if (event.key === 'Enter') {
            handleCreateNewCase(name, file);
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
                {NameField}
                {DescriptionField}
                {FileField}
                {nameError && <Alert severity="error">{nameError}</Alert>}
                {fileError && <Alert severity="error">{fileError}</Alert>}
            </DialogContent>
            <DialogActions>
                <Button onClick={() => handleCloseDialog()} variant="text">
                    <FormattedMessage id="cancel" />
                </Button>
                <Button
                    onClick={handleCreateNewCase}
                    disabled={!validate()}
                    variant="outlined"
                >
                    <FormattedMessage id="validate" />
                </Button>
            </DialogActions>
        </Dialog>
    );
}

CreateCaseDialog.propTypes = {
    onClose: PropTypes.func,
    open: PropTypes.bool,
};
