/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ChangeEvent, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import {
    CustomMuiDialog,
    DescriptionField,
    ElementType,
    ErrorInput,
    extractErrorMessageDescriptor,
    FieldConstants,
    FieldErrorAlert,
    isObjectEmpty,
    keyGenerator,
    MAX_CHAR_DESCRIPTION,
    NAME_EMPTY,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { Button, Grid, Input, Stack } from '@mui/material';
import { FieldValues, useController, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { AppState, UploadingElement } from '../../redux/types';
import { importStudy } from '../../utils/rest-api';
import { addUploadingElement, removeUploadingElement } from '../../redux/actions';
import PrefilledNameInput from './commons/prefilled-name-input';

interface ImportStudyDialogProps {
    open: boolean;
    onClose: () => void;
}

interface ImportStudyFormData {
    [FieldConstants.NAME]: string;
    [FieldConstants.DESCRIPTION]: string;
    studyFiles?: FileList;
}

export default function ImportStudyDialog({ open, onClose }: Readonly<ImportStudyDialogProps>) {
    const intl = useIntl();
    const { snackError } = useSnackMessage();
    const dispatch = useDispatch();
    const selectedDirectory = useSelector((state: AppState) => state.selectedDirectory);
    const userId = useSelector((state: AppState) => state.user?.profile.sub);

    const schema: yup.ObjectSchema<ImportStudyFormData> = yup.object().shape({
        [FieldConstants.NAME]: yup.string().trim().required(NAME_EMPTY),
        [FieldConstants.DESCRIPTION]: yup.string().max(MAX_CHAR_DESCRIPTION),
        studyFiles: yup
            .mixed<FileList>()
            .test('required', intl.formatMessage({ id: 'uploadStudyErrorMsg' }), (value) => {
                return value !== undefined && value !== null && value.length > 0;
            })
            .test('fileType', intl.formatMessage({ id: 'uploadStudyErrorMsg' }), (value) => {
                if (!value || value.length === 0) return false;
                const file = value[0] as File;
                return file.name.endsWith('.zip');
            }),
    }) as yup.ObjectSchema<ImportStudyFormData>;

    const importStudyFormMethods = useForm<ImportStudyFormData>({
        mode: 'onChange',
        resolver: yupResolver<ImportStudyFormData>(schema),
        defaultValues: {
            [FieldConstants.NAME]: '',
            [FieldConstants.DESCRIPTION]: '',
        },
    });
    const {
        field: { ref, value: studyFiles, onChange: onStudyFilesChange },
    } = useController({
        name: 'studyFiles',
        control: importStudyFormMethods.control,
    });

    const studyFileName = (studyFiles as FileList | undefined)?.[0]?.name;

    const {
        formState: { errors, isValid },
        setError,
        setValue,
    } = importStudyFormMethods;

    const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files as FileList;
        if (files && files.length > 0) {
            onStudyFilesChange(event.target.files);
            setValue(FieldConstants.NAME, files[0].name.replace(/\.zip$/i, ''), { shouldValidate: true });
        }
    };

    const handleImportStudy = useCallback(
        async (data: FieldValues) => {
            if (!selectedDirectory?.elementUuid) {
                snackError({ headerId: 'studyImportError' });
                return;
            }
            const studyName = data[FieldConstants.NAME];
            const uploadingStudy: UploadingElement = {
                id: keyGenerator()(),
                elementName: studyName,
                directory: selectedDirectory.elementUuid,
                type: ElementType.STUDY,
                owner: userId,
                lastModifiedBy: userId,
                uploading: true,
            };

            importStudy(
                studyName,
                data[FieldConstants.DESCRIPTION],
                data.studyFiles?.[0] as File,
                selectedDirectory.elementUuid
            )
                .then(() => onClose())
                .catch((error) => {
                    dispatch(removeUploadingElement(uploadingStudy));
                    const { descriptor, values } = extractErrorMessageDescriptor(error, 'studyImportError');
                    setError(`root.${FieldConstants.API_CALL}`, {
                        message: intl.formatMessage(descriptor, values).toString(),
                    });
                });

            // the uploadingStudy ghost element will be removed when directory
            // content updated by fetch
            dispatch(addUploadingElement(uploadingStudy));
        },
        [dispatch, intl, onClose, selectedDirectory?.elementUuid, setError, snackError, userId]
    );
    const isFormValid = isObjectEmpty(errors) && isValid;
    return (
        <CustomMuiDialog
            titleId="importStudy"
            formContext={{
                ...importStudyFormMethods,
                validationSchema: schema,
                removeOptional: true,
            }}
            open={open}
            onClose={onClose}
            onSave={handleImportStudy}
            onCancel={onClose}
            disabledSave={!isFormValid}
        >
            <Stack spacing={2} marginTop="auto">
                <Grid>
                    <PrefilledNameInput
                        name={FieldConstants.NAME}
                        label="nameProperty"
                        elementType={ElementType.STUDY}
                    />
                </Grid>
                <Grid
                    sx={{
                        opacity: 0.5,
                        pointerEvents: 'none',
                    }}
                >
                    <DescriptionField />
                </Grid>
                <Grid container alignItems="center" spacing={1} pt={1}>
                    <Grid>
                        <Button variant="contained" color="primary" component="label">
                            <FormattedMessage id="uploadStudy" />
                            <Input
                                ref={ref}
                                type="file"
                                name="studyFiles"
                                inputProps={{ accept: '.zip' }}
                                onChange={onFileChange}
                                sx={{ display: 'none' }}
                                data-testid="ArchiveFileUpload"
                            />
                        </Button>
                    </Grid>
                    <Grid sx={{ fontWeight: 'bold' }}>
                        <p>{studyFileName ?? intl.formatMessage({ id: 'uploadMessage' })}</p>
                    </Grid>
                </Grid>
            </Stack>
            <ErrorInput name="studyFiles" InputField={FieldErrorAlert} />
        </CustomMuiDialog>
    );
}
