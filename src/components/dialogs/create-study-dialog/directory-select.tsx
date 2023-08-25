/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useEffect, useState } from 'react';
import { Button, Typography, Grid } from '@mui/material';
import { FormattedMessage, useIntl } from 'react-intl';
import DirectorySelector from '../directory-selector';
import { fetchPath } from '../../../utils/rest-api';
import { useFormContext } from 'react-hook-form';
import { ACTIVE_DIRECTORY } from '../../utils/field-constants';

interface DirectorySelectProps {
    types: string[];
}

const DirectorySelect: React.FunctionComponent<DirectorySelectProps> = ({
    types,
}) => {
    const intl = useIntl();

    const [open, setOpen] = useState<boolean>(false);
    const [activeDirectoryName, setActiveDirectoryName] = useState<string>('');

    const { setValue, getValues } = useFormContext();

    const { activeDirectory } = getValues();

    useEffect(() => {
        if (activeDirectory) {
            fetchPath(activeDirectory).then((res: any) => {
                setActiveDirectoryName(
                    res
                        .map((element: any) => element.elementName.trim())
                        .reverse()
                        .join('/')
                );
            });
        }
    }, [activeDirectory]);

    const handleSelectFolder = () => {
        setOpen(true);
    };

    const handleClose = (directory: any) => {
        if (directory.length) {
            setValue(ACTIVE_DIRECTORY, directory[0]?.id, {
                shouldDirty: true,
            });
        }
        setOpen(false);
    };

    return (
        <Grid
            sx={{
                marginTop: '10px',
                display: 'flex',
                alignItems: 'center',
            }}
        >
            <Button
                onClick={handleSelectFolder}
                variant="contained"
                sx={{
                    padding: '10px 30px',
                }}
                color="primary"
                component="label"
            >
                <FormattedMessage id="showSelectDirectoryDialog" />
            </Button>
            <Typography
                sx={{
                    marginLeft: '10px',
                    fontWeight: 'bold',
                }}
            >
                {activeDirectoryName}
            </Typography>
            <DirectorySelector
                open={open}
                onClose={handleClose}
                types={types}
                title={intl.formatMessage({
                    id: 'selectDirectoryDialogTitle',
                })}
                validationButtonText={intl.formatMessage({
                    id: 'confirmDirectoryDialog',
                })}
                contentText={intl.formatMessage({
                    id: 'moveItemContentText',
                })}
            />
        </Grid>
    );
};

export default DirectorySelect;
