import PropTypes from 'prop-types';
import { Button, Grid } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckIcon from '@mui/icons-material/Check';
import { FormattedMessage } from 'react-intl';
import React from 'react';
import makeStyles from '@mui/styles/makeStyles';

const useStyles = makeStyles((theme) => ({
    advancedParameterButton: {
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(1),
    },
}));

const AdvancedParameterButton = ({
    showOpenIcon,
    label,
    callback,
    disabled = false,
}) => {
    const classes = useStyles();

    return (
        <Grid item xs={12} className={classes.advancedParameterButton}>
            <Button
                startIcon={<SettingsIcon />}
                endIcon={
                    showOpenIcon && <CheckIcon style={{ color: 'green' }} />
                }
                onClick={callback}
                disabled={disabled}
            >
                <FormattedMessage id={label} />
            </Button>
        </Grid>
    );
};

AdvancedParameterButton.propTypes = {};

export default AdvancedParameterButton;
