/*
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Button from '@mui/material/Button';
import { FormattedMessage, useIntl } from 'react-intl';
import { useEffect } from 'react';
import CircularProgress from '@mui/material/CircularProgress';

const MAX_FILE_SIZE_IN_MO = 100;
const MAX_FILE_SIZE_IN_BYTES = MAX_FILE_SIZE_IN_MO * 1024 * 1024;
export const UploadCase = ({
    isLoading = false,
    providedCaseFile,
    setProvidedCaseFile,
    setProvidedCaseFileOk,
    setProvidedCaseFileError,
}) => {
    const intl = useIntl();
    const handleFileUpload = (event) => {
        event.preventDefault();
        const files = event.target.files;

        if (files?.length) {
            setProvidedCaseFile(files[0]);
        }
    };

    useEffect(() => {
        if (!providedCaseFile) {
            setProvidedCaseFileError(null);
            setProvidedCaseFileOk(false);
        } else if (providedCaseFile.size <= MAX_FILE_SIZE_IN_BYTES) {
            setProvidedCaseFileError(null);
            setProvidedCaseFileOk(true);
        } else {
            setProvidedCaseFileError(
                intl.formatMessage(
                    {
                        id: 'uploadFileExceedingLimitSizeErrorMsg',
                    },
                    {
                        maxSize: MAX_FILE_SIZE_IN_MO,
                        br: <br />,
                    }
                )
            );
            setProvidedCaseFileOk(false);
        }
    }, [
        intl,
        providedCaseFile,
        setProvidedCaseFileError,
        setProvidedCaseFileOk,
    ]);

    return (
        <table>
            <tbody>
                <tr>
                    <th>
                        <Button
                            variant="contained"
                            color="primary"
                            component="label"
                        >
                            <FormattedMessage id="uploadCase" />
                            <input
                                type="file"
                                name="file"
                                onChange={handleFileUpload}
                                style={{ display: 'none' }}
                            />
                        </Button>
                    </th>
                    <th>
                        <p>
                            {providedCaseFile?.name === undefined ? (
                                <FormattedMessage id="uploadMessage" />
                            ) : isLoading ? (
                                <CircularProgress size="1rem" />
                            ) : (
                                providedCaseFile.name
                            )}
                        </p>
                    </th>
                </tr>
            </tbody>
        </table>
    );
};
