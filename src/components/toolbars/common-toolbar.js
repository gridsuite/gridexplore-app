import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import makeStyles from '@mui/styles/makeStyles';

import EditIcon from '@mui/icons-material/Edit';

import IconButton from '@mui/material/IconButton';
import { Toolbar, Tooltip } from '@mui/material';

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
        icon = <EditIcon fontSize="small" />,
        disabledItem
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
                        size="large"
                        disabled={disabledItem}
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
                    item.icon,
                    item.disabled
                );
            })}
        </Toolbar>
    );
};

CommonToolbar.propTypes = {
    items: PropTypes.array,
};

export default CommonToolbar;
