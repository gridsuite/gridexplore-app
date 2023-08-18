/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Divider } from '@mui/material';
// @ts-ignore
import { FlatParameters } from '@gridsuite/commons-ui';
import React, { useState, FunctionComponent } from 'react';
import AdvancedParameterButton from './advancedParameterButton';

interface ImportParametersSectionProps {
    onChange: () => void;
    currentParameters: Record<string, any>;
    formatWithParameters: any[]; // You can replace `any` with a more specific type if available.
}

const ImportParametersSection: FunctionComponent<
    ImportParametersSectionProps
> = ({ onChange, currentParameters, formatWithParameters }) => {
    const [isParamsDisplayed, setIsParamsDisplayed] = useState<boolean>(false);

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
                        onChange={onChange}
                        variant="standard"
                    />
                )}
            </div>
        </>
    );
};

export default ImportParametersSection;
