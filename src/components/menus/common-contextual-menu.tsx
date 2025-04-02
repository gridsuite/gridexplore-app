/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { ReactNode, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Edit as EditIcon } from '@mui/icons-material';
import { Divider, ListItemIcon, ListItemText, Menu, MenuItem, MenuProps, styled } from '@mui/material';
import { CustomNestedMenuItem } from '../utils/custom-nested-menu';

const StyledMenu = styled((props: MenuProps) => <Menu elevation={0} {...props} />)({
    '.MuiMenu-paper': {
        border: '1px solid #d3d4d5',
    },
});

export type MenuItemType =
    | {
          isDivider: true;
      }
    | {
          isDivider?: false;
          messageDescriptorId?: string;
          callback?: () => void;
          icon?: ReactNode;
          disabled?: boolean;
          subMenuItems?: MenuItemType[];
      };

export interface CommonContextualMenuProps extends MenuProps {
    menuItems?: MenuItemType[];
}

export default function CommonContextualMenu({ menuItems, ...menuProps }: Readonly<CommonContextualMenuProps>) {
    const intl = useIntl();

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

    const renderMenuItems = useCallback(
        (nodeMenuItems: MenuItemType[] | undefined) => {
            return nodeMenuItems?.map((menuItem, index) => {
                if (menuItem.isDivider) {
                    dividerCount += 1;
                    return <Divider key={`divider${dividerCount}`} />;
                }
                if (menuItem.subMenuItems === undefined) {
                    return makeMenuItem(
                        index,
                        menuItem.messageDescriptorId,
                        menuItem.callback,
                        menuItem.icon,
                        menuItem.disabled
                    );
                }
                return (
                    <CustomNestedMenuItem
                        key={menuItem.messageDescriptorId}
                        label={intl.formatMessage({ id: menuItem.messageDescriptorId })}
                        disabled={menuItem.disabled}
                    >
                        {renderMenuItems(menuItem.subMenuItems)}
                    </CustomNestedMenuItem>
                );
            });
        },
        [intl]
    );

    let dividerCount = 0;
    return (
        <StyledMenu keepMounted {...menuProps}>
            {renderMenuItems(menuItems)}
        </StyledMenu>
    );
}
