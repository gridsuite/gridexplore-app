import PropTypes from 'prop-types';
import { Divider } from '@mui/material';
import { FlatParameters } from '@gridsuite/commons-ui';
import React, { useCallback } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import AdvancedParameterButton from './advancedParameterButton';
import { getCaseImportParameters } from '../../../utils/rest-api';

const useStyles = makeStyles((theme) => ({
    paramDivider: {
        marginTop: theme.spacing(2),
    },
}));

const ImportParametersSection = ({
    isParamsDisplayed,
    setIsParamsDisplayed,
    currentParameters,
    setCurrentParameters,
    formatWithParameters,
}) => {
    const classes = useStyles();

    const onChange = useCallback(
        (paramName, value, isEdit) => {
            if (!isEdit) {
                setCurrentParameters((prevCurrentParameters) => ({
                    ...prevCurrentParameters,
                    ...{ [paramName]: value },
                }));
            }
        },
        [setCurrentParameters]
    );

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

ImportParametersSection.propTypes = {};

export default ImportParametersSection;
