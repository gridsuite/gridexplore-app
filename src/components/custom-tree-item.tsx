/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useState, useEffect } from 'react';

import Typography from '@mui/material/Typography';
import { Box } from '@mui/material';
import { TreeItem, useTreeItem } from '@mui/x-tree-view';
import { mergeSx } from '@gridsuite/commons-ui';
import AddIcon from '@mui/icons-material/Add';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import { useTheme } from '@mui/material/styles';
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
    const theme = useTheme();

    const { disabled, expanded, selected, focused, preventSelection } = useTreeItem(nodeId);
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    const isMenuOpen = activeDirectory === nodeId;

    const [hover, setHover] = useState(false);
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

    const handleHover = (isHovering: boolean) => {
        if (isMenuOpen) {
            setHover(true);
        } else {
            setHover(isHovering);
        }
    };

    useEffect(() => {
        // we need to remove the hover when  the user clicks outside the menu while it is open.
        if (!activeDirectory) {
            setHover(false);
        }
    }, [activeDirectory]);

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
                hover ? { backgroundColor: theme.aggrid.highlightColor, borderRadius: '16px' } : undefined
            )}
            onMouseDown={handleMouseDown}
            onMouseEnter={() => handleHover(true)}
            onMouseLeave={() => handleHover(false)}
            ref={ref}
        >
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
            <Box onClick={handleExpansionClick} sx={styles.iconContainer}>
                {icon}
            </Box>
            <Typography onClick={handleSelectionClick} component="div" sx={styles.label}>
                {label}
            </Typography>
            {hover && (
                <Box onClick={handleAddIconClick} sx={{ display: 'flex' }}>
                    {isMenuOpen ? <AddBoxOutlinedIcon /> : <AddIcon />}
                </Box>
            )}
        </Box>
    );
});

const CustomTreeItem = (props: any) => <TreeItem ContentComponent={CustomContent} {...props} />;

export default CustomTreeItem;
