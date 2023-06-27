/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import RadioInput from '../../../utils/radio-input';
import {
    CONTINGENCY_LIST_TYPE,
    NAME,
    SCRIPT,
} from '../../../utils/field-constants';
import { ContingencyListTypeRefactor } from '../../../../utils/elementType';
import { Grid } from '@mui/material';
import { gridItem } from '../../../utils/dialog-utils';
import React from 'react';
import { useWatch } from 'react-hook-form';
import CriteriaBasedForm from '../criteria-based/criteria-based-form';
import ExplicitNamingForm from '../explicit-naming/explicit-naming-form';
import TextInput from '../../../utils/text-input';
import ScriptInput from '../../../utils/script-input';
import { CONTINGENCY_LIST_EQUIPMENTS } from '../contingency-list-utils';

const ContingencyListCreationForm = () => {
    const watchContingencyListType = useWatch({
        name: CONTINGENCY_LIST_TYPE,
    });

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

    const contingencyListTypeField = (
        <RadioInput
            name={CONTINGENCY_LIST_TYPE}
            options={Object.values(ContingencyListTypeRefactor)}
        />
    );

    return (
        <Grid container spacing={2} marginTop={'auto'}>
            <Grid container item>
                {gridItem(nameField, 12)}
            </Grid>
            <Grid container item>
                {gridItem(contingencyListTypeField, 12)}
            </Grid>
            {watchContingencyListType ===
                ContingencyListTypeRefactor.CRITERIA_BASED.id && (
                <CriteriaBasedForm
                    equipmentsTypes={Object.values(CONTINGENCY_LIST_EQUIPMENTS)}
                />
            )}
            {watchContingencyListType ===
                ContingencyListTypeRefactor.EXPLICIT_NAMING.id && (
                <ExplicitNamingForm />
            )}
            {watchContingencyListType ===
                ContingencyListTypeRefactor.SCRIPT.id && (
                <ScriptInput name={SCRIPT} />
            )}
        </Grid>
    );
};

export default ContingencyListCreationForm;
