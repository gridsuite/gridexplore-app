/*
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useDispatch, useSelector } from 'react-redux';
import { selectFile } from '../../redux/actions';
import Button from '@mui/material/Button';
import { FormattedMessage } from 'react-intl';
import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { makeStyles } from '@mui/styles';
const useStyles = makeStyles(() => ({}));
export const UploadCase = ({ isLoading }) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const selectedFile = useSelector((state) => state.selectedFile);
    const handleFileUpload = (e) => {
        e.preventDefault();
        let files = e.target.files;
        if (files.size === 0) dispatch(selectFile(null));
        else {
            if (selectedFile == null) {
                dispatch(selectFile(files[0]));
            } else if (
                selectedFile &&
                selectedFile.lastModified !== files[0].lastModified
            ) {
                dispatch(selectFile(files[0]));
            }
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
                            ) : isLoading ? (
                                <CircularProgress
                                    className={classes.progress}
                                    size="1rem"
                                />
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
