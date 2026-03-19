/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Box, CircularProgress, Typography } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { FunctionComponent } from 'react';
import { MuiStyles } from '@gridsuite/commons-ui';

const styles = {
    listItem: { paddingLeft: 0, paddingTop: 0, paddingBottom: 0 },
    checkBoxLabel: { flexGrow: '1' },
    disabledModification: { opacity: 0.4 },
    checkBoxIcon: { minWidth: 0, padding: 0 },
    checkboxButton: {
        padding: 0,
        margin: 0,
        display: 'flex',
        alignItems: 'center',
    },
    filler: {
        flexGrow: 1,
    },
    modificationCircularProgress: (theme) => ({
        marginRight: theme.spacing(2),
        color: theme.palette.primary.main,
    }),
    icon: (theme) => ({
        width: theme.spacing(1),
    }),
    rootNodeWarning: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '20%',
    },
    modificationNameHeader: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 0,
        gap: 2,
        '& .MuiTypography-root': {
            fontSize: 'inherit',
        },
    },
} as const satisfies MuiStyles;

export interface NetworkModificationEditorNameHeaderProps {
    modificationCount?: number;
    notificationMessageId?: string;
    isFetchingModifications: boolean;
    isImpactedByNotification: () => boolean;
    pendingState: boolean;
}

export const NetworkModificationEditorNameHeader: FunctionComponent<NetworkModificationEditorNameHeaderProps> = (
    props
) => {
    const {
        modificationCount,
        isFetchingModifications,
        isImpactedByNotification,
        notificationMessageId,
        pendingState,
    } = props;

    if (isImpactedByNotification() && notificationMessageId) {
        return (
            <Box sx={styles.modificationNameHeader}>
                <Box sx={styles.icon}>
                    <CircularProgress size="1em" sx={styles.modificationCircularProgress} />
                </Box>
                <Typography noWrap>
                    <FormattedMessage id={notificationMessageId} />
                </Typography>
            </Box>
        );
    }

    if (isFetchingModifications) {
        return (
            <Box sx={styles.modificationNameHeader}>
                <Box sx={styles.icon}>
                    <CircularProgress size="1em" sx={styles.modificationCircularProgress} />
                </Box>
                <Typography noWrap>
                    <FormattedMessage id="network_modifications.modifications" />
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={styles.modificationNameHeader}>
            {pendingState && (
                <Box sx={styles.icon}>
                    <CircularProgress size="1em" sx={styles.modificationCircularProgress} />
                </Box>
            )}
            <Typography noWrap>
                <FormattedMessage
                    id="network_modifications.modificationsCount"
                    values={{
                        count: modificationCount ?? '',
                        hide: pendingState,
                    }}
                />
            </Typography>
        </Box>
    );
};
