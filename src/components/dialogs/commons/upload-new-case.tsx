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
import { Grid, Input } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { CASE_FILE } from '../../utils/field-constants';

interface UploadNewCaseProps {
    caseFileLoading?: boolean;
    handleCaseFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const UploadNewCase: React.FunctionComponent<UploadNewCaseProps> = ({
    caseFileLoading = false,
    handleCaseFileUpload,
}) => {
    const { getValues } = useFormContext();

    const caseFile = getValues(CASE_FILE) as File;
    const { name: caseFileName } = caseFile || {};

    return (
        <Grid container alignItems="center" spacing={1} pt={1}>
            <Grid item>
                <Button variant="contained" color="primary" component="label">
                    <FormattedMessage id="uploadCase" />
                    <Input
                        type="file"
                        name="file"
                        onChange={handleCaseFileUpload}
                        sx={{ display: 'none' }}
                    />
                </Button>
            </Grid>
            <Grid item sx={{ fontWeight: 'bold' }}>
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
