/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Box, Button } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { CreateNewFolderOutlined as CreateNewFolderOutlinedIcon } from '@mui/icons-material';
import { type MuiStyles } from '@gridsuite/commons-ui';
import RoundBox from './icons/round-box';

const CIRCLE_SIZE = 200;

const styles = {
    circleIcon: (theme) => ({
        backgroundColor: theme.palette.action.disabled,
    }),
    noContentContainer: (theme) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: theme.spacing(20),
    }),
    noContentText: (theme) => ({
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
} as const satisfies MuiStyles;

export interface NoContentDirectoryProps {
    handleOpenDialog: () => void;
}

export default function NoContentDirectory({ handleOpenDialog }: Readonly<NoContentDirectoryProps>) {
    return (
        <Box sx={styles.noContentContainer}>
            <RoundBox size={CIRCLE_SIZE} sx={styles.circleIcon}>
                <CreateNewFolderOutlinedIcon sx={styles.iconSize} />
            </RoundBox>
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
