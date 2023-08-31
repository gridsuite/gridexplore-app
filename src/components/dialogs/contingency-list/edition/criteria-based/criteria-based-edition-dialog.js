/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useSnackMessage } from '@gridsuite/commons-ui';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';

import React, { useEffect, useState } from 'react';
import {
    getContingencyListEmptyFormData,
    getCriteriaBasedFormDataFromFetchedElement,
} from '../../contingency-list-utils';
import {
    getContingencyList,
    saveCriteriaBasedContingencyList,
} from 'utils/rest-api';
import { EQUIPMENT_TYPE, NAME } from 'components/utils/field-constants';
import CustomMuiDialog from 'components/dialogs/custom-mui-dialog';
import NameWrapper from 'components/dialogs/name-wrapper';
import { ElementType } from 'utils/elementType';
import { getCriteriaBasedSchema } from 'components/dialogs/commons/criteria-based/criteria-based-utils';
import yup from 'components/utils/yup-config';
import CriteriaBasedEditionForm from './criteria-based-edition-form';

const schema = yup.object().shape({
    [NAME]: yup.string().required(),
    [EQUIPMENT_TYPE]: yup.string().required(),
    ...getCriteriaBasedSchema(),
});

const emptyFormData = getContingencyListEmptyFormData();

const CriteriaBasedEditionDialog = ({
    contingencyListId,
    contingencyListType,
    open,
    onClose,
    titleId,
    name,
}) => {
    const [isValidName, setIsValidName] = useState(true);
    const [isFetching, setIsFetching] = useState(!!contingencyListId);
    const { snackError } = useSnackMessage();

    const methods = useForm({
        defaultValues: emptyFormData,
        resolver: yupResolver(schema),
    });

    const { reset, setValue } = methods;

    useEffect(() => {
        if (contingencyListId) {
            setIsFetching(true);
            getContingencyList(contingencyListType, contingencyListId)
                .then((response) => {
                    if (response) {
                        const formData =
                            getCriteriaBasedFormDataFromFetchedElement(
                                response,
                                name
                            );
                        reset({ ...formData, [NAME]: name });
                    }
                })
                .catch((error) => {
                    snackError({
                        messageTxt: error.message,
                        headerId: 'cannotRetrieveContingencyList',
                    });
                })
                .finally(() => setIsFetching(false));
        }
    }, [contingencyListId, contingencyListType, name, reset, snackError]);

    const closeAndClear = (event) => {
        reset(emptyFormData);
        onClose(event);
    };

    const handleNameChange = (isValid, newName) => {
        setIsValidName(isValid);
        setValue(NAME, newName, { shouldDirty: isValid });
    };

    const editContingencyList = (contingencyListId, contingencyList) => {
        return saveCriteriaBasedContingencyList(
            contingencyListId,
            contingencyList
        );
    };

    const onSubmit = (contingencyList) => {
        editContingencyList(contingencyListId, contingencyList)
            .then(() => {
                closeAndClear();
            })
            .catch((errorMessage) => {
                snackError({
                    messageTxt: errorMessage,
                    headerId: 'contingencyListEditingError',
                    headerValues: { name },
                });
            });
    };

    return (
        <CustomMuiDialog
            open={open}
            onClose={closeAndClear}
            onSave={onSubmit}
            formSchema={schema}
            formMethods={methods}
            titleId={titleId}
            removeOptional={true}
            disabledSave={!isValidName}
            isDataFetching={isFetching}
        >
            <NameWrapper
                titleMessage={'nameProperty'}
                contentType={ElementType.CONTINGENCY_LIST}
                initialValue={name}
                handleNameValidation={handleNameChange}
            />
            {!isFetching && <CriteriaBasedEditionForm />}
        </CustomMuiDialog>
    );
};

export default CriteriaBasedEditionDialog;
