/**
 * Copyright (c) 2021, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { getFilterById, saveFilter } from '../../../utils/rest-api';
import { ElementType, FilterType } from '../../../utils/elementType';
import {
    backToFrontTweak,
    frontToBackTweak,
} from './criteria-based-filter-dialog-utils';
import NameWrapper from '../name-wrapper';
import CustomMuiDialog from '../commons/custom-mui-dialog/custom-mui-dialog';
import { useSnackMessage } from '@gridsuite/commons-ui';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import CriteriaBasedFilterForm, {
    criteriaBasedFilterSchema,
} from './criteria-based-filter-form';
import yup from '../../utils/yup-config';
import { EQUIPMENT_TYPE, FILTER_TYPE, NAME } from '../../utils/field-constants';
import PropTypes from 'prop-types';

const formSchema = yup
    .object()
    .shape({
        [NAME]: yup.string().required(),
        [FILTER_TYPE]: yup.string().required(),
        [EQUIPMENT_TYPE]: yup.string().required(),
        ...criteriaBasedFilterSchema,
    })
    .required();

export const CriteriaBasedFilterEditionDialog = ({
    id,
    name,
    titleId,
    open,
    onClose,
}) => {
    const { snackError } = useSnackMessage();
    const [isNameValid, setIsNameValid] = useState(true);

    // default values are set via reset when we fetch data
    const formMethods = useForm({
        resolver: yupResolver(formSchema),
    });

    const { reset, setValue } = formMethods;

    // Fetch the filter data from back-end if necessary and fill the form with it
    useEffect(() => {
        if (id && open) {
            getFilterById(id)
                .then((response) => {
                    reset({
                        [NAME]: name,
                        [FILTER_TYPE]: FilterType.CRITERIA_BASED.id,
                        ...backToFrontTweak(response),
                    });
                })
                .catch((error) => {
                    snackError({
                        messageTxt: error.message,
                        headerId: 'cannotRetrieveFilter',
                    });
                });
        }
    }, [id, name, open, reset, snackError]);

    const onSubmit = useCallback(
        (filterForm) => {
            saveFilter(
                frontToBackTweak(id, filterForm),
                filterForm[NAME]
            ).catch((error) => {
                snackError({
                    messageTxt: error.message,
                });
            });
        },
        [id, snackError]
    );

    const handleNameChange = (isValid, newName) => {
        setIsNameValid(isValid);
        setValue(NAME, newName);
    };

    return (
        <CustomMuiDialog
            open={open}
            onClose={onClose}
            onSave={onSubmit}
            formSchema={formSchema}
            formMethods={formMethods}
            titleId={titleId}
            removeOptional={true}
            disabledSave={!isNameValid}
        >
            <NameWrapper
                titleMessage="nameProperty"
                initialValue={name}
                contentType={ElementType.FILTER}
                handleNameValidation={handleNameChange}
            >
                <CriteriaBasedFilterForm />
            </NameWrapper>
        </CustomMuiDialog>
    );
};

CriteriaBasedFilterEditionDialog.prototype = {
    id: PropTypes.string,
    name: PropTypes.string,
    titleId: PropTypes.string.isRequired,
    open: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
};

export default CriteriaBasedFilterEditionDialog;
