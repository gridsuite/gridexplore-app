/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Avatar, Box, Theme } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';

function getAbbreviationFromUserName(name: string) {
    if (name === null || name.trim() === '') {
        return '';
    }
    const splittedName = name.split(' ');
    if (splittedName.length > 1) {
        return `${splittedName[0][0]}${splittedName[splittedName.length - 1][0]}`;
    }
    return `${splittedName[0][0]}`;
}

function avatarProps(name: string) {
    return {
        sx: (theme: Theme) => ({
            cursor: 'pointer',
            height: '32px',
            width: '32px',
            fontSize: theme.typography.fontSize,
        }),
        children: getAbbreviationFromUserName(name),
    };
}

export const UserCellRenderer = ({ value }: { value: string }) => {
    return (
        <Box sx={{ display: 'inline-flex', verticalAlign: 'middle' }}>
            <Tooltip title={value} placement="right">
                <Avatar {...avatarProps(value)} />
            </Tooltip>
        </Box>
    );
};
