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
import { NameCheckReturn, useNameCheck } from './commons/use-name-check';
import { FormProvider, useForm } from 'react-hook-form';
import { CASE_FILE, CASE_NAME, DESCRIPTION } from '../utils/field-constants';

const MAX_FILE_SIZE_IN_MO = 100;
const MAX_FILE_SIZE_IN_BYTES = MAX_FILE_SIZE_IN_MO * 1024 * 1024;

interface ICreateCaseDialogProps {
    onClose: () => void;
    open: boolean;
}

const CreateCaseDialog: React.FunctionComponent<ICreateCaseDialogProps> = ({
    onClose,
    open,
}) => {
    const intl = useIntl();
    const dispatch = useDispatch();
    const { snackError } = useSnackMessage();

    const createCaseFormMethods = useForm({
        defaultValues: {
            [CASE_NAME]: '',
            [DESCRIPTION]: '',
            [CASE_FILE]: null,
        },
    });

    const {
        handleSubmit,
        setValue,
        formState: { errors },
        setError,
        watch,
        clearErrors,
    } = createCaseFormMethods;

    const [isCreationAllowed, setIsCreationAllowed] = useState(false);
    const [caseNameChanged, setCaseNameChanged] = useState(false);

    const activeDirectory = useSelector((state: any) => state.activeDirectory);
    const userId = useSelector((state: any) => state.user.profile.sub);

    const caseNameErrorMessage = errors.caseName?.message;
    const caseFileErrorMessage = errors.caseFile?.message;
    const caseName = watch(CASE_NAME);
    const caseFile = watch(CASE_FILE);
    const description = watch(DESCRIPTION);

    const handleCloseDialog = () => {
        setValue(CASE_FILE, null);
        onClose();
    };

    const handleCreateNewCase = ({
        caseName,
        description,
        caseFile,
    }: {
        caseName: string;
        description: string;
        caseFile: File | null;
    }): void => {
        const uploadingCase = {
            id: keyGenerator(),
            elementName: caseName,
            directory: activeDirectory,
            type: ElementType.CASE,
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
        clearErrors(CASE_FILE);
        const files = event.target.files;
        if (files?.length) {
            const currentFile = files[0]!;

            if (currentFile.size <= MAX_FILE_SIZE_IN_BYTES) {
                // @ts-ignore
                setValue(CASE_FILE, currentFile);
                const { name: caseFileName } = currentFile;

                if (caseFileName) {
                    setValue(
                        CASE_NAME,
                        caseFileName.substring(0, caseFileName.indexOf('.'))
                    );
                }
            } else {
                setError(CASE_FILE, {
                    type: 'caseFileSize',
                    message: intl
                        .formatMessage(
                            {
                                id: 'uploadFileExceedingLimitSizeErrorMsg',
                            },
                            {
                                maxSize: MAX_FILE_SIZE_IN_MO,
                                br: <br />,
                            }
                        )
                        .toString(),
                });
            }
        }
    };

    const [caseFileAdornment, caseNameChecking]: NameCheckReturn = useNameCheck(
        {
            field: CASE_NAME,
            name: caseName,
            nameChanged: caseNameChanged,
            elementType: ElementType.CASE,
            setError,
            clearErrors,
        }
    );

    useEffect(() => {
        setIsCreationAllowed(
            !!caseFile &&
                !caseNameErrorMessage &&
                !caseNameChecking &&
                !caseFileErrorMessage
        );
    }, [
        caseFile,
        caseNameErrorMessage,
        caseNameChecking,
        caseFileErrorMessage,
    ]);

    return (
        <FormProvider {...createCaseFormMethods}>
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
                        setValue={(newValue) => setValue(CASE_NAME, newValue)}
                        error={caseNameErrorMessage}
                        autoFocus
                        adornment={caseFileAdornment}
                        setValueHasChanged={setCaseNameChanged}
                    />
                    <TextFieldInput
                        label={'descriptionProperty'}
                        value={description}
                        setValue={(newValue) => setValue(DESCRIPTION, newValue)}
                    />
                    {caseFileErrorMessage && (
                        <Alert severity="error">{caseFileErrorMessage}</Alert>
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
                        onClick={handleSubmit(handleCreateNewCase)}
                        disabled={!isCreationAllowed}
                        variant="outlined"
                    >
                        <FormattedMessage id="validate" />
                    </Button>
                </DialogActions>
            </Dialog>
        </FormProvider>
    );
};

export default CreateCaseDialog;
