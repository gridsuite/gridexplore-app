import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import makeStyles from '@material-ui/core/styles/makeStyles';

import EditIcon from '@material-ui/icons/Edit';

import IconButton from '@material-ui/core/IconButton';
import { Toolbar, Tooltip } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
    icon: {
        marginRight: theme.spacing(1),
        width: '18px',
        height: '18px',
    },
}));

/**
 * Generic CommonToolbar
 * @param {Array} items Action items to add in the toolbar as buttons
 */
const CommonToolbar = (props) => {
    const { items, ...others } = props;

    const classes = useStyles();

    function makeToolbarButton(
        key,
        tooltipTextId,
        callback,
        icon = <EditIcon fontSize="small" />
    ) {
        return (
            <Tooltip
                title={<FormattedMessage id={tooltipTextId} />}
                key={key}
                placement="right"
            >
                {/* to make tooltips works with disabled buttons, add a simple wrapper span */}
                <span>
                    <IconButton
                        className={classes.icon}
                        onClick={() => callback()}
                    >
                        {icon}
                    </IconButton>
                </span>
            </Tooltip>
        );
    }

    return (
        <Toolbar {...others}>
            {items.map((item, index) => {
                return makeToolbarButton(
                    index,
                    item.tooltipTextId,
                    item.callback,
                    item.icon
                );
            })}
        </Toolbar>
    );
};

CommonToolbar.propTypes = {
    items: PropTypes.array,
};

export default CommonToolbar;
