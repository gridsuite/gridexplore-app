/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React from 'react';

import Typography from '@mui/material/Typography';
import { Box } from '@mui/material';
import { TreeItem, useTreeItem } from '@mui/x-tree-view';
import { mergeSx } from '@gridsuite/commons-ui';
import AddIcon from '@mui/icons-material/Add';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import { useSelector } from 'react-redux';
import { AppState } from 'redux/reducer';

export interface TreeItemCustomContentProps {
    className?: string;
    styles: any;
    label?: React.ReactNode;
    nodeId: string;
    icon?: React.ReactNode;
    expansionIcon?: React.ReactNode;
    displayIcon?: React.ReactNode;
    onExpand: (e: string) => void;
    onSelect: (e: string) => void;
    onAddIconClick: (e: React.MouseEvent<HTMLDivElement>, nodeId: string, anchor: string) => void;
}

const CustomContent = React.forwardRef(function CustomContent(props: TreeItemCustomContentProps, ref) {
    const {
        className,
        styles,
        label,
        nodeId,
        icon: iconProp,
        expansionIcon,
        displayIcon,
        onExpand,
        onSelect,
        onAddIconClick,
    } = props;
    const { disabled, expanded, selected, focused, preventSelection } = useTreeItem(nodeId);
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    const isMenuOpen = activeDirectory === nodeId;

    const icon = iconProp || expansionIcon || displayIcon;

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        preventSelection(event);
    };

    const handleExpansionClick = (event: React.MouseEvent<HTMLDivElement>) => {
        onExpand(nodeId);
    };

    const handleSelectionClick = (event: React.MouseEvent<HTMLDivElement>) => {
        onSelect(nodeId);
    };
    const handleAddIconClick = (event: React.MouseEvent<HTMLDivElement>) => {
        // used to open the menu
        onAddIconClick(event, nodeId, 'anchorEl');
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
                disabled && styles.disabled,
                isMenuOpen && styles.hovered,
                { '&:hover': styles.hovered }
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
            <Box
                onClick={handleAddIconClick}
                className="menuIcon"
                sx={{ display: 'none' }} // This is hidden by default, but shown when the parent Box has its styles.hovered active.
            >
                {isMenuOpen ? <AddBoxOutlinedIcon /> : <AddIcon />}
            </Box>
        </Box>
    );
});

const CustomTreeItem = (props: any) => <TreeItem ContentComponent={CustomContent} {...props} />;

export default CustomTreeItem;
