import PropTypes from 'prop-types';
import { Divider } from '@mui/material';
import { FlatParameters } from '@gridsuite/commons-ui';
import React, { useState } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import AdvancedParameterButton from './advancedParameterButton';

const useStyles = makeStyles((theme) => ({
    paramDivider: {
        marginTop: theme.spacing(2),
    },
}));

const ImportParametersSection = ({
    onChange,
    currentParameters,
    formatWithParameters,
}) => {
    const classes = useStyles();

    const [isParamsDisplayed, setIsParamsDisplayed] = useState(false);

    const handleShowParametersClick = () => {
        setIsParamsDisplayed((prevIsParamsDisplayed) => !prevIsParamsDisplayed);
    };

    return (
        <>
            <Divider className={classes.paramDivider} />
            <div
                style={{
                    marginTop: '10px',
                }}
            >
                <AdvancedParameterButton
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

ImportParametersSection.propTypes = {
    onChange: PropTypes.func.isRequired,
    currentParameters: PropTypes.object.isRequired,
    formatWithParameters: PropTypes.array.isRequired,
};

export default ImportParametersSection;
