/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Grid } from '@mui/material';
import { gridItem } from '../../../utils/dialog-utils';
import { ContingencyListTypeRefactor } from '../../../../utils/elementType';
import CriteriaBasedForm from '../criteria-based/criteria-based-form';
import ExplicitNamingForm from '../explicit-naming/explicit-naming-form';
import ScriptInput from '../../../utils/script-input';
import { NAME, SCRIPT } from '../../../utils/field-constants';
import React from 'react';
import TextInput from '../../../utils/text-input';

const ContingencyListModificationForm = ({ contingencyListType }) => {
    const nameField = (
        <TextInput
            name={NAME}
            label={'nameProperty'}
            autoFocus
            margin="dense"
            type="text"
            style={{ width: '100%', flexGrow: 1 }}
        />
    );

    return (
        <Grid container spacing={2} marginTop={'auto'}>
            <Grid container item>
                {gridItem(nameField, 12)}
            </Grid>
            {contingencyListType ===
                ContingencyListTypeRefactor.CRITERIA_BASED.id && (
                <CriteriaBasedForm />
            )}
            {contingencyListType ===
                ContingencyListTypeRefactor.EXPLICIT_NAMING.id && (
                <ExplicitNamingForm />
            )}
            {contingencyListType === ContingencyListTypeRefactor.SCRIPT.id && (
                <ScriptInput name={SCRIPT} />
            )}
        </Grid>
    );
};

export default ContingencyListModificationForm;
