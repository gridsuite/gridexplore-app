/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React from 'react';
import { Box, Button } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import CircleIcon from './icons/circleIcon';
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined';

const CIRCLE_SIZE = 200;

const stylesIcon = {
    circle: (theme: any) => ({
        backgroundColor: theme.row.primary,
    }),
};

interface NoContentDirectoryProps {
    handleOpenDialog: () => void;
}

const NoContentDirectory: React.FC<NoContentDirectoryProps> = ({
    handleOpenDialog,
}) => {
    const styles = {
        noContentContainer: (theme: any) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: theme.spacing(20),
        }),
        noContentIcon: {
            fontSize: `${CIRCLE_SIZE / 2}px`,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
        },
        noContentText: (theme: any) => ({
            color: theme.row.primary,
            textAlign: 'center',
            marginTop: theme.spacing(1),
        }),
        noContentButton: {
            borderRadius: '30px',
        },
    };

    return (
        <Box sx={styles.noContentContainer}>
            <CircleIcon size={CIRCLE_SIZE} iconStyles={stylesIcon.circle}>
                <CreateNewFolderOutlinedIcon
                    style={{ fontSize: CIRCLE_SIZE / 2 }}
                />
            </CircleIcon>
            <Box sx={styles.noContentText}>
                <h1>
                    <FormattedMessage id={'createFirstDir'} />
                </h1>
                <Button
                    variant="contained"
                    sx={styles.noContentButton}
                    onClick={handleOpenDialog}
                >
                    <FormattedMessage id={'createFolder'} />
                </Button>
            </Box>
        </Box>
    );
};

export default NoContentDirectory;
