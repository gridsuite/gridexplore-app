/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Grid } from '@mui/material';
import { gridItem } from '../../../utils/dialog-utils';
import { ContingencyListType } from '../../../../utils/elementType';
import CriteriaBasedForm from '../criteria-based/criteria-based-form';
import ExplicitNamingForm from '../explicit-naming/explicit-naming-form';
import ScriptInput from '../../../utils/rhf-inputs/script-input';
import { NAME, SCRIPT } from '../../../utils/field-constants';
import React from 'react';
import TextInput from '../../../utils/rhf-inputs/text-input';
import { CONTINGENCY_LIST_EQUIPMENTS } from '../contingency-list-utils';

const ContingencyListEditionForm = ({ contingencyListType }) => {
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
            {contingencyListType === ContingencyListType.CRITERIA_BASED.id && (
                <CriteriaBasedForm
                    equipmentsTypes={Object.values(CONTINGENCY_LIST_EQUIPMENTS)}
                />
            )}
            {contingencyListType === ContingencyListType.EXPLICIT_NAMING.id && (
                <ExplicitNamingForm />
            )}
            {contingencyListType === ContingencyListType.SCRIPT.id && (
                <ScriptInput name={SCRIPT} />
            )}
        </Grid>
    );
};

export default ContingencyListEditionForm;
