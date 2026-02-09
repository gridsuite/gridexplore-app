/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ChangeEvent, useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { Button, CircularProgress, Grid, Input } from '@mui/material';
import { useController, useFormContext } from 'react-hook-form';
import {
    ErrorInput,
    extractErrorMessageDescriptor,
    FieldConstants,
    FieldErrorAlert,
    isExploreMetadata,
} from '@gridsuite/commons-ui';
import type { UUID } from 'node:crypto';
import { HTTP_CONNECTION_FAILED_MESSAGE, HTTP_UNPROCESSABLE_ENTITY_STATUS } from 'utils/UIconstants';
import { createCaseWithoutDirectoryElementCreation, deleteCase } from '../../../utils/rest-api';
import type { AppState } from '../../../redux/types';

export interface UploadNewCaseProps {
    isNewStudyCreation?: boolean;
    getCurrentCaseImportParams?: (uuid: UUID) => void;
}

const DEFAULT_MAX_FILE_SIZE_IN_MB = 100;

export default function UploadNewCase({
    isNewStudyCreation = false,
    getCurrentCaseImportParams,
}: Readonly<UploadNewCaseProps>) {
    const intl = useIntl();

    const appsAndUrls = useSelector((state: AppState) => state.appsAndUrls);

    const maxFileSizeInMb = useMemo(() => {
        const exploreMetadata = appsAndUrls.find(isExploreMetadata);
        return exploreMetadata?.maxFileSizeInMb ?? DEFAULT_MAX_FILE_SIZE_IN_MB;
    }, [appsAndUrls]);

    const maxFileSizeInByte = maxFileSizeInMb * 1024 * 1024;

    const [caseFileLoading, setCaseFileLoading] = useState(false);

    const {
        field: { ref, value, onChange: onValueChange },
    } = useController({
        name: FieldConstants.CASE_FILE,
    });

    const {
        field: { onChange: onCaseUuidChange },
    } = useController({
        name: FieldConstants.CASE_UUID,
    });

    const { clearErrors, setError, getValues } = useFormContext();

    const caseFile = value as File;
    const { name: caseFileName } = caseFile || {};

    const gridValue = useMemo(() => {
        if (caseFileLoading) {
            return <CircularProgress size="1rem" />;
        }
        if (caseFileName) {
            return <span>{caseFileName}</span>;
        }
        return <FormattedMessage id="uploadMessage" />;
    }, [caseFileLoading, caseFileName]);

    const handleUploadCaseError = useCallback(
        (error: any) => {
            let fallbackId = 'caseUploadError';
            if (error.status === HTTP_UNPROCESSABLE_ENTITY_STATUS) {
                fallbackId = 'invalidFormatOrName';
            } else if (error.message?.includes(HTTP_CONNECTION_FAILED_MESSAGE)) {
                fallbackId = 'serverConnectionFailed';
            }
            const { descriptor, values } = extractErrorMessageDescriptor(error, fallbackId);
            setError(FieldConstants.CASE_FILE, {
                message: intl.formatMessage(descriptor, values),
            });
        },
        [intl, setError]
    );

    const onChange = (event: ChangeEvent<HTMLInputElement>) => {
        event.preventDefault();

        clearErrors(FieldConstants.CASE_FILE);
        clearErrors(`root.${FieldConstants.API_CALL}`);

        const { files } = event.target;

        if (files?.length) {
            const currentFile = files[0];

            if (currentFile.size <= maxFileSizeInByte) {
                onValueChange(currentFile);

                if (isNewStudyCreation) {
                    // Create new case
                    setCaseFileLoading(true);
                    createCaseWithoutDirectoryElementCreation(currentFile)
                        .then((newCaseUuid) => {
                            const prevCaseUuid = getValues(FieldConstants.CASE_UUID);

                            if (prevCaseUuid && prevCaseUuid !== newCaseUuid) {
                                deleteCase(prevCaseUuid);
                            }

                            onCaseUuidChange(newCaseUuid);

                            if (getCurrentCaseImportParams) {
                                getCurrentCaseImportParams(newCaseUuid);
                            }
                        })
                        .catch(handleUploadCaseError)
                        .finally(() => {
                            setCaseFileLoading(false);
                        });
                }
            } else {
                setError(FieldConstants.CASE_FILE, {
                    type: 'caseFileSize',
                    message: intl
                        .formatMessage(
                            {
                                id: 'uploadFileExceedingLimitSizeErrorMsg',
                            },
                            {
                                maxSize: maxFileSizeInMb,
                            }
                        )
                        .toString(),
                });
            }
        }
    };

    return (
        <>
            <Grid container alignItems="center" spacing={1} pt={1}>
                <Grid item>
                    <Button variant="contained" color="primary" component="label">
                        <FormattedMessage id="uploadCase" />
                        <Input
                            ref={ref}
                            type="file"
                            name="file"
                            onChange={onChange}
                            sx={{ display: 'none' }}
                            data-testid="NewCaseUpload"
                        />
                    </Button>
                </Grid>
                <Grid item sx={{ fontWeight: 'bold' }}>
                    <p>{gridValue}</p>
                </Grid>
            </Grid>
            <ErrorInput name={FieldConstants.CASE_FILE} InputField={FieldErrorAlert} />
        </>
    );
}
