/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { forwardRef } from 'react';
import clsx from 'clsx';
import { UUID } from 'crypto';
import { Box, BoxProps, SxProps, Theme, Typography, TypographyProps } from '@mui/material';
import { TreeItem, TreeItemContentProps, TreeItemProps, useTreeItem } from '@mui/x-tree-view';
import { mergeSx } from '@gridsuite/commons-ui';

export interface TreeItemCustomContentProps {
    styles?: {
        root?: SxProps<Theme>;
        expanded?: SxProps<Theme>;
        selected?: SxProps<Theme>;
        focused?: SxProps<Theme>;
        disabled?: SxProps<Theme>;
        label?: SxProps<Theme>;
        iconContainer?: SxProps<Theme>;
    };
    onExpand: (nodeId: UUID) => void;
    onSelect: (nodeId: UUID) => void;
}

export type CustomTreeItemProps = Omit<TreeItemProps, 'ContentProps' | 'ContentComponent'> & {
    ContentProps: TreeItemCustomContentProps;
    nodeId: UUID;
};

type CustomContentProps = TreeItemContentProps &
    TreeItemCustomContentProps & {
        nodeId: UUID; // same type as CustomTreeItemProps['nodeId']
    };

const CustomContent = forwardRef(function CustomContent(props: CustomContentProps, ref) {
    const {
        className,
        classes,
        styles,
        label,
        nodeId,
        icon: iconProp,
        expansionIcon,
        displayIcon,
        onExpand,
        onSelect,
    } = props;

    const { disabled, expanded, selected, focused, preventSelection } = useTreeItem(nodeId);

    const icon = iconProp || expansionIcon || displayIcon;

    const handleMouseDown: BoxProps['onMouseDown'] = (event) => {
        preventSelection(event);
    };

    const handleExpansionClick: BoxProps['onClick'] = () => {
        onExpand(nodeId);
    };

    const handleSelectionClick: TypographyProps['onClick'] = () => {
        onSelect(nodeId);
    };

    return (
        <Box
            className={clsx(
                className,
                classes?.root,
                expanded && classes?.expanded,
                selected && classes?.selected,
                focused && classes?.focused,
                disabled && classes?.disabled
            )}
            sx={mergeSx(
                styles?.root,
                expanded ? styles?.expanded : undefined,
                selected ? styles?.selected : undefined,
                focused ? styles?.focused : undefined,
                disabled ? styles?.disabled : undefined
            )}
            onMouseDown={handleMouseDown}
            ref={ref}
        >
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */}
            <Box onClick={handleExpansionClick} className={classes?.iconContainer} sx={styles?.iconContainer}>
                {icon}
            </Box>
            <Typography onClick={handleSelectionClick} component="div" className={classes?.label} sx={styles?.label}>
                {label}
            </Typography>
        </Box>
    );
});

export default function CustomTreeItem(props: Readonly<CustomTreeItemProps>) {
    const { ContentProps, ...itemProps } = props;
    return (
        <TreeItem
            // TODO use TreeItem2 when passing at v7 to not have casts
            ContentComponent={CustomContent as unknown as TreeItemProps['ContentComponent']}
            ContentProps={ContentProps as unknown as TreeItemProps['ContentProps']}
            {...itemProps}
        />
    );
}
