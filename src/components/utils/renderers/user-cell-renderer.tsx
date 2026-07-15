/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Box } from '@mui/material';
import { UserAvatar } from './user-avatar';

export type UserCellRendererProps = { value: string };

export function UserCellRenderer({ value }: Readonly<UserCellRendererProps>) {
    return (
        <Box sx={{ display: 'inline-flex', verticalAlign: 'middle' }}>
            <UserAvatar label={value} />
        </Box>
    );
}
