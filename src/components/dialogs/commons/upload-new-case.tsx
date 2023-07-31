/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React from 'react';
import { FormattedMessage } from 'react-intl';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { Grid } from '@mui/material';

interface UploadNewCaseProps {
    caseFile: File | null;
    caseFileLoading: boolean;
    handleCaseFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const UploadNewCase: React.FC<UploadNewCaseProps> = ({
    caseFile,
    caseFileLoading,
    handleCaseFileUpload,
}) => {
    const { name: caseFileName } = caseFile || {};

    return (
        <Grid container alignItems="center" spacing={1} pt={1}>
            <Grid item>
                <Button variant="contained" color="primary" component="label">
                    <FormattedMessage id="uploadCase" />
                    <input
                        type="file"
                        name="file"
                        onChange={handleCaseFileUpload}
                        style={{ display: 'none' }}
                    />
                </Button>
            </Grid>
            <Grid item>
                <p>
                    {caseFileLoading ? (
                        <CircularProgress size="1rem" />
                    ) : caseFileName ? (
                        <span>{caseFileName}</span>
                    ) : (
                        <FormattedMessage id="uploadMessage" />
                    )}
                </p>
            </Grid>
        </Grid>
    );
};

export default UploadNewCase;
