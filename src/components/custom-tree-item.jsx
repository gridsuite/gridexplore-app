/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useState, useEffect } from 'react';

import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { TreeItem, useTreeItem } from '@mui/x-tree-view';
import { mergeSx } from '@gridsuite/commons-ui';
import AddIcon from '@mui/icons-material/Add';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import { useTheme } from '@mui/material/styles';

const CustomContent = React.forwardRef(function CustomContent(props, ref) {
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
        onContextMenu,
        isContextMenuOpen,
    } = props;
    const theme = useTheme();

    const { disabled, expanded, selected, focused, preventSelection } = useTreeItem(nodeId);
    const [hover, setHover] = useState(false);
    const [addIconClicked, setAddIconClicked] = useState(false);
    const icon = iconProp || expansionIcon || displayIcon;

    const handleMouseDown = (event) => {
        console.log(' im out mouse');
        preventSelection(event);
    };

    const handleExpansionClick = (event) => {
        onExpand(nodeId);
    };

    const handleSelectionClick = (event) => {
        onSelect(nodeId);
    };
    const handleAddIconClick = (event) => {
        onContextMenu(event, nodeId);
        setAddIconClicked(true);
    };
    const handleMouseLeave = () => {
        console.log(' im leaving');

        setHover(false);
        setAddIconClicked(false);
    };
    const handleClose = () => {
        setHover(false);
        setAddIconClicked(false);
    };

    useEffect(() => {
        if (!isContextMenuOpen) {
            setHover(false);
        }
    }, [isContextMenuOpen]);

    console.log('debug', 'isContextMenuOpen', isContextMenuOpen);

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
                hover && { backgroundColor: `${theme.aggrid.highlightColor} !important` } // Add hover style with red background color
            )}
            onMouseDown={handleMouseDown}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={handleMouseLeave}
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
                <Box onClick={handleAddIconClick} sx={{ marginLeft: 'auto' }}>
                    {isContextMenuOpen ? <AddBoxOutlinedIcon /> : <AddIcon />}
                </Box>
            )}
{/* 
            {hover && isContextMenuOpen && (
                <Box onClick={handleAddIconClick} sx={{ marginLeft: 'auto' }}>
                    {addIconClicked ? <AddBoxOutlinedIcon /> : <AddIcon />}
                </Box>
            )} */}
        </Box>
    );
});

CustomContent.propTypes = {
    /**
     * Override or extend the styles applied to the component.
     */
    styles: PropTypes.object.isRequired,
    /**
     * className applied to the root element.
     */
    className: PropTypes.string,
    /**
     * The icon to display next to the tree node's label. Either a parent or end icon.
     */
    displayIcon: PropTypes.node,
    /**
     * The icon to display next to the tree node's label. Either an expansion or collapse icon.
     */
    expansionIcon: PropTypes.node,
    /**
     * The icon to display next to the tree node's label.
     */
    icon: PropTypes.node,
    /**
     * The tree node label.
     */
    label: PropTypes.node,
    /**
     * The id of the node.
     */
    nodeId: PropTypes.string.isRequired,

    /**
     * The callback to call when handle Expansion Click.
     */
    onExpand: PropTypes.func,

    /**
     * The callback to call when handle Selection Click.
     */
    onSelect: PropTypes.func,

    /**
     * The callback to call when handle Context Menu Click.
     */
    onContextMenu: PropTypes.func,

    /**
     * Boolean to indicate if the context menu is open.
     */
    isContextMenuOpen: PropTypes.bool.isRequired,
};

const CustomTreeItem = (props) => <TreeItem ContentComponent={CustomContent} {...props} />;

export default CustomTreeItem;
