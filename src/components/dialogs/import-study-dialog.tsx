/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useState, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { CustomFormProvider, FieldConstants, useSnackMessage } from '@gridsuite/commons-ui';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { AppState } from '../../redux/types';
import { importStudyArchive } from '../../utils/rest-api';

interface ImportStudyDialogProps {
    open: boolean;
    onClose: () => void;
}

interface ImportStudyFormData {
    [FieldConstants.NAME]: string;
    [FieldConstants.DESCRIPTION]: string;
    archiveFile?: FileList;
}

export default function ImportStudyDialog({ open, onClose }: Readonly<ImportStudyDialogProps>) {
    const intl = useIntl();
    const { snackError, snackInfo } = useSnackMessage();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const selectedDirectory = useSelector((state: AppState) => state.selectedDirectory);

    const schema: yup.ObjectSchema<ImportStudyFormData> = yup.object().shape({
        [FieldConstants.NAME]: yup
            .string()
            .trim()
            .required(intl.formatMessage({ id: 'nameEmpty' })),
        [FieldConstants.DESCRIPTION]: yup.string().max(500, intl.formatMessage({ id: 'descriptionLimitError' })),
        archiveFile: yup
            .mixed<FileList>()
            .test('required', intl.formatMessage({ id: 'uploadStudyErrorMsg' }), (value) => {
                return value !== undefined && value !== null && value.length > 0;
            })
            .test('fileType', intl.formatMessage({ id: 'uploadStudyErrorMsg' }), (value) => {
                if (!value || value.length === 0) return false;
                const file = value[0] as File;
                return file.name.endsWith('.gz');
            }),
    }) as yup.ObjectSchema<ImportStudyFormData>;

    const formMethods = useForm<ImportStudyFormData>({
        resolver: yupResolver<ImportStudyFormData>(schema),
        defaultValues: {
            [FieldConstants.NAME]: '',
            [FieldConstants.DESCRIPTION]: '',
        },
    });

    const {
        formState: { errors },
        handleSubmit,
        register,
    } = formMethods;

    const onSubmit: SubmitHandler<ImportStudyFormData> = useCallback(
        async (data) => {
            if (!selectedDirectory?.elementUuid) {
                snackError({ headerId: 'studyImportError' });
                return;
            }

            setIsSubmitting(true);
            try {
                const file = data.archiveFile?.[0];
                if (!file) {
                    snackError({ headerId: 'uploadStudyErrorMsg' });
                    return;
                }
                await importStudyArchive(
                    data[FieldConstants.NAME],
                    data[FieldConstants.DESCRIPTION],
                    file,
                    selectedDirectory.elementUuid
                );
                snackInfo({ headerId: 'studyImportInProgress' });
                onClose();
            } catch (error) {
                console.error('Error importing study:', error);
                snackError({ headerId: 'studyImportError' });
            } finally {
                setIsSubmitting(false);
            }
        },
        [selectedDirectory, snackError, snackInfo, onClose]
    );

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{intl.formatMessage({ id: 'importStudy' })}</DialogTitle>
            <CustomFormProvider validationSchema={schema} {...formMethods}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogContent>
                        <Box display="flex" flexDirection="column" gap={2}>
                            <Box>
                                <label htmlFor="name">{intl.formatMessage({ id: 'nameProperty' })} *</label>
                                <input
                                    id="name"
                                    {...register(FieldConstants.NAME)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        marginTop: '4px',
                                    }}
                                />
                                {errors[FieldConstants.NAME] && (
                                    <span style={{ color: 'red', fontSize: '0.875rem' }}>
                                        {errors[FieldConstants.NAME]?.message}
                                    </span>
                                )}
                            </Box>

                            <Box>
                                <label htmlFor="description">{intl.formatMessage({ id: 'descriptionProperty' })}</label>
                                <textarea
                                    id="description"
                                    {...register(FieldConstants.DESCRIPTION)}
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        marginTop: '4px',
                                        fontFamily: 'inherit',
                                    }}
                                    disabled
                                />
                                {errors[FieldConstants.DESCRIPTION] && (
                                    <span style={{ color: 'red', fontSize: '0.875rem' }}>
                                        {errors[FieldConstants.DESCRIPTION]?.message}
                                    </span>
                                )}
                            </Box>

                            <Box>
                                <label htmlFor="archiveFile">{intl.formatMessage({ id: 'uploadStudy' })} *</label>
                                <input
                                    id="archiveFile"
                                    type="file"
                                    accept=".gz"
                                    {...register('archiveFile')}
                                    style={{
                                        width: '100%',
                                        marginTop: '4px',
                                    }}
                                />
                                {errors.archiveFile && (
                                    <span style={{ color: 'red', fontSize: '0.875rem' }}>
                                        {errors.archiveFile?.message}
                                    </span>
                                )}
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onClose} disabled={isSubmitting}>
                            {intl.formatMessage({ id: 'cancel' })}
                        </Button>
                        <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                            {intl.formatMessage({ id: 'validate' })}
                        </Button>
                    </DialogActions>
                </form>
            </CustomFormProvider>
        </Dialog>
    );
}
