/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React from 'react';
import FilterProperties, {
    filterPropertiesYupSchema,
    FreePropertiesTypes,
} from './filter-properties';
import { CRITERIA_BASED, ENERGY_SOURCE } from '../../../utils/field-constants';
import yup from '../../../utils/yup-config';
import CriteriaBasedForm from '../../commons/criteria-based/criteria-based-form';
import {
    FILTER_EQUIPMENTS,
    getCriteriaBasedFormData,
    getCriteriaBasedSchema,
} from '../../commons/criteria-based/criteria-based-utils';
import Grid from '@mui/material/Grid';

export const criteriaBasedFilterSchema = getCriteriaBasedSchema({
    [ENERGY_SOURCE]: yup.string().nullable(),
    ...filterPropertiesYupSchema,
});

export const criteriaBasedFilterEmptyFormData = getCriteriaBasedFormData(null, {
    [ENERGY_SOURCE]: null,
    [FreePropertiesTypes.SUBSTATION_FILTER_PROPERTIES]: [],
    [FreePropertiesTypes.FREE_FILTER_PROPERTIES]: [],
});

function CriteriaBasedFilterForm() {
    return (
        <Grid container item spacing={1}>
            <CriteriaBasedForm
                equipments={FILTER_EQUIPMENTS}
                defaultValues={criteriaBasedFilterEmptyFormData[CRITERIA_BASED]}
            />
            <FilterProperties />
        </Grid>
    );
}

export default CriteriaBasedFilterForm;
