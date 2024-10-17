/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { forwardRef, MouseEvent, ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { TreeItem, useTreeItem } from '@mui/x-tree-view';
import { mergeSx } from '@gridsuite/commons-ui';

export interface TreeItemCustomContentProps {
    className?: string;
    styles: any;
    label?: ReactNode;
    nodeId: string;
    icon?: ReactNode;
    expansionIcon?: ReactNode;
    displayIcon?: ReactNode;
    onExpand: (e: string) => void;
    onSelect: (e: string) => void;
}

const CustomContent = forwardRef(function CustomContent(props: TreeItemCustomContentProps, ref) {
    const { className, styles, label, nodeId, icon: iconProp, expansionIcon, displayIcon, onExpand, onSelect } = props;

    const { disabled, expanded, selected, focused, preventSelection } = useTreeItem(nodeId);

    const icon = iconProp || expansionIcon || displayIcon;

    const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
        preventSelection(event);
    };

    const handleExpansionClick = (event: MouseEvent<HTMLDivElement>) => {
        onExpand(nodeId);
    };

    const handleSelectionClick = (event: MouseEvent<HTMLDivElement>) => {
        onSelect(nodeId);
    };

    return (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <Box
            className={className}
            sx={mergeSx(
                styles.root,
                expanded && styles.expanded,
                selected && styles.selected,
                focused && styles.focused,
                disabled && styles.disabled
            )}
            onMouseDown={handleMouseDown}
            ref={ref}
        >
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
            <Box onClick={handleExpansionClick} sx={styles.iconContainer}>
                {icon}
            </Box>
            <Typography onClick={handleSelectionClick} component="div" sx={styles.label}>
                {label}
            </Typography>
        </Box>
    );
});

export default function CustomTreeItem(props: any) {
    return <TreeItem ContentComponent={CustomContent} {...props} />;
}
