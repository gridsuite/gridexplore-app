import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import EditIcon from '@material-ui/icons/Edit';

import withStyles from '@material-ui/core/styles/withStyles';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';

const StyledMenu = withStyles({
    paper: {
        border: '1px solid #d3d4d5',
    },
})((props) => <Menu elevation={0} getContentAnchorEl={null} {...props} />);

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
