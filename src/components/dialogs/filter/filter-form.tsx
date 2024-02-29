/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import Grid from '@mui/material/Grid';
import { UniqueNameInput } from '../commons/unique-name-input';
import { FILTER_TYPE, NAME } from '../../utils/field-constants';
import { ElementType, FilterType } from '../../../utils/elementType';
import { RadioInput } from '@gridsuite/commons-ui';
import CriteriaBasedFilterForm from './criteria-based/criteria-based-filter-form';
import ExplicitNamingFilterForm, {
    FilterForExplicitConversionProps,
} from './explicit-naming/explicit-naming-filter-form';
import React, { FunctionComponent, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import ExpertFilterForm from './expert/expert-filter-form';
import DescriptionInput from '../description-modification/description-input';

interface FilterFormProps {
    creation?: boolean;
    sourceFilterForExplicitNamingConversion?: FilterForExplicitConversionProps;
}

export const FilterForm: FunctionComponent<FilterFormProps> = (props) => {
    const { setValue } = useFormContext();

    const filterType = useWatch({ name: FILTER_TYPE });

    // We do this because setValue don't set the field dirty
    const handleChange = (
        _event: React.ChangeEvent<HTMLInputElement>,
        value: string
    ) => {
        setValue(FILTER_TYPE, value);
    };

    useEffect(() => {
        if (props.sourceFilterForExplicitNamingConversion) {
            setValue(FILTER_TYPE, FilterType.EXPLICIT_NAMING.id);
        }
    }, [props.sourceFilterForExplicitNamingConversion, setValue]);

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
                <>
                    <Grid item xs={12}>
                        <DescriptionInput rows={5} />
                    </Grid>
                    {!props.sourceFilterForExplicitNamingConversion && (
                        <Grid item>
                            <RadioInput
                                name={FILTER_TYPE}
                                options={Object.values(FilterType)}
                                //TODO FM remove when type from commons-ui updated
                                //@ts-ignore
                                formProps={{ onChange: handleChange }} // need to override this in order to do not activate the validate button when changing the filter type
                            />
                        </Grid>
                    )}
                </>
            )}
            {filterType === FilterType.CRITERIA_BASED.id && (
                <CriteriaBasedFilterForm />
            )}
            {filterType === FilterType.EXPLICIT_NAMING.id && (
                <ExplicitNamingFilterForm
                    sourceFilterForExplicitNamingConversion={
                        props.sourceFilterForExplicitNamingConversion
                    }
                />
            )}
            {filterType === FilterType.EXPERT.id && <ExpertFilterForm />}
        </Grid>
    );
};
