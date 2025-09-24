/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { forwardRef, MouseEvent, MouseEventHandler, useCallback, useEffect } from 'react';
import { UUID } from 'crypto';
import { Box, BoxProps, IconButton, PopoverReference, Typography, TypographyProps } from '@mui/material';
import { Add as AddIcon, AddBoxOutlined as AddBoxOutlinedIcon } from '@mui/icons-material';
import { TreeItem, TreeItemContentProps, TreeItemProps, useTreeItemState } from '@mui/x-tree-view';
import { mergeSx, type SxStyle, useStateBoolean } from '@gridsuite/commons-ui';
import { useSelector } from 'react-redux';
import { AppState } from '../redux/types';

export interface TreeItemCustomContentProps {
    styles?: {
        root?: SxStyle;
        selected?: SxStyle;
        hovered?: SxStyle;
        label?: SxStyle;
        iconContainer?: SxStyle;
    };
    onExpand: (itemId: UUID) => void;
    onSelect: (itemId: UUID) => void;
    onAddIconClick: (e: MouseEvent<HTMLButtonElement>, itemId: UUID, anchor: PopoverReference) => void;
}

export type CustomTreeItemProps = Omit<TreeItemProps, 'ContentProps' | 'ContentComponent'> & {
    ContentProps: TreeItemCustomContentProps;
    itemId: UUID;
};

type CustomContentProps = TreeItemContentProps &
    TreeItemCustomContentProps & {
        itemId: CustomTreeItemProps['itemId'];
    };

const CustomContent = forwardRef(function CustomContent(props: CustomContentProps, ref) {
    const {
        className,
        styles,
        label,
        itemId,
        icon: iconProp,
        expansionIcon,
        displayIcon,
        onExpand,
        onSelect,
        onAddIconClick,
    } = props;

    const { selected, preventSelection } = useTreeItemState(itemId);
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    const isMenuOpen = activeDirectory === itemId;
    const { value: hover, setTrue: enableHover, setFalse: disableHover, setValue: setHover } = useStateBoolean(false);

    const handleExpansionClick = useCallback<NonNullable<BoxProps['onClick']>>(
        () => onExpand(itemId),
        [itemId, onExpand]
    );
    const handleSelectionClick = useCallback<NonNullable<TypographyProps['onClick']>>(
        () => onSelect(itemId),
        [itemId, onSelect]
    );
    const handleAddIconClick = useCallback<MouseEventHandler<HTMLButtonElement>>(
        (event) => onAddIconClick(event, itemId, 'anchorEl'), // used to open the menu
        [itemId, onAddIconClick]
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
            className={className}
            sx={mergeSx(styles?.root, selected ? styles?.selected : undefined, hover ? styles?.hovered : undefined)}
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
            <Box onClick={handleExpansionClick} sx={styles?.iconContainer}>
                {iconProp || expansionIcon || displayIcon}
            </Box>
            <Typography onClick={handleSelectionClick} component="div" sx={styles?.label}>
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
