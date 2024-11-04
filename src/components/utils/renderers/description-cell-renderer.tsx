/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Box, Tooltip } from '@mui/material';
import { Create as CreateIcon, StickyNote2Outlined as StickyNote2OutlinedIcon } from '@mui/icons-material';
import { ElementAttributes } from '@gridsuite/commons-ui';

const styles = {
    descriptionTooltip: {
        display: 'inline-block',
        whiteSpace: 'pre',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        maxWidth: '250px',
        maxHeight: '50px',
        cursor: 'pointer',
    },
};

export type DescriptionCellRendererProps = { data: ElementAttributes };

export function DescriptionCellRenderer({ data }: Readonly<DescriptionCellRendererProps>) {
    const { description } = data;
    const descriptionLines = description?.split('\n');
    if (descriptionLines?.length > 3) {
        descriptionLines[2] = '...';
    }
    const tooltip = descriptionLines?.join('\n');

    const icon = description ? (
        <Tooltip title={<Box sx={styles.descriptionTooltip}>{tooltip}</Box>} placement="right">
            <StickyNote2OutlinedIcon />
        </Tooltip>
    ) : (
        <CreateIcon />
    );
    return (
        <Box
            sx={{
                display: 'inline-flex',
                verticalAlign: 'middle',
                cursor: 'pointer',
            }}
        >
            {icon}
        </Box>
    );
}
