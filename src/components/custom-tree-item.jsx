/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useState } from 'react';

import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';
import { Box } from '@mui/material';
import { TreeItem, useTreeItem } from '@mui/x-tree-view';
import { mergeSx } from '@gridsuite/commons-ui';
import AddIcon from '@mui/icons-material/Add';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
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
        onHover,
        onHoverEnd,
        onClick,
    } = props;

    const { disabled, expanded, selected, focused, preventSelection } = useTreeItem(nodeId);

    const icon = iconProp || expansionIcon || displayIcon;
    const [hovered, setHovered] = useState(false); // State to manage hover
    const [clicked, setClicked] = useState(false); // State to manage hover
    const handleMouseDown = (event) => {
        preventSelection(event);
    };

    const handleExpansionClick = (event) => {
        onExpand(nodeId);
    };

    const handleSelectionClick = (event) => {
        onSelect(nodeId);
    };
    const handleMouseEnter = () => {
        setHovered(true);
        if (onHover) {
            onHover();
        }
    };

    const handleMouseLeave = () => {
        setHovered(false);
        if (onHoverEnd) {
            onHoverEnd();
        }
    };

    const handleOnClick = (event) => {
        setClicked(true)
        onClick(event, nodeId);
    };
    console.log({ hovered });
    console.log({ clicked });
    return (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <Box
            className={className}
            sx={
                mergeSx(
                    styles.root,
                    expanded && styles.expanded,
                    selected && styles.selected,
                    focused && styles.focused,
                    disabled && styles.disabled
                )
                // backgroundColor: hovered ? 'rgba(0, 0, 0, 0.1)' : null, // Change background color on hover
                // transition: 'background-color 0.3s', // Smooth transition for the background color change
            }
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
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
            {hovered && (clicked ? <AddBoxOutlinedIcon fontSize="small"  /> : <AddIcon fontSize="small" onClick={handleOnClick} />)}
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

    onHover: PropTypes.func, // New prop for hover
    onHoverEnd: PropTypes.func,
    onClick: PropTypes.func,
};

const CustomTreeItem = (props) => <TreeItem ContentComponent={CustomContent} {...props} />;

export default CustomTreeItem;
