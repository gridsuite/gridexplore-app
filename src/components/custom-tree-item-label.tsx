/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { MouseEventHandler } from 'react';
import { Box, IconButton, Tooltip, Typography, Zoom } from '@mui/material';
import { Add as AddIcon, AddBoxOutlined as AddBoxOutlinedIcon } from '@mui/icons-material';
import { ElementAttributes } from '@gridsuite/commons-ui';
import { styles } from './treeview-utils';

export type CustomTreeItemLabelProps = {
    node: ElementAttributes;
    hover: boolean;
    isMenuOpen: boolean;
    onAddIconClick: MouseEventHandler<HTMLButtonElement>;
};

export default function CustomTreeItemLabel({
    node,
    hover,
    isMenuOpen,
    onAddIconClick,
}: Readonly<CustomTreeItemLabelProps>) {
    return (
        <Box sx={styles?.treeItemLabelRoot}>
            <Tooltip
                TransitionComponent={Zoom}
                disableFocusListener
                disableTouchListener
                enterDelay={1000}
                enterNextDelay={1000}
                title={node.elementName}
                arrow
                placement="bottom-start"
            >
                <Typography noWrap sx={styles?.treeItemLabelText}>
                    {node.elementName}
                </Typography>
            </Tooltip>
            {/* By adding the button at the end of the label, we don't have to create a custom content, which simplify the code. */}
            {hover && (
                <IconButton size="small" disableRipple onClick={onAddIconClick} sx={styles.treeItemAddIcon}>
                    {isMenuOpen ? <AddBoxOutlinedIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                </IconButton>
            )}
        </Box>
    );
}
