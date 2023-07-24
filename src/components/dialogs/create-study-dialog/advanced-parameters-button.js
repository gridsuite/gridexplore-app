import PropTypes from 'prop-types';
import { Grid } from '@mui/material';
import Button from '@mui/material/Button';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckIcon from '@mui/icons-material/Check';
import { FormattedMessage } from 'react-intl';
import makeStyles from '@mui/styles/makeStyles';

const useStyles = makeStyles((theme) => ({
    advancedParameterButton: {
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(1),
    },
}));
const AdvancedParametersButton = ({
    showOpenIcon,
    label,
    callback,
    disabled = false,
}) => {
    const classes = useStyles();

    return (
        <>
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
        </>
    );
};

AdvancedParametersButton.propTypes = {};

export default AdvancedParametersButton;
