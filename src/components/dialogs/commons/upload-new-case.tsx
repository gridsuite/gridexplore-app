/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ChangeEvent, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Button, CircularProgress, Grid, Input } from '@mui/material';
import { useController, useFormContext } from 'react-hook-form';
import { FieldConstants } from '@gridsuite/commons-ui';
import { UUID } from 'crypto';
import { createCaseWithoutDirectoryElementCreation, deleteCase } from '../../../utils/rest-api';

export interface UploadNewCaseProps {
    isNewStudyCreation?: boolean;
    getCurrentCaseImportParams?: (uuid: UUID) => void;
    handleApiCallError?: ErrorCallback;
}

const MAX_FILE_SIZE_IN_MO = 100;
const MAX_FILE_SIZE_IN_BYTES = MAX_FILE_SIZE_IN_MO * 1024 * 1024;

export default function UploadNewCase({
    isNewStudyCreation = false,
    getCurrentCaseImportParams,
    handleApiCallError,
}: Readonly<UploadNewCaseProps>) {
    const intl = useIntl();

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

    const onChange = (event: ChangeEvent<HTMLInputElement>) => {
        event.preventDefault();

        clearErrors(FieldConstants.CASE_FILE);
        clearErrors(`root.${FieldConstants.API_CALL}`);

        const { files } = event.target;

        if (files?.length) {
            const currentFile = files[0];

            if (currentFile.size <= MAX_FILE_SIZE_IN_BYTES) {
                onValueChange(currentFile);

                if (isNewStudyCreation) {
                    // Create new case
                    setCaseFileLoading(true);
                    createCaseWithoutDirectoryElementCreation(currentFile)
                        .then((newCaseUuid) => {
                            const prevCaseUuid = getValues(FieldConstants.CASE_UUID);

                            if (prevCaseUuid && prevCaseUuid !== newCaseUuid) {
                                deleteCase(prevCaseUuid).catch(handleApiCallError);
                            }

                            onCaseUuidChange(newCaseUuid);

                            if (getCurrentCaseImportParams) {
                                getCurrentCaseImportParams(newCaseUuid);
                            }
                        })
                        .catch(handleApiCallError)
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
                                maxSize: MAX_FILE_SIZE_IN_MO,
                            }
                        )
                        .toString(),
                });
            }
        }
    };

    return (
        <Grid container alignItems="center" spacing={1} pt={1}>
            <Grid item>
                <Button variant="contained" color="primary" component="label">
                    <FormattedMessage id="uploadCase" />
                    <Input ref={ref} type="file" name="file" onChange={onChange} sx={{ display: 'none' }} />
                </Button>
            </Grid>
            <Grid item sx={{ fontWeight: 'bold' }}>
                <p>{gridValue}</p>
            </Grid>
        </Grid>
    );
}
