/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Divider } from '@mui/material';
import { FlatParameters } from '@gridsuite/commons-ui';
import React, { useState, FunctionComponent } from 'react';
import AdvancedParameterButton from './advancedParameterButton';
import { CURRENT_PARAMETERS } from '../../utils/field-constants';
import { useFormContext } from 'react-hook-form';

interface ImportParametersSectionProps {
    formatWithParameters: any[]; // You can replace `any` with a more specific type if available.
}

const ImportParametersSection: FunctionComponent<
    ImportParametersSectionProps
> = ({ formatWithParameters }) => {
    const [isParamsDisplayed, setIsParamsDisplayed] = useState<boolean>(false);

    const { setValue, watch } = useFormContext();

    const currentParameters = watch(CURRENT_PARAMETERS);

    const handleParamsChange = (
        paramName: string,
        value: string,
        isEdit: boolean
    ): void => {
        if (!isEdit) {
            setValue(CURRENT_PARAMETERS, {
                ...currentParameters,
                ...{ [paramName]: value },
            });
        }
    };

    const handleShowParametersClick = () => {
        setIsParamsDisplayed((prevIsParamsDisplayed) => !prevIsParamsDisplayed);
    };

    return (
        <>
            <Divider sx={{ marginTop: '20px' }} />
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
                        onChange={handleParamsChange}
                        variant="standard"
                    />
                )}
            </div>
        </>
    );
};

export default ImportParametersSection;
