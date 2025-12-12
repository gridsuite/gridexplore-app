/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { forwardRef, MouseEventHandler, Ref, useCallback, useEffect } from 'react';
import type { UUID } from 'node:crypto';
import { PopoverReference } from '@mui/material';
import { TreeItem, TreeItemSlotProps } from '@mui/x-tree-view';
import { ElementAttributes, useStateBoolean } from '@gridsuite/commons-ui';
import { useSelector } from 'react-redux';
import { AppState } from '../redux/types';
import { styles } from './treeview-utils';
import CustomTreeItemLabel from './custom-tree-item-label';

export type CustomTreeItemProps = {
    node: ElementAttributes;
    onExpand: (itemId: UUID) => void;
    onSelect: (itemId: UUID) => void;
    onContextMenu: (event: any, nodeId: UUID, anchorReference: PopoverReference) => void;
};

const CustomTreeItem = forwardRef(function CustomTreeItem(props: CustomTreeItemProps, ref: Ref<HTMLLIElement>) {
    const { node, onExpand, onSelect, onContextMenu } = props;

    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    const isMenuOpen = activeDirectory === node.elementUuid;
    const { value: hover, setTrue: enableHover, setFalse: disableHover, setValue: setHover } = useStateBoolean(false);

    const handleExpansionClick = useCallback<MouseEventHandler>(
        (event) => {
            event.stopPropagation();
            onExpand(node.elementUuid);
        },
        [node.elementUuid, onExpand]
    );

    const handleSelectionClick = useCallback<MouseEventHandler>(
        (event) => {
            event.stopPropagation();
            onSelect(node.elementUuid);
        },
        [node.elementUuid, onSelect]
    );

    const handleAddIconClick = useCallback<MouseEventHandler>(
        (event) => {
            event.stopPropagation();
            onContextMenu(event, node.elementUuid, 'anchorEl');
        },
        [node.elementUuid, onContextMenu]
    );

    // We don't get a onMouseLeave event when using or leaving the contextual menu by
    // clicking outside the concerned div, so we must update the hover state manually.
    useEffect(() => {
        if (!isMenuOpen) {
            setHover(false);
        }
    }, [isMenuOpen, setHover]);

    return (
        <TreeItem
            ref={ref}
            itemId={node.elementUuid}
            onContextMenu={(e) => onContextMenu(e, node.elementUuid, 'anchorPosition')}
            onClick={handleSelectionClick}
            // MUI slot doesn't work for this one, maybe some extra work to do.
            label={
                <CustomTreeItemLabel
                    node={node}
                    hover={hover}
                    isMenuOpen={isMenuOpen}
                    onAddIconClick={handleAddIconClick}
                />
            }
            slotProps={
                {
                    content: {
                        /* It's not a good idea to rely on the hover state provided by those mouse events
                           because those events could be skipped with the web-browser's html optimization.
                           Therefore, we choose to use this simple way because the
                           contextual menu opened by the AddIcon Button is shared for all the app.
                           Using the :hover CSS pseudo class and the isMenuOpen prop to determine the style can be done but
                           causes issues when the menu is opened from another event in the app.
                        */
                        onMouseEnter: enableHover,
                        onMouseLeave: disableHover,
                        sx: styles?.treeItemContent,
                    },
                    iconContainer: {
                        onClick: handleExpansionClick,
                        sx: styles?.treeItemIconContainer,
                    },
                } as TreeItemSlotProps
            }
            sx={styles?.treeItemRoot}
        >
            {Array.isArray(node.children)
                ? node.children.map((childNode) => {
                      return childNode ? (
                          // @ts-ignore : TS issue with the ref
                          <CustomTreeItem {...props} key={childNode.elementUuid} node={childNode} />
                      ) : null;
                  })
                : null}
        </TreeItem>
    );
});

export default CustomTreeItem;
