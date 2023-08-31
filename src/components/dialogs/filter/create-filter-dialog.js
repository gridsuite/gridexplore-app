/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { ElementType, FilterType } from '../../../utils/elementType';
import {
    saveCriteriaBasedFilter,
    saveExplicitNamingFilter,
} from './filters-save';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import { useSnackMessage } from '@gridsuite/commons-ui';
import NameWrapper from '../name-wrapper';
import CustomMuiDialog from '../commons/custom-mui-dialog/custom-mui-dialog';
import CriteriaBasedFilterForm, {
    criteriaBasedFilterEmptyFormData,
    criteriaBasedFilterSchema,
} from './criteria-based-filter-form';
import ExplicitNamingFilterForm, {
    getExplicitNamingFilterEmptyFormData,
    explicitNamingFilterSchema,
    FILTER_EQUIPMENTS_ATTRIBUTES,
} from './explicit-naming-filter-form';
import { EQUIPMENT_TYPE, FILTER_TYPE, NAME } from '../../utils/field-constants';
import yup from '../../utils/yup-config';
import { RadioInput } from '@gridsuite/commons-ui';
import Grid from '@mui/material/Grid';

const emptyFormData = {
    [NAME]: null,
    [FILTER_TYPE]: FilterType.CRITERIA_BASED.id,
    [EQUIPMENT_TYPE]: null,
    ...criteriaBasedFilterEmptyFormData,
    ...getExplicitNamingFilterEmptyFormData(),
};

// we use both schemas then we can change the type of filter without losing the filled form fields
const formSchema = yup
    .object()
    .shape({
        [NAME]: yup.string().required(),
        [FILTER_TYPE]: yup.string().required(),
        [EQUIPMENT_TYPE]: yup.string().required(),
        ...criteriaBasedFilterSchema,
        ...explicitNamingFilterSchema,
    })
    .required();

const CreateFilterDialog = ({ open, onClose }) => {
    const { snackError } = useSnackMessage();
    const activeDirectory = useSelector((state) => state.activeDirectory);
    const [filterNameValid, setFilterNameValid] = useState(false);

    const formMethods = useForm({
        defaultValues: emptyFormData,
        resolver: yupResolver(formSchema),
    });
    const { setValue, watch } = formMethods;
    const filterType = watch(FILTER_TYPE);

    const handleNameChange = (isValid, newName) => {
        setFilterNameValid(isValid);
        setValue(NAME, newName);
    };

    const onSubmit = useCallback(
        (filterForm) => {
            if (filterForm[FILTER_TYPE] === FilterType.EXPLICIT_NAMING.id) {
                saveExplicitNamingFilter(
                    filterForm[FILTER_EQUIPMENTS_ATTRIBUTES],
                    true,
                    filterForm[EQUIPMENT_TYPE],
                    filterForm[NAME],
                    null,
                    (error) => {
                        snackError({
                            messageTxt: error,
                        });
                    },
                    activeDirectory,
                    onClose
                );
            } else if (
                filterForm[FILTER_TYPE] === FilterType.CRITERIA_BASED.id
            ) {
                saveCriteriaBasedFilter(
                    filterForm,
                    activeDirectory,
                    onClose,
                    (error) => {
                        snackError({
                            messageTxt: error,
                        });
                    }
                );
            }
        },
        [activeDirectory, snackError, onClose]
    );

    return (
        <CustomMuiDialog
            open={open}
            onClose={onClose}
            onSave={onSubmit}
            formSchema={formSchema}
            formMethods={formMethods}
            titleId={'createNewFilter'}
            removeOptional={true}
            disabledSave={!filterNameValid}
        >
            <NameWrapper
                titleMessage="nameProperty"
                contentType={ElementType.FILTER}
                handleNameValidation={handleNameChange}
            >
                <Grid container spacing={2} marginTop={'auto'}>
                    <Grid item>
                        <RadioInput
                            name={FILTER_TYPE}
                            options={Object.values(FilterType)}
                        />
                    </Grid>
                    {filterType === FilterType.CRITERIA_BASED.id ? (
                        <CriteriaBasedFilterForm />
                    ) : (
                        <ExplicitNamingFilterForm />
                    )}
                </Grid>
            </NameWrapper>
        </CustomMuiDialog>
    );
};

CreateFilterDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default CreateFilterDialog;
