/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { forwardRef, MouseEvent, MouseEventHandler, useCallback, useEffect } from 'react';
import clsx from 'clsx';
import { UUID } from 'crypto';
import {
    Box,
    BoxProps,
    IconButton,
    PopoverReference,
    SxProps,
    Theme,
    Typography,
    TypographyProps,
} from '@mui/material';
import { Add as AddIcon, AddBoxOutlined as AddBoxOutlinedIcon } from '@mui/icons-material';
import { TreeItem, TreeItemContentProps, TreeItemProps, useTreeItem } from '@mui/x-tree-view';
import { mergeSx, useStateBoolean } from '@gridsuite/commons-ui';
import { useSelector } from 'react-redux';
import { AppState } from '../redux/types';

export interface TreeItemCustomContentProps {
    styles?: {
        root?: SxProps<Theme>;
        expanded?: SxProps<Theme>;
        selected?: SxProps<Theme>;
        focused?: SxProps<Theme>;
        disabled?: SxProps<Theme>;
        hovered?: SxProps<Theme>;
        label?: SxProps<Theme>;
        iconContainer?: SxProps<Theme>;
    };
    onExpand: (nodeId: UUID) => void;
    onSelect: (nodeId: UUID) => void;
    onAddIconClick: (e: MouseEvent<HTMLButtonElement>, nodeId: UUID, anchor: PopoverReference) => void;
}

export type CustomTreeItemProps = Omit<TreeItemProps, 'ContentProps' | 'ContentComponent'> & {
    ContentProps: TreeItemCustomContentProps;
    nodeId: UUID;
};

type CustomContentProps = TreeItemContentProps &
    TreeItemCustomContentProps & {
        nodeId: CustomTreeItemProps['nodeId'];
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
        onAddIconClick,
    } = props;

    const { disabled, expanded, selected, focused, preventSelection } = useTreeItem(nodeId);
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    const isMenuOpen = activeDirectory === nodeId;
    const { value: hover, setTrue: enableHover, setFalse: disableHover, setValue: setHover } = useStateBoolean(false);

    const handleExpansionClick = useCallback<NonNullable<BoxProps['onClick']>>(
        () => onExpand(nodeId),
        [nodeId, onExpand]
    );
    const handleSelectionClick = useCallback<NonNullable<TypographyProps['onClick']>>(
        () => onSelect(nodeId),
        [nodeId, onSelect]
    );
    const handleAddIconClick = useCallback<MouseEventHandler<HTMLButtonElement>>(
        (event) => onAddIconClick(event, nodeId, 'anchorEl'), // used to open the menu
        [nodeId, onAddIconClick]
    );

    // We don't get a onMouseLeave event when using or leaving the contextual menu by
    // clicking outside the concerned div, so we must update the hover state manually.
    useEffect(() => {
        if (!isMenuOpen) {
            setHover(false);
        }
    }, [isMenuOpen, setHover]);

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
                disabled ? styles?.disabled : undefined,
                hover ? styles?.hovered : undefined
            )}
            onMouseDown={preventSelection}
            /* It's not a good idea to rely on the hover state provided by those mouse events
               because those events could be skipped with the web-browser's html optimization.
               Therefore, we choose to use this simple way because the
               contextual menu opened by the AddIcon Button is shared for all the app.
               Using the :hover CSS pseudo class and the isMenuOpen prop to determine the style can be done but
               causes issues when the menu is opened from another event in the app.
            */
            onMouseEnter={enableHover}
            onMouseLeave={disableHover}
            ref={ref}
        >
            <Box onClick={handleExpansionClick} className={classes?.iconContainer} sx={styles?.iconContainer}>
                {iconProp || expansionIcon || displayIcon}
            </Box>
            <Typography onClick={handleSelectionClick} component="div" className={classes?.label} sx={styles?.label}>
                {label}
            </Typography>
            {hover && (
                <IconButton size="small" disableRipple onClick={handleAddIconClick}>
                    {isMenuOpen ? <AddBoxOutlinedIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                </IconButton>
            )}
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
