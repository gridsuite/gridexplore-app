/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Box, IconButton, Tooltip } from '@mui/material';
import { EditNoteIcon, type ElementAttributes, type MuiStyles } from '@gridsuite/commons-ui';
import { JSX } from 'react';

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
} as const satisfies MuiStyles;

export type DescriptionCellRendererProps = { data: ElementAttributes; directoryWritable: boolean };

export function DescriptionCellRenderer({ data, directoryWritable }: Readonly<DescriptionCellRendererProps>) {
    const { description } = data;
    const descriptionLines = description?.split('\n');
    if (descriptionLines?.length > 3) {
        descriptionLines[2] = '...';
    }
    const tooltipBox = description ? (
        <Box sx={styles.descriptionTooltip}>{descriptionLines?.join('\n')}</Box>
    ) : undefined;

    const icon = (
        <Tooltip title={tooltipBox}>
            <IconButton color="primary">
                <EditNoteIcon empty={!description} />
            </IconButton>
        </Tooltip>
    );
    return (
        <Box
            sx={{
                display: 'inline-flex',
                verticalAlign: 'middle',
                cursor: directoryWritable ? 'pointer' : undefined,
            }}
        >
            {icon}
        </Box>
    );
}
