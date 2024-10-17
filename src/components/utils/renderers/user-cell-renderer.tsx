/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Box } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';

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

export function UserCellRenderer({ value }: { value: string }) {
    return (
        <Box>
            <Tooltip title={value} placement="right">
                <Chip sx={styles.chip} label={abbreviationFromUserName(value)} />
            </Tooltip>
        </Box>
    );
}
