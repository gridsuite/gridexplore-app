/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useState, useEffect } from 'react';

import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';
import { Box } from '@mui/material';
import { TreeItem, useTreeItem } from '@mui/x-tree-view';
import { mergeSx } from '@gridsuite/commons-ui';
import AddIcon from '@mui/icons-material/Add';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import { useTheme } from '@mui/material/styles';
import { useSelector } from 'react-redux';

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
        onAddIconClick,
    } = props;
    const theme = useTheme();

    const { disabled, expanded, selected, focused, preventSelection } = useTreeItem(nodeId);
    const activeDirectory = useSelector((state) => state.activeDirectory);
    const isMenuOpen = activeDirectory === nodeId;

    const [hover, setHover] = useState(false);
    const icon = iconProp || expansionIcon || displayIcon;

    const handleMouseDown = (event) => {
        preventSelection(event);
    };

    const handleExpansionClick = (event) => {
        onExpand(nodeId);
    };

    const handleSelectionClick = (event) => {
        onSelect(nodeId);
    };
    const handleAddIconClick = (event) => {
        // used to open the menu
        onAddIconClick(event, nodeId, 'anchorEl');
    };

    const handleHover = (isHovering) => {
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
                hover && { backgroundColor: `${theme.aggrid.highlightColor} !important`, borderRadius: '16px' } // Add hover style with  background color
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
     * The callback to call when handle the add icon Click.
     */
    onAddIconClick: PropTypes.func,
};

const CustomTreeItem = (props) => <TreeItem ContentComponent={CustomContent} {...props} />;

export default CustomTreeItem;
