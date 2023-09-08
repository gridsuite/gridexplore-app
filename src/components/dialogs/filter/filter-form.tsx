import Grid from '@mui/material/Grid';
import { UniqueNameInput } from '../commons/unique-name-input';
import { FILTER_TYPE, NAME } from '../../utils/field-constants';
import { ElementType, FilterType } from '../../../utils/elementType';
import { RadioInput } from '@gridsuite/commons-ui';
import CriteriaBasedFilterForm from './criteria-based/criteria-based-filter-form';
import ExplicitNamingFilterForm from './explicit-naming/explicit-naming-filter-form';
import React, { FunctionComponent } from 'react';
import { useWatch } from 'react-hook-form';

interface FilterFormProps {
    creation?: boolean;
}

export const FilterForm: FunctionComponent<FilterFormProps> = (props) => {
    const filterType = useWatch({ name: FILTER_TYPE });

    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <UniqueNameInput
                    name={NAME}
                    label={'nameProperty'}
                    elementType={ElementType.FILTER}
                    autoFocus={props.creation}
                />
            </Grid>
            {props.creation && (
                <Grid item>
                    <RadioInput
                        name={FILTER_TYPE}
                        options={Object.values(FilterType)}
                    />
                </Grid>
            )}
            {filterType === FilterType.CRITERIA_BASED.id ? (
                <CriteriaBasedFilterForm />
            ) : (
                <ExplicitNamingFilterForm />
            )}
        </Grid>
    );
};
