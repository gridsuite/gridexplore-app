/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { Edit as EditIcon } from '@mui/icons-material';
import {
    Divider,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    MenuProps,
    PopoverPosition,
    PopoverReference,
    styled,
} from '@mui/material';

const StyledMenu = styled((props: MenuProps) => <Menu elevation={0} {...props} />)({
    '.MuiMenu-paper': {
        border: '1px solid #d3d4d5',
    },
});

export interface MenuItemType {
    isDivider?: boolean;
    messageDescriptorId?: string;
    callback?: () => void;
    icon?: ReactNode;
    disabled?: boolean;
}

export interface CommonContextualMenuProps {
    onClose?: (e?: unknown, nextSelectedDirectoryId?: string | null) => void;
    open: boolean;
    anchorReference?: PopoverReference;
    anchorPosition?: PopoverPosition;
    menuItems?: MenuItemType[];
}

export default function CommonContextualMenu(props: Readonly<CommonContextualMenuProps>) {
    const { menuItems, ...others } = props;

    function makeMenuItem(
        key: number,
        messageDescriptorId?: string,
        callback?: () => void,
        icon: ReactNode = <EditIcon fontSize="small" />,
        disabled: boolean = false
    ) {
        return (
            <MenuItem
                key={key}
                onClick={() => {
                    callback?.();
                }}
                disabled={disabled}
            >
                <ListItemIcon
                    style={{
                        minWidth: '25px',
                    }}
                >
                    {icon}
                </ListItemIcon>
                <ListItemText primary={<FormattedMessage id={messageDescriptorId} />} />
            </MenuItem>
        );
    }

    return (
        <StyledMenu keepMounted {...others}>
            {menuItems?.map((menuItem, index) => {
                if (menuItem.isDivider) {
                    return (
                        <Divider
                            key={`${menuItem.isDivider ? 'divider' : 'menu'}-${
                                menuItem?.messageDescriptorId ?? 'no_msg'
                            }`}
                        />
                    );
                }
                return makeMenuItem(
                    index,
                    menuItem.messageDescriptorId,
                    menuItem.callback,
                    menuItem.icon,
                    menuItem.disabled
                );
            })}
        </StyledMenu>
    );
}
