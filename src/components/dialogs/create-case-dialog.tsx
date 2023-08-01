/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FormattedMessage, useIntl } from 'react-intl';
import {
    DialogTitle,
    Dialog,
    DialogContent,
    DialogActions,
    Button,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import TextFieldInput from './commons/text-field-input';
import Alert from '@mui/material/Alert';
import { useDispatch, useSelector } from 'react-redux';
import { keyGenerator } from '../../utils/functions';
import { createCase } from '../../utils/rest-api';
import { HTTP_UNPROCESSABLE_ENTITY_STATUS } from '../../utils/UIconstants';
import {
    addUploadingElement,
    removeUploadingElement,
} from '../../redux/actions';
import UploadNewCase from './commons/upload-new-case';
import { ElementType } from '../../utils/elementType';

import { useSnackMessage } from '@gridsuite/commons-ui';
import { NameCheckReturn, useNameCheck } from './commons/useNameCheck';

const MAX_FILE_SIZE_IN_MO = 100;
const MAX_FILE_SIZE_IN_BYTES = MAX_FILE_SIZE_IN_MO * 1024 * 1024;

interface CreateCaseDialogProps {
    onClose: () => void;
    open: boolean;
}

const CreateCaseDialog: React.FC<CreateCaseDialogProps> = ({
    onClose,
    open,
}) => {
    const intl = useIntl();
    const dispatch = useDispatch();
    const { snackError } = useSnackMessage();

    const [isCreationAllowed, setIsCreationAllowed] = useState(false);
    const [caseName, setCaseName] = useState<string>('');
    const [caseFile, setCaseFile] = useState<File | null>(null);
    const [caseFileError, setCaseFileError] = useState<string>('');
    const [caseNameChanged, setCaseNameChanged] = useState(false);
    const [description, setDescription] = useState<string>('');

    const activeDirectory = useSelector((state: any) => state.activeDirectory);
    const userId = useSelector((state: any) => state.user.profile.sub);

    const handleCloseDialog = () => {
        setCaseFile(null);
        onClose();
    };

    const handleCreateNewCase = () => {
        const uploadingCase = {
            id: keyGenerator(),
            elementName: caseName,
            directory: activeDirectory,
            type: 'CASE',
            owner: userId,
            lastModifiedBy: userId,
            uploading: true,
        };

        createCase({
            name: caseName,
            description,
            file: caseFile,
            parentDirectoryUuid: activeDirectory,
        })
            .then(() => {
                onClose();
            })
            .catch((err) => {
                if (err?.status === HTTP_UNPROCESSABLE_ENTITY_STATUS) {
                    snackError({
                        messageId: 'invalidFormatOrName',
                        headerId: 'caseCreationError',
                        // @ts-ignore
                        headerValues: { caseName },
                    });
                } else {
                    snackError({
                        messageTxt: err?.message,
                        headerId: 'caseCreationError',
                        // @ts-ignore
                        headerValues: { caseName },
                    });
                }
            })
            .finally(() => dispatch(removeUploadingElement(uploadingCase)));
        dispatch(addUploadingElement(uploadingCase));
    };

    const handleCaseFileUpload = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        event.preventDefault();
        setCaseFileError('');
        const files = event.target.files;
        if (files?.length) {
            const currentFile = files[0];

            if (currentFile.size <= MAX_FILE_SIZE_IN_BYTES) {
                setCaseFile(currentFile);
                const { name: caseFileName } = currentFile;

                if (caseFileName) {
                    setCaseName(
                        caseFileName.substring(0, caseFileName.indexOf('.'))
                    );
                }
            } else {
                setCaseFileError(
                    intl
                        .formatMessage(
                            {
                                id: 'uploadFileExceedingLimitSizeErrorMsg',
                            },
                            {
                                maxSize: MAX_FILE_SIZE_IN_MO,
                                br: <br />,
                            }
                        )
                        .toString()
                );
            }
        }
    };

    const [
        caseFileAdornment,
        caseNameError,
        caseNameChecking,
    ]: NameCheckReturn = useNameCheck({
        name: caseName,
        nameChanged: caseNameChanged,
        activeDirectory,
        elementType: ElementType.CASE,
    });

    useEffect(() => {
        setIsCreationAllowed(
            !!caseFile && !caseNameError && !caseNameChecking && !caseFileError
        );
    }, [caseFile, caseFileError, caseNameChecking, caseNameError]);

    return (
        <Dialog
            fullWidth={true}
            open={open}
            onClose={handleCloseDialog}
            aria-labelledby="create-case-form-dialog-title"
        >
            <DialogTitle id="create-case-form-dialog-title">
                <FormattedMessage id="ImportNewCase" />
            </DialogTitle>
            <DialogContent>
                <TextFieldInput
                    label={'nameProperty'}
                    value={caseName}
                    setValue={setCaseName}
                    error={!!caseFileError}
                    autoFocus
                    adornment={caseFileAdornment}
                    setValueHasChanged={setCaseNameChanged}
                />
                <TextFieldInput
                    label={'descriptionProperty'}
                    value={description}
                    setValue={setDescription}
                />
                {caseNameError && (
                    <Alert severity="error">{caseNameError}</Alert>
                )}
                {caseFileError && (
                    <Alert severity="error">{caseFileError}</Alert>
                )}
                <UploadNewCase
                    caseFile={caseFile}
                    handleCaseFileUpload={handleCaseFileUpload}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseDialog} variant="text">
                    <FormattedMessage id="cancel" />
                </Button>
                <Button
                    onClick={handleCreateNewCase}
                    disabled={!isCreationAllowed}
                    variant="outlined"
                >
                    <FormattedMessage id="validate" />
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateCaseDialog;
