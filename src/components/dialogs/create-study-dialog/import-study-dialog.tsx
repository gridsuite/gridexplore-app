/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { ChangeEvent, useCallback, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import * as yup from 'yup';
import { Alert, Button, Grid2, Stack, TextField } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
    CustomMuiDialog,
    ErrorInput,
    FieldErrorAlert,
    useSnackMessage,
    keyGenerator,
    FieldConstants,
    isObjectEmpty,
    ElementType,
    snackWithFallback,
} from '@gridsuite/commons-ui';
import { AppState, UploadingElement } from 'redux/types';
import { UUID } from 'node:crypto';
import { addUploadingElement, removeUploadingElement, setActiveDirectory } from '../../../redux/actions';
import PrefilledNameInput from '../commons/prefilled-name-input';
import { importStudy, StudyExportInfos } from '../../utils/study-export';

interface ImportStudyDialogFormValues {
    [FieldConstants.STUDY_NAME]: string;
}

const importStudyDialogFormValidationSchema = yup.object().shape({
    [FieldConstants.STUDY_NAME]: yup.string().trim().required(),
});

export interface ImportStudyDialogProps {
    open: boolean;
    onClose: () => void;
}

export default function ImportStudyDialog({ open, onClose }: Readonly<ImportStudyDialogProps>) {
    const intl = useIntl();
    const { snackError } = useSnackMessage();
    const dispatch = useDispatch();

    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    const selectedDirectory = useSelector((state: AppState) => state.selectedDirectory);
    const userId = useSelector((state: AppState) => state.user?.profile.sub);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [fileErrorMessageId, setFileErrorMessageId] = useState<string | null>(null);

    const importStudyFormMethods = useForm<ImportStudyDialogFormValues>({
        defaultValues: {
            [FieldConstants.STUDY_NAME]: '',
        },
        resolver: yupResolver<ImportStudyDialogFormValues>(importStudyDialogFormValidationSchema),
    });

    const {
        setValue,
        formState: { errors, isValid },
    } = importStudyFormMethods;

    const isFormValid = isObjectEmpty(errors) && isValid && !!importFile && !fileErrorMessageId;

    const handleFileSelected = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) {
                return;
            }
            if (!file.name.toLowerCase().endsWith('.json')) {
                setFileErrorMessageId('importFileWrongFormat');
                setImportFile(null);
            } else {
                setFileErrorMessageId(null);
                setImportFile(file);

                const suggestedName = file.name.replace(/\.json$/i, '');
                setValue(FieldConstants.STUDY_NAME, suggestedName, { shouldValidate: true, shouldDirty: true });
            }
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        },
        [setValue]
    );

    const handleImportStudy = ({ studyName }: ImportStudyDialogFormValues) => {
        if (!importFile) {
            setFileErrorMessageId('importFileRequired');
            return;
        }

        const uploadingStudy: UploadingElement = {
            id: keyGenerator()(),
            elementName: studyName,
            directory: activeDirectory,
            type: ElementType.STUDY,
            owner: userId,
            lastModifiedBy: userId,
            uploading: true,
        };

        dispatch(addUploadingElement(uploadingStudy));

        importFile
            .text()
            .then((text) => JSON.parse(text) as StudyExportInfos)
            .then((studyExportInfos) => importStudy(studyName, '', activeDirectory as UUID, studyExportInfos))
            .then(() => {
                if (selectedDirectory?.elementUuid) {
                    dispatch(setActiveDirectory(selectedDirectory.elementUuid));
                }
                onClose();
            })
            .catch((error) => {
                dispatch(removeUploadingElement(uploadingStudy));
                snackWithFallback(snackError, error, {
                    headerId: 'studyImportError',
                    headerValues: { studyName },
                });
            })
            .finally(() => {
                setImportFile(null);
            });
    };

    return (
        <CustomMuiDialog
            titleId="importStudy"
            formContext={{
                ...importStudyFormMethods,
                validationSchema: importStudyDialogFormValidationSchema,
                removeOptional: true,
            }}
            open={open}
            onClose={onClose}
            onSave={handleImportStudy}
            disabledSave={!isFormValid}
        >
            <Stack spacing={2} marginTop="auto">
                <Grid2>
                    <PrefilledNameInput
                        name={FieldConstants.STUDY_NAME}
                        label="nameProperty"
                        elementType={ElementType.STUDY}
                    />
                </Grid2>
                <Grid2>
                    <TextField
                        fullWidth
                        label={intl.formatMessage({ id: 'descriptionProperty' })}
                        value=""
                        disabled
                        slotProps={{ input: { readOnly: true } }}
                    />
                </Grid2>
                <Grid2>
                    <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
                        {intl.formatMessage({ id: 'selectImportFile' })}
                        <input type="file" accept=".json,application/json" hidden onChange={handleFileSelected} />
                    </Button>
                    {importFile && (
                        <TextField
                            fullWidth
                            margin="dense"
                            value={importFile.name}
                            disabled
                            slotProps={{ input: { readOnly: true } }}
                        />
                    )}
                    {fileErrorMessageId && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                            {intl.formatMessage({ id: fileErrorMessageId })}
                        </Alert>
                    )}
                </Grid2>
            </Stack>
            <Grid2 pt={1}>
                <ErrorInput name={`root.${FieldConstants.API_CALL}`} InputField={FieldErrorAlert} />
            </Grid2>
        </CustomMuiDialog>
    );
}
