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
import { useController } from 'react-hook-form';
import { DIRECTORY } from '../../utils/field-constants';
import { ElementType } from '../../../utils/elementType';
import { UUID } from 'crypto';

export interface DirectorySelectProps {
    types: ElementType[];
    dialogOpeningButtonLabel: string;
    dialogTitleLabel: string;
    dialogMessageLabel: string;
    noElementMessageLabel?: string;
    onElementValidated?: (elementId: UUID) => void;
}

// TODO rename into ElementSelect ?
// TODO when select an elementType, dont allow directory selection
// TODO bug on ne vois pas les study d'un dossier - pas d'indication
const DirectorySelect: React.FunctionComponent<DirectorySelectProps> = (
    props
) => {
    const intl = useIntl();

    const [open, setOpen] = useState<boolean>(false);
    const [activeDirectoryName, setActiveDirectoryName] = useState('');

    const {
        field: { onChange, value: directory },
    } = useController({
        name: DIRECTORY,
    });

    useEffect(() => {
        if (directory) {
            fetchPath(directory).then((res: any) => {
                setActiveDirectoryName(
                    res
                        .map((element: any) => element.elementName.trim())
                        .reverse()
                        .join('/')
                );
            });
        }
    }, [directory]);

    const handleSelectFolder = () => {
        setOpen(true);
    };

    const handleClose = (directory: any) => {
        if (directory.length) {
            onChange(directory[0]?.id);
            if (props.onElementValidated) {
                props.onElementValidated(directory[0]?.id);
            }
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
                <FormattedMessage id={props.dialogOpeningButtonLabel} />
            </Button>
            <Typography
                sx={{
                    marginLeft: '10px',
                    fontWeight: 'bold',
                }}
            >
                {activeDirectoryName
                    ? activeDirectoryName
                    : props?.noElementMessageLabel
                    ? intl.formatMessage({
                          id: props.noElementMessageLabel,
                      })
                    : ''}
            </Typography>
            <DirectorySelector
                open={open}
                onClose={handleClose}
                types={props.types}
                title={intl.formatMessage({
                    id: props.dialogTitleLabel,
                })}
                validationButtonText={intl.formatMessage({
                    id: 'confirmDirectoryDialog',
                })}
                contentText={intl.formatMessage({
                    id: props.dialogMessageLabel,
                })}
            />
        </Grid>
    );
};

export default DirectorySelect;
