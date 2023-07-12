/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Grid } from '@mui/material';
import { ContingencyListType } from '../../../../utils/elementType';
import ExplicitNamingForm from '../explicit-naming/explicit-naming-form';
import { CRITERIA_BASED, SCRIPT } from '../../../utils/field-constants';
import React from 'react';
import {
    CONTINGENCY_LIST_EQUIPMENTS,
    getCriteriaBasedFormData,
} from '../../commons/criteria-based/criteria-based-utils';
import CriteriaBasedForm from '../../commons/criteria-based/criteria-based-form';
import ScriptInputForm from '../script/script-input-form';

const ContingencyListEditionForm = ({ contingencyListType }) => {
    const emptyValues = getCriteriaBasedFormData();
    return (
        <Grid container spacing={2} marginTop={'auto'}>
            {contingencyListType === ContingencyListType.CRITERIA_BASED.id && (
                <CriteriaBasedForm
                    equipments={CONTINGENCY_LIST_EQUIPMENTS}
                    defaultValues={emptyValues[CRITERIA_BASED]}
                />
            )}
            {contingencyListType === ContingencyListType.EXPLICIT_NAMING.id && (
                <ExplicitNamingForm />
            )}
            {contingencyListType === ContingencyListType.SCRIPT.id && (
                <ScriptInputForm name={SCRIPT} />
            )}
        </Grid>
    );
};

export default ContingencyListEditionForm;
