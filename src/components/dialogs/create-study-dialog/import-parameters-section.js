import { Divider } from '@mui/material';
import { FlatParameters } from '@gridsuite/commons-ui';
import makeStyles from '@mui/styles/makeStyles';
import AdvancedParametersButton from './advanced-parameters-button';

const useStyles = makeStyles((theme) => ({
    paramDivider: {
        marginTop: theme.spacing(2),
    },
}));
const ImportParametersSection = ({
    isParamsDisplayed,
    handleShowParametersClick,
    formatWithParameters,
    currentParameters,
    onChange,
}) => {
    const classes = useStyles();

    return (
        <>
            <Divider className={classes.paramDivider} />
            <div
                style={{
                    marginTop: '10px',
                }}
            >
                <AdvancedParametersButton
                    showOpenIcon={isParamsDisplayed}
                    label={'importParameters'}
                    callback={handleShowParametersClick}
                    disabled={formatWithParameters.length === 0}
                />
                {isParamsDisplayed && (
                    <FlatParameters
                        paramsAsArray={formatWithParameters}
                        initValues={currentParameters}
                        onChange={onChange}
                        variant="standard"
                    />
                )}
            </div>
        </>
    );
};

ImportParametersSection.propTypes = {};

export default ImportParametersSection;
