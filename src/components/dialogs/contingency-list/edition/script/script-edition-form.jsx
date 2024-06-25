/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Grid } from '@mui/material';
import React from 'react';
import ScriptInputForm from '../../script/script-input-form';
import {
    UniqueNameInput,
    ElementType,
    FieldConstants,
} from '@gridsuite/commons-ui';
import { elementExists } from 'utils/rest-api';
import { useSelector } from 'react-redux';

const ScriptEditionForm = () => {
    const activeDirectory = useSelector((state) => state.activeDirectory);
    return (
        <Grid container spacing={2} marginTop={'auto'}>
            <Grid item xs={12}>
                <UniqueNameInput
                    name={FieldConstants.NAME}
                    label={'nameProperty'}
                    elementType={ElementType.CONTINGENCY_LIST}
                    activeDirectory={activeDirectory}
                    elementExists={elementExists}
                />
            </Grid>
            <ScriptInputForm name={FieldConstants.SCRIPT} />
        </Grid>
    );
};

export default ScriptEditionForm;
