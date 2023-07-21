import React from 'react';
import FilterProperties, {
    FILTER_PROPERTIES,
    filterPropertiesYupSchema,
} from './filter-properties';
import {
    COUNTRIES,
    COUNTRIES_1,
    COUNTRIES_2,
    CRITERIA_BASED,
    ENERGY_SOURCE,
    NAME,
    NOMINAL_VOLTAGE,
    NOMINAL_VOLTAGE_1,
    NOMINAL_VOLTAGE_2,
} from '../../utils/field-constants';
import {
    DEFAULT_RANGE_VALUE,
    getRangeInputDataForm,
    getRangeInputSchema,
} from '../../utils/rhf-inputs/range-input';
import yup from '../../utils/yup-config';
import CriteriaBasedForm from '../commons/criteria-based/criteria-based-form';
import {
    FILTER_EQUIPMENTS,
    getCriteriaBasedFormData,
    getCriteriaBasedSchema,
} from '../commons/criteria-based/criteria-based-utils';
import { useController, useFormContext, useFormState } from 'react-hook-form';
import Grid from '@mui/material/Grid';
import ErrorInput from '../../utils/rhf-inputs/error-inputs/error-input';
import FieldErrorAlert from '../../utils/rhf-inputs/error-inputs/field-error-alert';

export const criteriaBasedFilterSchema = getCriteriaBasedSchema({
    [ENERGY_SOURCE]: yup.string().nullable(),
    ...filterPropertiesYupSchema,
});

export const criteriaBasedFilterEmptyFormData = getCriteriaBasedFormData(null, {
    [ENERGY_SOURCE]: null,
    [FILTER_PROPERTIES]: [],
});

function CriteriaBasedFilterForm() {
    const { isDirty, dirtyFields } = useFormState();
    const {
        field: { value },
        fieldState: { isDirty: isDirtyFieldState },
        formState: {
            isDirty: isDirtyFormState,
            dirtyFields: dirtyFieldsFormState,
        },
    } = useController({
        name: CRITERIA_BASED,
    });

    console.log('FM useFormState');
    console.log('FM isDirty', isDirty);
    console.log('FM dirtyFields', dirtyFields[NAME]);
    console.log('FM useController');
    console.log('FM value', value);
    console.log('FM isDirtyFieldState', isDirtyFieldState);
    console.log('FM isDirtyFormState', isDirtyFormState);
    console.log('FM dirtyFieldsFormState', dirtyFieldsFormState[COUNTRIES]);

    return (
        <Grid container>
            <CriteriaBasedForm
                equipments={FILTER_EQUIPMENTS}
                defaultValues={criteriaBasedFilterEmptyFormData[CRITERIA_BASED]}
            />
            <FilterProperties />
        </Grid>
    );
}

export default CriteriaBasedFilterForm;
