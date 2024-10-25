/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { MouseEventHandler, useEffect, useState } from 'react';

import Typography from '@mui/material/Typography';
import { Box, IconButton } from '@mui/material';
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
    onAddIconClick: (e: React.MouseEvent<HTMLButtonElement>, nodeId: string, anchor: string) => void;
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
    const handleAddIconClick: MouseEventHandler<HTMLButtonElement> = (event) => {
        // used to open the menu
        onAddIconClick(event, nodeId, 'anchorEl');
    };

    // We don't get a onMouseLeave event when using or leaving the contextual menu
    // clicking outside the concerned div, then we must update the hover state manually
    useEffect(() => {
        if (!isMenuOpen) {
            setHover(false);
        }
    }, [isMenuOpen]);

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
                hover && styles.hovered
            )}
            onMouseDown={handleMouseDown}
            /* It's not a good idea to rely on the hover state provided by those mouse events
               because those events could be skipped with the web-browser's html optimization.
               Therefore, we choose to use this simple way because the
               contextual menu opened by the AddIcon Button is shared for all the app.
               Using the :hover CSS pseudo class and the isMenuOpen prop to determine the style can be done but
               causes issues when the menu is opened from another event in the app.
            */
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
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
                <IconButton size={'small'} disableRipple onClick={handleAddIconClick}>
                    {isMenuOpen ? <AddBoxOutlinedIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                </IconButton>
            )}
        </Box>
    );
});

const CustomTreeItem = (props: any) => <TreeItem ContentComponent={CustomContent} {...props} />;

export default CustomTreeItem;
