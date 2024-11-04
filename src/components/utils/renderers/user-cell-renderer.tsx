/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Box, Chip, Tooltip } from '@mui/material';

const abbreviationFromUserName = (name: string | null) => {
    if (name === null) {
        return '';
    }
    const tab = name.split(' ').map((x) => x.charAt(0));
    if (tab.length === 1) {
        return tab[0];
    }
    return tab[0] + tab[tab.length - 1];
};

const styles = {
    chip: {
        cursor: 'pointer',
    },
};

export type UserCellRendererProps = { value: string };

export function UserCellRenderer({ value }: Readonly<UserCellRendererProps>) {
    return (
        <Box>
            <Tooltip title={value} placement="right">
                <Chip sx={styles.chip} label={abbreviationFromUserName(value)} />
            </Tooltip>
        </Box>
    );
}
