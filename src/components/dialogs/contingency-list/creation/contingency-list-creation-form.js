/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import RadioInput from '../../../utils/rhf-inputs/radio-input';
import { CONTINGENCY_LIST_TYPE, SCRIPT } from '../../../utils/field-constants';
import { ContingencyListType } from '../../../../utils/elementType';
import { Grid } from '@mui/material';
import { gridItem } from '../../../utils/dialog-utils';
import React from 'react';
import { useWatch } from 'react-hook-form';
import CriteriaBasedForm from '../criteria-based/criteria-based-form';
import ExplicitNamingForm from '../explicit-naming/explicit-naming-form';
import ScriptInput from '../../../utils/rhf-inputs/script-input';
import { CONTINGENCY_LIST_EQUIPMENTS } from '../contingency-list-utils';

const ContingencyListCreationForm = ({}) => {
    const watchContingencyListType = useWatch({
        name: CONTINGENCY_LIST_TYPE,
    });

    const contingencyListTypeField = (
        <RadioInput
            name={CONTINGENCY_LIST_TYPE}
            options={Object.values(ContingencyListType)}
        />
    );

    return (
        <Grid container spacing={2} marginTop={'auto'}>
            <Grid container item>
                {gridItem(contingencyListTypeField, 12)}
            </Grid>
            {watchContingencyListType ===
                ContingencyListType.CRITERIA_BASED.id && (
                <CriteriaBasedForm
                    equipmentsTypes={Object.values(CONTINGENCY_LIST_EQUIPMENTS)}
                />
            )}
            {watchContingencyListType ===
                ContingencyListType.EXPLICIT_NAMING.id && (
                <ExplicitNamingForm />
            )}
            {watchContingencyListType === ContingencyListType.SCRIPT.id && (
                <ScriptInput name={SCRIPT} />
            )}
        </Grid>
    );
};

export default ContingencyListCreationForm;
