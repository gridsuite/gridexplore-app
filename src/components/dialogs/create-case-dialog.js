/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect, useRef, useState } from 'react';
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
import { useNameField, useTextValue, usePrefillNameField } from './field-hook';
import { createCase } from '../../utils/rest-api';
import { useSnackMessage } from '@gridsuite/commons-ui';
import {
    addUploadingElement,
    removeUploadingElement,
} from '../../redux/actions';
import { keyGenerator } from '../../utils/functions';
import { HTTP_UNPROCESSABLE_ENTITY_STATUS } from '../../utils/UIconstants';
import { UploadCase } from './upload-case';

/**
 * Dialog to create a case
 * @param {Boolean} open Is the dialog open ?
 * @param {EventListener} onClose Event to close the dialog
 */
export function CreateCaseDialog({ onClose, open }) {
    const activeDirectory = useSelector((state) => state.activeDirectory);
    const userId = useSelector((state) => state.user.profile.sub);
    const dispatch = useDispatch();
    const [name, NameField, nameError, nameOk, setCaseName, touched] =
        useNameField({
            label: 'nameProperty',
            autoFocus: true,
            elementType: ElementType.CASE,
            parentDirectoryId: activeDirectory,
            active: open,
            style: {
                width: '90%',
            },
        });

    const [description, DescriptionField] = useTextValue({
        label: 'descriptionProperty',
        style: {
            width: '90%',
        },
    });

    const [providedCaseFile, setProvidedCaseFile] = useState(null);
    const [providedCaseFileOk, setProvidedCaseFileOk] = useState(false);
    const [providedCaseFileError, setProvidedCaseFileError] = useState();

    function validate() {
        return providedCaseFile && nameOk && providedCaseFileOk;
    }

    const { snackError } = useSnackMessage();

    const nameRef = useRef(name);

    useEffect(() => {
        nameRef.current = name;
    }, [name]);

    usePrefillNameField({
        nameRef: nameRef,
        selectedFile: providedCaseFile,
        setValue: setCaseName,
        selectedFileOk: providedCaseFileOk,
        creationError: providedCaseFileError,
        //fileCheckedCase is necessary for a test to succeed but always match providedCaseFileOk in this case since there is no intermediary validation
        fileCheckedCase: providedCaseFileOk,
        touched: touched,
    });

    const handleCreateNewCase = () => {
        if (!validate()) {
            return;
        }
        const uploadingCase = {
            id: keyGenerator(),
            elementName: name,
            directory: activeDirectory,
            type: 'CASE',
            owner: userId,
            lastModifiedBy: userId,
            uploading: true,
        };
        createCase({
            name,
            description,
            file: providedCaseFile,
            parentDirectoryUuid: activeDirectory,
        })
            .then()
            .catch((err) => {
                if (err?.status === HTTP_UNPROCESSABLE_ENTITY_STATUS) {
                    snackError({
                        messageId: 'invalidFormatOrName',
                        headerId: 'caseCreationError',
                        headerValues: { name },
                    });
                } else {
                    snackError({
                        messageTxt: err?.message,
                        headerId: 'caseCreationError',
                        headerValues: { name },
                    });
                }
            })
            .finally(() => dispatch(removeUploadingElement(uploadingCase)));
        dispatch(addUploadingElement(uploadingCase));
        handleCloseDialog();
    };

    const handleCloseDialog = () => {
        setProvidedCaseFile(null);
        onClose();
    };

    return (
        <Dialog
            fullWidth={true}
            open={open}
            onClose={handleCloseDialog}
            aria-labelledby="form-dialog-title"
        >
            <DialogTitle id="form-dialog-title">
                <FormattedMessage id="ImportNewCase" />
            </DialogTitle>
            <DialogContent>
                {NameField}
                {DescriptionField}
                <UploadCase
                    providedCaseFile={providedCaseFile}
                    setProvidedCaseFile={setProvidedCaseFile}
                    setProvidedCaseFileOk={setProvidedCaseFileOk}
                    setProvidedCaseFileError={setProvidedCaseFileError}
                />
                {nameError && <Alert severity="error">{nameError}</Alert>}
                {providedCaseFileError && (
                    <Alert severity="error">{providedCaseFileError}</Alert>
                )}
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
