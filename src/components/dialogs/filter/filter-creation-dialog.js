/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { FilterType } from '../../../utils/elementType';
import {
    saveCriteriaBasedFilter,
    saveExpertFilter,
    saveExplicitNamingFilter,
} from './filters-utils';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import { useSnackMessage } from '@gridsuite/commons-ui';
import CustomMuiDialog from '../commons/custom-mui-dialog/custom-mui-dialog';
import {
    criteriaBasedFilterEmptyFormData,
    criteriaBasedFilterSchema,
} from './criteria-based/criteria-based-filter-form';
import {
    explicitNamingFilterSchema,
    FILTER_EQUIPMENTS_ATTRIBUTES,
    getExplicitNamingFilterEmptyFormData,
} from './explicit-naming/explicit-naming-filter-form';
import {
    DESCRIPTION,
    EQUIPMENT_TYPE,
    FILTER_TYPE,
    NAME,
} from '../../utils/field-constants';
import yup from '../../utils/yup-config';
import { FilterForm } from './filter-form';
import {
    EXPERT_FILTER_QUERY,
    expertFilterSchema,
    getExpertFilterEmptyFormData,
} from './expert/expert-filter-form';

const emptyFormData = {
    [NAME]: '',
    [DESCRIPTION]: '',
    [FILTER_TYPE]: FilterType.CRITERIA_BASED.id,
    [EQUIPMENT_TYPE]: null,
    ...criteriaBasedFilterEmptyFormData,
    ...getExplicitNamingFilterEmptyFormData(),
    ...getExpertFilterEmptyFormData(),
};

// we use both schemas then we can change the type of filter without losing the filled form fields
const formSchema = yup
    .object()
    .shape({
        [NAME]: yup.string().trim().required('nameEmpty'),
        [DESCRIPTION]: yup.string().max(500, 'descriptionLimitError'),
        [FILTER_TYPE]: yup.string().required(),
        [EQUIPMENT_TYPE]: yup.string().required(),
        ...criteriaBasedFilterSchema,
        ...explicitNamingFilterSchema,
        ...expertFilterSchema,
    })
    .required();

const FilterCreationDialog = ({
    open,
    onClose,
    sourceFilterForExplicitNamingConversion = undefined,
}) => {
    const { snackError } = useSnackMessage();
    const activeDirectory = useSelector((state) => state.activeDirectory);

    const formMethods = useForm({
        defaultValues: emptyFormData,
        resolver: yupResolver(formSchema),
    });

    const {
        formState: { errors },
    } = formMethods;

    const nameError = errors[NAME];
    const isValidating = errors.root?.isValidating;

    const onSubmit = useCallback(
        (filterForm) => {
            if (filterForm[FILTER_TYPE] === FilterType.EXPLICIT_NAMING.id) {
                saveExplicitNamingFilter(
                    filterForm[FILTER_EQUIPMENTS_ATTRIBUTES],
                    true,
                    filterForm[EQUIPMENT_TYPE],
                    filterForm[NAME],
                    filterForm[DESCRIPTION],
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
            } else if (filterForm[FILTER_TYPE] === FilterType.EXPERT.id) {
                saveExpertFilter(
                    null,
                    filterForm[EXPERT_FILTER_QUERY],
                    filterForm[EQUIPMENT_TYPE],
                    filterForm[NAME],
                    filterForm[DESCRIPTION],
                    true,
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
            titleId={
                sourceFilterForExplicitNamingConversion
                    ? 'convertIntoExplicitNamingFilter'
                    : 'createNewFilter'
            }
            removeOptional={true}
            disabledSave={!!nameError || isValidating}
        >
            <FilterForm
                creation
                sourceFilterForExplicitNamingConversion={
                    sourceFilterForExplicitNamingConversion
                }
            />
        </CustomMuiDialog>
    );
};

FilterCreationDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default FilterCreationDialog;
