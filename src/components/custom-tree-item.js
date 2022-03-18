/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React from 'react';

import PropTypes from 'prop-types';
import clsx from 'clsx';
import TreeItem, { useTreeItem } from '@mui/lab/TreeItem';
import Typography from '@mui/material/Typography';

const CustomContent = React.forwardRef(function CustomContent(props, ref) {
    const {
        classes,
        className,
        label,
        nodeId,
        icon: iconProp,
        expansionIcon,
        displayIcon,
        onExpand,
        onSelect,
    } = props;

    const { disabled, expanded, selected, focused, preventSelection } =
        useTreeItem(nodeId);

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

    return (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div
            className={clsx(className, classes.root, {
                [classes.expanded]: expanded,
                [classes.selected]: selected,
                [classes.focused]: focused,
                [classes.disabled]: disabled,
            })}
            onMouseDown={handleMouseDown}
            ref={ref}
        >
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
            <div
                onClick={handleExpansionClick}
                className={classes.iconContainer}
            >
                {icon}
            </div>
            <Typography
                onClick={handleSelectionClick}
                component="div"
                className={classes.label}
            >
                {label}
            </Typography>
        </div>
    );
});

CustomContent.propTypes = {
    /**
     * Override or extend the styles applied to the component.
     */
    classes: PropTypes.object.isRequired,
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
};

const CustomTreeItem = (props) => (
    <TreeItem ContentComponent={CustomContent} {...props} />
);

export default CustomTreeItem;
