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
import { PopoverPosition, PopoverReference, styled } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';

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
    tooltip?: string;
}

interface CommonContextualMenuProps {
    onClose?: (e?: unknown, nextSelectedDirectoryId?: string | null) => void;
    open: boolean;
    anchorReference?: PopoverReference;
    anchorPosition?: PopoverPosition;
    menuItems?: MenuItemType[];
}

const CommonContextualMenu: React.FC<CommonContextualMenuProps> = (props) => {
    const { menuItems, ...others } = props;

    function makeMenuItem(
        key: number,
        messageDescriptorId?: string,
        callback?: () => void,
        icon: React.ReactNode = <EditIcon fontSize="small" />,
        disabled: boolean = false,
        tooltip?: string
    ) {
        return (
            <Tooltip title={tooltip} arrow disableHoverListener={!tooltip}>
                <MenuItem
                    key={key}
                    onClick={() => {
                        callback?.();
                    }}
                    disabled={disabled}
                    sx={{
                        '&.Mui-disabled': {
                            pointerEvents: 'auto', // Allow pointer events even if disabled
                        },
                    }}
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
            </Tooltip>
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
