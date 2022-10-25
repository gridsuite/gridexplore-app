/*
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useDispatch, useSelector } from 'react-redux';
import {
    selectFile,
    setFormatWithParameters,
    setTempCaseUuid,
    setformatInvalidMsgError,
} from '../../redux/actions';
import Button from '@mui/material/Button';
import { FormattedMessage } from 'react-intl';
import React, { useState } from 'react';
import {
    deleteCaseByCaseUuid,
    getCaseImportParameters,
    getCaseUuidWhenUploadFile,
} from '../../utils/rest-api';
import CircularProgress from '@mui/material/CircularProgress';
export const UploadCase = () => {
    const dispatch = useDispatch();
    const selectedFile = useSelector((state) => state.selectedFile);
    const tempCaseUuid = useSelector((state) => state.tempCaseUuid);
    const [loadingUploadFile, setLoadingUploadFile] = useState(false);
    const INVALID_FORMAT = 'Invalid format';
    const handleFileUpload = (e) => {
        e.preventDefault();
        let files = e.target.files;
        if (files.size === 0) dispatch(selectFile(null));
        else {
            if (tempCaseUuid != null) {
                deleteCaseByCaseUuid(tempCaseUuid);
            }
            setLoadingUploadFile(true);
            getCaseUuidWhenUploadFile(files[0])
                .then((caseUuid) => {
                    if (caseUuid) {
                        dispatch(setformatInvalidMsgError(null));
                        dispatch(selectFile(files[0]));
                        setLoadingUploadFile(false);
                        dispatch(setTempCaseUuid(caseUuid));
                        getCaseImportParameters(caseUuid)
                            .then((result) => {
                                result.parameters = result.parameters?.map(
                                    (p) => {
                                        let sortedPossibleValue =
                                            p.possibleValues?.sort((a, b) =>
                                                a.localeCompare(b)
                                            );
                                        p.possibleValues = sortedPossibleValue;
                                        return p;
                                    }
                                );
                                dispatch(
                                    setFormatWithParameters(result.parameters)
                                );
                            })
                            .catch(() => dispatch(setFormatWithParameters([])));
                    }
                })
                .catch(() => {
                    dispatch(setformatInvalidMsgError(INVALID_FORMAT));
                    dispatch(selectFile(null));
                    setLoadingUploadFile(false);
                });
        }
    };

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
                                onChange={(e) => handleFileUpload(e)}
                                style={{ display: 'none' }}
                            />
                        </Button>
                    </th>
                    <th>
                        <p>
                            {selectedFile?.name === undefined ? (
                                <FormattedMessage id="uploadMessage" />
                            ) : loadingUploadFile ? (
                                <CircularProgress size="1rem" />
                            ) : (
                                selectedFile.name
                            )}
                        </p>
                    </th>
                </tr>
            </tbody>
        </table>
    );
};
