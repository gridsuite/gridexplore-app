/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { mergeSx } from '@gridsuite/commons-ui';
import { Avatar, Box, Theme, Tooltip } from '@mui/material';

// This function is a copy/paste of the MUI demo sample here :
// https://mui.com/material-ui/react-avatar/#letter-avatars
function stringToColor(string: string) {
    let hash = 0;
    let i;

    /* eslint-disable no-bitwise */
    for (i = 0; i < string.length; i += 1) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = '#';

    for (i = 0; i < 3; i += 1) {
        const value = (hash >> (i * 8)) & 0xff;
        color += `00${value.toString(16)}`.slice(-2);
    }
    /* eslint-enable no-bitwise */

    return color;
}

function getAbbreviationFromUserName(name: string) {
    // notice : == null means null or undefined
    if (name == null || name.trim() === '') {
        return '';
    }
    const splittedName = name.split(' ');
    if (splittedName.length > 1) {
        return `${splittedName[0][0]}${splittedName[splittedName.length - 1][0]}`;
    }
    return `${splittedName[0][0]}`;
}

const styles = {
    avatar: (theme: Theme) => ({
        cursor: 'pointer',
        height: '32px',
        width: '32px',
        fontSize: theme.typography.fontSize,
    }),
};

export type UserCellRendererProps = { value: string };

export function UserCellRenderer({ value }: Readonly<UserCellRendererProps>) {
    return (
        <Box sx={{ display: 'inline-flex', verticalAlign: 'middle' }}>
            <Tooltip title={value} placement="right">
                <Avatar sx={mergeSx(styles.avatar, { bgcolor: stringToColor(value) })}>
                    {getAbbreviationFromUserName(value)}
                </Avatar>
            </Tooltip>
        </Box>
    );
}
