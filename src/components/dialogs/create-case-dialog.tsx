/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useIntl } from 'react-intl';
import React, { useEffect, useState } from 'react';
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
import { useForm } from 'react-hook-form';
import { CASE_FILE, CASE_NAME, DESCRIPTION } from '../utils/field-constants';
import { ErrorInput, TextInput, FieldErrorAlert } from '@gridsuite/commons-ui';
import yup from '../utils/yup-config';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import CustomMuiDialog from './custom-mui-dialog';
import Box from '@mui/material/Box';

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

    const schema = yup.object().shape({
        [CASE_NAME]: yup.string().required(),
        [DESCRIPTION]: yup.string(),
        [CASE_FILE]: yup.mixed(),
    });
    const createCaseFormMethods = useForm<{
        [CASE_NAME]: string;
        [DESCRIPTION]: string;
        [CASE_FILE]: File | null;
    }>({
        mode: 'onChange',
        defaultValues: {
            [CASE_NAME]: '',
            [DESCRIPTION]: '',
            [CASE_FILE]: null,
        },
        resolver: yupResolver(schema),
    });

    const {
        setValue,
        formState: { errors },
        setError,
        watch,
        clearErrors,
    } = createCaseFormMethods;

    const [isCreationAllowed, setIsCreationAllowed] = useState(false);

    const activeDirectory = useSelector((state: any) => state.activeDirectory);
    const userId = useSelector((state: any) => state.user.profile.sub);

    const caseNameErrorMessage = errors.caseName?.message;
    const caseFileErrorMessage = errors.caseFile?.message;
    const caseName = watch(CASE_NAME);
    const caseFile = watch(CASE_FILE);

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

    // @ts-ignore
    return (
        <CustomMuiDialog
            titleId={'ImportNewCase'}
            formSchema={schema}
            formMethods={createCaseFormMethods}
            removeOptional={true}
            open={open}
            onClose={handleCloseDialog}
            onSave={handleCreateNewCase}
            disabledSave={!isCreationAllowed}
        >
            <Box sx={{ margin: '10px 0' }}>
                <TextInput
                    label={'nameProperty'}
                    name={CASE_NAME}
                    customAdornment={caseFileAdornment}
                    inputProps={{
                        autoFocus: true,
                    }}
                />
            </Box>
            <Box sx={{ margin: '10px 0' }}>
                <TextInput name={DESCRIPTION} label={'descriptionProperty'} />
            </Box>
            <ErrorInput name={CASE_FILE} InputField={FieldErrorAlert} />
            <UploadNewCase
                caseFile={caseFile}
                handleCaseFileUpload={handleCaseFileUpload}
            />
        </CustomMuiDialog>
    );
};

export default CreateCaseDialog;
