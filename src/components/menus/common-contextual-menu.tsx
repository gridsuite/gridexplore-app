/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React from 'react';
import { FormattedMessage } from 'react-intl';

import EditIcon from '@mui/icons-material/Edit';

import Menu, { MenuProps } from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import { PopoverOrigin, PopoverPosition, PopoverProps, PopoverReference, styled } from '@mui/material';

const StyledMenu = styled((props: MenuProps) => <Menu elevation={0} {...props} />)({
    '.MuiMenu-paper': {
        border: '1px solid #d3d4d5',
    },
});

export interface MenuItemType {
    isDivider?: boolean;
    messageDescriptorId?: string;
    callback?: () => void;
    icon?: React.ReactNode;
    disabled?: boolean;
}

export interface CommonContextualMenuProps extends MenuProps {
    onClose?: (e?: unknown, nextSelectedDirectoryId?: string | null) => void;
    menuItems?: MenuItemType[];
}

export interface AnchorStatesType {
    anchorEl?: PopoverProps['anchorEl'];
    anchorReference?: PopoverReference;
    anchorPosition?: PopoverPosition;
    anchorOrigin?: PopoverOrigin;
    transformOrigin?: PopoverOrigin;
}

export const defaultAnchorStates: AnchorStatesType = {
    anchorReference: 'anchorPosition',
};

const CommonContextualMenu: React.FC<CommonContextualMenuProps> = (props) => {
    const { menuItems, ...others } = props;

    function makeMenuItem(
        key: number,
        messageDescriptorId?: string,
        callback?: () => void,
        icon: React.ReactNode = <EditIcon fontSize="small" />,
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
                    return <Divider key={index} />;
                } else {
                    return makeMenuItem(
                        index,
                        menuItem.messageDescriptorId,
                        menuItem.callback,
                        menuItem.icon,
                        menuItem.disabled
                    );
                }
            })}
        </StyledMenu>
    );
};

export default CommonContextualMenu;
