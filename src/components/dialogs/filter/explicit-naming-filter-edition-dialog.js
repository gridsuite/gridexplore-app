/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { saveExplicitNamingFilter } from './filters-save';
import { ElementType, FilterType } from '../../../utils/elementType';
import NameWrapper from '../name-wrapper';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { getFilterById } from '../../../utils/rest-api';
import { useSnackMessage } from '@gridsuite/commons-ui';
import CustomMuiDialog from '../commons/custom-mui-dialog/custom-mui-dialog';
import yup from '../../utils/yup-config';
import ExplicitNamingFilterForm, {
    explicitNamingFilterSchema,
    FILTER_EQUIPMENTS_ATTRIBUTES,
} from './explicit-naming-filter-form';
import { EQUIPMENT_TYPE, FILTER_TYPE, NAME } from '../../utils/field-constants';

const formSchema = yup
    .object()
    .shape({
        [NAME]: yup.string().required(),
        [FILTER_TYPE]: yup.string().required(),
        [EQUIPMENT_TYPE]: yup.string().required(),
        ...explicitNamingFilterSchema,
    })
    .required();

const ExplicitNamingFilterEditionDialog = ({
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
                        [FILTER_TYPE]: FilterType.EXPLICIT_NAMING.id,
                        [EQUIPMENT_TYPE]: response[EQUIPMENT_TYPE],
                        [FILTER_EQUIPMENTS_ATTRIBUTES]:
                            response[FILTER_EQUIPMENTS_ATTRIBUTES],
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
            saveExplicitNamingFilter(
                filterForm[FILTER_EQUIPMENTS_ATTRIBUTES],
                false,
                filterForm[EQUIPMENT_TYPE],
                filterForm[NAME],
                id,
                (error) => {
                    snackError({
                        messageTxt: error,
                    });
                },
                null,
                onClose
            );
        },
        [id, onClose, snackError]
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
                <ExplicitNamingFilterForm />
            </NameWrapper>
        </CustomMuiDialog>
    );
};

ExplicitNamingFilterEditionDialog.prototype = {
    id: PropTypes.string,
    name: PropTypes.string,
    titleId: PropTypes.string.isRequired,
    open: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
};

export default ExplicitNamingFilterEditionDialog;
