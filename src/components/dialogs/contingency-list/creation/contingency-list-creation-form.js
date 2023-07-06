/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import RadioInput from '../../../utils/rhf-inputs/radio-input';
import {
    CONTINGENCY_LIST_TYPE,
    CRITERIA_BASED,
    SCRIPT,
} from '../../../utils/field-constants';
import { ContingencyListType } from '../../../../utils/elementType';
import { Grid } from '@mui/material';
import { gridItem } from '../../../utils/dialog-utils';
import React from 'react';
import { useWatch } from 'react-hook-form';
import ExplicitNamingForm from '../explicit-naming/explicit-naming-form';
import {
    CONTINGENCY_LIST_EQUIPMENTS,
    getCriteriaBasedFormData,
} from '../../commons/criteria-based/criteria-based-utils';
import CriteriaBasedForm from '../../commons/criteria-based/criteria-based-form';
import ScriptInputForm from '../script/script-input-form';

const ContingencyListCreationForm = () => {
    const watchContingencyListType = useWatch({
        name: CONTINGENCY_LIST_TYPE,
    });

    const contingencyListTypeField = (
        <RadioInput
            name={CONTINGENCY_LIST_TYPE}
            options={Object.values(ContingencyListType)}
        />
    );

    const emptyValues = getCriteriaBasedFormData();
    return (
        <Grid container spacing={2} marginTop={'auto'}>
            <Grid container item>
                {gridItem(contingencyListTypeField, 12)}
            </Grid>
            {watchContingencyListType ===
                ContingencyListType.CRITERIA_BASED.id && (
                <CriteriaBasedForm
                    equipments={CONTINGENCY_LIST_EQUIPMENTS}
                    defaultValues={emptyValues[CRITERIA_BASED]}
                />
            )}
            {watchContingencyListType ===
                ContingencyListType.EXPLICIT_NAMING.id && (
                <ExplicitNamingForm />
            )}
            {watchContingencyListType === ContingencyListType.SCRIPT.id && (
                <ScriptInputForm name={SCRIPT} />
            )}
        </Grid>
    );
};

export default ContingencyListCreationForm;
