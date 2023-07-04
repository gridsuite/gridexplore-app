/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useSnackMessage } from '@gridsuite/commons-ui';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import {
    editContingencyList,
    getContingencyListEmptyFormData,
    getContingencyListSchema,
    getFormDataFromFetchedElement,
} from '../contingency-list-utils';
import React, { useEffect, useState } from 'react';
import { fetchContingencyList } from '../../../../utils/rest-api';
import CustomMuiDialog from '../../custom-mui-dialog';
import ContingencyListEditionForm from './contingency-list-edition-form';
import { ElementType } from '../../../../utils/elementType';
import NameWrapper from '../../name-wrapper';
import { NAME } from '../../../utils/field-constants';

const schema = getContingencyListSchema();

const emptyFormData = getContingencyListEmptyFormData();

const ContingencyListEditionDialog = ({
    contingencyListId,
    contingencyListType,
    open,
    onClose,
    titleId,
    name,
}) => {
    const [isValidName, setIsValidName] = useState(true);
    const { snackError } = useSnackMessage();

    const methods = useForm({
        defaultValues: emptyFormData,
        resolver: yupResolver(schema),
    });

    const { reset, setValue, getValues } = methods;

    useEffect(() => {
        if (contingencyListId) {
            fetchContingencyList(contingencyListType, contingencyListId)
                .then((response) => {
                    if (response) {
                        const formData = getFormDataFromFetchedElement(
                            response,
                            name,
                            contingencyListType
                        );
                        reset({ ...formData, [NAME]: name });
                    }
                })
                .catch((errorMessage) => {
                    snackError({
                        messageTxt: errorMessage,
                        headerId: 'contingencyListEditingError',
                        headerValues: { name: getValues(NAME) },
                    });
                });
        }
    }, [
        contingencyListId,
        contingencyListType,
        name,
        reset,
        snackError,
        getValues,
    ]);

    const closeAndClear = (event) => {
        reset(emptyFormData);
        onClose(event);
    };

    const checkName = (isValid, newName) => {
        setIsValidName(isValid);
        setValue(NAME, newName, { shouldDirty: isValid });
    };

    const handleClose = (event) => {
        closeAndClear(event);
    };

    const onSubmit = (contingencyList) => {
        editContingencyList(
            contingencyListId,
            contingencyListType,
            contingencyList
        )
            .then(() => {
                handleClose();
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
            schema={schema}
            methods={methods}
            titleId={titleId}
            removeOptional={true}
            disabledSave={!isValidName}
        >
            <NameWrapper
                titleMessage={'nameProperty'}
                contentType={ElementType.CONTINGENCY_LIST}
                initialValue={name}
                handleNameValidation={checkName}
            />
            <ContingencyListEditionForm
                contingencyListType={contingencyListType}
            />
        </CustomMuiDialog>
    );
};

export default ContingencyListEditionDialog;
