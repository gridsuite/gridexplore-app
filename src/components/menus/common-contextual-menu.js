import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import EditIcon from '@mui/icons-material/Edit';

import withStyles from '@mui/styles/withStyles';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';

const StyledMenu = withStyles({
    paper: {
        border: '1px solid #d3d4d5',
    },
})((props) => <Menu elevation={0} {...props} />);

/**
 * Generic Contextual Menu View
 * @param {Array} menuItems Action items to add in the Menu as MenuItems
 */
const CommonContextualMenu = (props) => {
    const { menuItems, ...others } = props;

    function makeMenuItem(
        key,
        messageDescriptorId,
        callback,
        icon = <EditIcon fontSize="small" />
    ) {
        return (
            <MenuItem
                key={key}
                onClick={() => {
                    callback();
                }}
            >
                <ListItemIcon
                    style={{
                        minWidth: '25px',
                    }}
                >
                    {icon}
                </ListItemIcon>
                <ListItemText
                    primary={<FormattedMessage id={messageDescriptorId} />}
                />
            </MenuItem>
        );
    }

    return (
        <StyledMenu keepMounted {...others}>
            {menuItems.map((menuItem, index) => {
                if (menuItem.isDivider) {
                    return <Divider key={index} />;
                } else {
                    return makeMenuItem(
                        index,
                        menuItem.messageDescriptorId,
                        menuItem.callback,
                        menuItem.icon
                    );
                }
            })}
        </StyledMenu>
    );
};

CommonContextualMenu.propTypes = {
    handleCloseMenu: PropTypes.func,
    position: PropTypes.object,
    menuItems: PropTypes.array,
};

export default CommonContextualMenu;
