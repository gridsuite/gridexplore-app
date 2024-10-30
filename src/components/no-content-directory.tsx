/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Box, Button } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { CreateNewFolderOutlined as CreateNewFolderOutlinedIcon } from '@mui/icons-material';
import CircleIcon from './icons/circleIcon';

const CIRCLE_SIZE = 200;

const stylesIcon = {
    circle: (theme: any) => ({
        backgroundColor: theme.palette.action.disabled,
    }),
};

export interface NoContentDirectoryProps {
    handleOpenDialog: () => void;
}

export default function NoContentDirectory({ handleOpenDialog }: Readonly<NoContentDirectoryProps>) {
    const styles = {
        noContentContainer: (theme: any) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: theme.spacing(20),
        }),
        noContentText: (theme: any) => ({
            color: theme.palette.text.disabled,
            textAlign: 'center',
            marginTop: theme.spacing(1),
        }),
        noContentButton: {
            borderRadius: '30px',
        },
        iconSize: {
            fontSize: CIRCLE_SIZE / 2,
        },
    };

    return (
        <Box sx={styles.noContentContainer}>
            <CircleIcon size={CIRCLE_SIZE} iconStyles={stylesIcon.circle}>
                <CreateNewFolderOutlinedIcon sx={styles.iconSize} />
            </CircleIcon>
            <Box sx={styles.noContentText}>
                <h1>
                    <FormattedMessage id="createFirstDir" />
                </h1>
                <Button variant="contained" sx={styles.noContentButton} onClick={handleOpenDialog}>
                    <FormattedMessage id="createFolder" />
                </Button>
            </Box>
        </Box>
    );
}
