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
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import CheckIcon from '@mui/icons-material/Check';
import { useIntl } from 'react-intl';
import { styles } from './treeview-utils';

export type CustomTreeItemLabelProps = {
    node: ElementAttributes;
    hover: boolean;
    isMenuOpen: boolean;
    isLinkCopied: boolean;
    onAddIconClick: MouseEventHandler<HTMLButtonElement>;
    onCopyLinkIconClick: MouseEventHandler<HTMLButtonElement>;
};

export default function CustomTreeItemLabel({
    node,
    hover,
    isMenuOpen,
    isLinkCopied,
    onAddIconClick,
    onCopyLinkIconClick,
}: Readonly<CustomTreeItemLabelProps>) {
    const intl = useIntl();
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
                <Box display="flex" alignItems="center" gap={1.25}>
                    <Tooltip
                        title={
                            isLinkCopied ? intl.formatMessage({ id: 'copied' }) : intl.formatMessage({ id: 'copyLink' })
                        }
                    >
                        <IconButton size="small" onClick={onCopyLinkIconClick}>
                            {isLinkCopied ? (
                                <CheckIcon fontSize="small" color="success" />
                            ) : (
                                <LinkRoundedIcon
                                    sx={{
                                        transform: 'rotate(-50deg)',
                                    }}
                                />
                            )}
                        </IconButton>
                    </Tooltip>
                    <IconButton size="small" disableRipple onClick={onAddIconClick} sx={styles.treeItemAddIcon}>
                        {isMenuOpen ? <AddBoxOutlinedIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                    </IconButton>
                </Box>
            )}
        </Box>
    );
}
