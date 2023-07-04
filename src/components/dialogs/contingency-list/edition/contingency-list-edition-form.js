/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Grid } from '@mui/material';
import { ContingencyListType } from '../../../../utils/elementType';
import ExplicitNamingForm from '../explicit-naming/explicit-naming-form';
import ScriptInput from '../../../utils/rhf-inputs/script-input';
import { SCRIPT } from '../../../utils/field-constants';
import React from 'react';
import { CONTINGENCY_LIST_EQUIPMENTS } from '../../commons/criteria-based/criteria-based-utils';
import CriteriaBasedForm from '../../commons/criteria-based/criteria-based-form';

const ContingencyListEditionForm = ({ contingencyListType }) => {
    return (
        <Grid container spacing={2} marginTop={'auto'}>
            {contingencyListType === ContingencyListType.CRITERIA_BASED.id && (
                <CriteriaBasedForm equipments={CONTINGENCY_LIST_EQUIPMENTS} />
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
