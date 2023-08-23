/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useIntl } from 'react-intl';
import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { keyGenerator } from '../../../utils/functions';
import { createCase } from '../../../utils/rest-api';
import { HTTP_UNPROCESSABLE_ENTITY_STATUS } from '../../../utils/UIconstants';
import { Grid } from '@mui/material';
import {
    addUploadingElement,
    removeUploadingElement,
} from '../../../redux/actions';
import UploadNewCase from '../commons/upload-new-case';
import { ElementType } from '../../../utils/elementType';
import { useSnackMessage } from '@gridsuite/commons-ui';
import { NameCheckReturn, useNameCheck } from '../commons/use-name-check';
import { useForm } from 'react-hook-form';
import { CASE_FILE, CASE_NAME, DESCRIPTION } from '../../utils/field-constants';
import { ErrorInput, TextInput, FieldErrorAlert } from '@gridsuite/commons-ui';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import CustomMuiDialog from '../custom-mui-dialog';
import {
    createCaseDialogFormValidationSchema,
    getCreateCaseDialogFormValidationDefaultValues,
} from './create-case-dialog-utils';

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

    const createCaseFormMethods = useForm<{
        [CASE_NAME]: string;
        [DESCRIPTION]: string;
        [CASE_FILE]: File | null;
    }>({
        mode: 'onChange',
        defaultValues: getCreateCaseDialogFormValidationDefaultValues(),
        resolver: yupResolver(createCaseDialogFormValidationSchema),
    });

    const {
        setValue,
        formState: { errors },
        setError,
        getValues,
        clearErrors,
    } = createCaseFormMethods;

    const activeDirectory = useSelector((state: any) => state.activeDirectory);
    const userId = useSelector((state: any) => state.user.profile.sub);

    const caseNameErrorMessage = errors.caseName?.message;
    const caseFileErrorMessage = errors.caseFile?.message;
    const { caseName, caseFile } = getValues();

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
            .then(onClose)
            .catch((err) => {
                if (err?.status === HTTP_UNPROCESSABLE_ENTITY_STATUS) {
                    snackError({
                        messageId: 'invalidFormatOrName',
                        headerId: 'caseCreationError',
                        headerValues: [caseName],
                    });
                } else {
                    snackError({
                        messageTxt: err?.message,
                        headerId: 'caseCreationError',
                        headerValues: [caseName],
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
                setValue(CASE_FILE, currentFile);
                const { name: caseFileName } = currentFile;

                if (caseFileName) {
                    clearErrors(CASE_NAME);
                    setValue(
                        CASE_NAME,
                        caseFileName.substring(0, caseFileName.indexOf('.')),
                        { shouldDirty: true }
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
            elementType: ElementType.CASE,
            setError,
        }
    );

    const isCreationAllowed = useMemo(
        () =>
            !!caseFile &&
            !caseNameErrorMessage &&
            !caseNameChecking &&
            !caseFileErrorMessage,
        [caseFile, caseNameErrorMessage, caseNameChecking, caseFileErrorMessage]
    );

    return (
        <CustomMuiDialog
            titleId={'ImportNewCase'}
            formSchema={createCaseDialogFormValidationSchema}
            formMethods={createCaseFormMethods}
            removeOptional={true}
            open={open}
            onClose={handleCloseDialog}
            onSave={handleCreateNewCase}
            disabledSave={!isCreationAllowed}
        >
            <Grid container spacing={2} marginTop={'auto'} direction="column">
                <Grid item>
                    <TextInput
                        label={'nameProperty'}
                        name={CASE_NAME}
                        customAdornment={caseFileAdornment}
                        formProps={{
                            size: 'medium',
                            autoFocus: true,
                        }}
                    />
                </Grid>
                <Grid item>
                    <TextInput
                        name={DESCRIPTION}
                        label={'descriptionProperty'}
                        formProps={{
                            size: 'medium',
                        }}
                    />
                </Grid>
            </Grid>
            <ErrorInput name={CASE_FILE} InputField={FieldErrorAlert} />
            <UploadNewCase
                caseFile={caseFile}
                handleCaseFileUpload={handleCaseFileUpload}
            />
        </CustomMuiDialog>
    );
};

export default CreateCaseDialog;
