/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { mergeSx, type MuiStyles } from '@gridsuite/commons-ui';
import { Avatar, Box, Tooltip } from '@mui/material';

const FERMAT_PRIME = 65537;
// This function is a copy/paste of the MUI demo sample here :
// https://mui.com/material-ui/react-avatar/#letter-avatars
// hash function improved to generate more distinct values for similar strings using FERMAT_PRIME
// Use hsl to manage saturation and softer colors
function stringToColor(string: string) {
    let hash = 0;
    /* eslint-disable no-bitwise */
    const stringUniqueHash = [...string].reduce((acc, char) => {
        hash = char.charCodeAt(0) + ((acc << 5) - acc) * FERMAT_PRIME;
        return hash & hash;
    }, 0);
    /* eslint-enable no-bitwise */
    return `hsl(${stringUniqueHash % 360}, 50%, 50%)`;
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
    avatar: (theme) => ({
        height: '32px',
        width: '32px',
        fontSize: theme.typography.fontSize,
        backgroundColor: theme.row.hover as string,
    }),
    avatarSmall: (theme) => ({
        height: '24px',
        width: '24px',
        fontSize: theme.typography.pxToRem(11),
        backgroundColor: theme.row.hover as string,
    }),
} as const satisfies MuiStyles;

export type UserAvatarSize = 'small' | 'medium';

export type UserAvatarProps = { label: string; size?: UserAvatarSize };

/**
 * Colored initials avatar for a user, as displayed in the GridExplore list.
 * `size="small"` yields a more compact avatar to save horizontal space.
 */
export function UserAvatar({ label, size = 'medium' }: Readonly<UserAvatarProps>) {
    return (
        <Tooltip title={label}>
            <Avatar
                sx={mergeSx(
                    size === 'small' ? styles.avatarSmall : styles.avatar,
                    label ? { backgroundColor: stringToColor(label) } : null
                )}
            >
                {getAbbreviationFromUserName(label)}
            </Avatar>
        </Tooltip>
    );
}

/** A user name preceded by its GridExplore list avatar, in a compact size. */
export function UserAvatarWithLabel({ label }: Readonly<{ label: string }>) {
    return (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
            <UserAvatar label={label} size="small" />
            {label}
        </Box>
    );
}
