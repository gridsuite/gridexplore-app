/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useSelector } from 'react-redux';
import { useSnackMessage } from '@gridsuite/commons-ui';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import {
    editContingencyList,
    getEmptyFormData,
    getFormDataFromFetchedElement,
    getSchema,
} from '../contingency-list-utils';
import { useEffect, useMemo } from 'react';
import { fetchContingencyList } from '../../../../utils/rest-api';
import CustomMuiDialog from '../../custom-mui-dialog';
import ContingencyListEditionForm from './contingency-list-edition-form';
import { NAME } from '../../../utils/field-constants';

const emptyFormData = getEmptyFormData();

const ContingencyListEditionDialog = ({
    contingencyListId,
    contingencyListType,
    open,
    onClose,
    titleId,
    name,
}) => {
    const activeDirectory = useSelector((state) => state.activeDirectory);
    const { snackError } = useSnackMessage();
    const schema = useMemo(
        () => getSchema(activeDirectory, name),
        [activeDirectory, name]
    );

    const methods = useForm({
        defaultValues: emptyFormData,
        resolver: yupResolver(schema),
    });

    const { reset } = methods;

    useEffect(() => {
        if (contingencyListId) {
            fetchContingencyList(contingencyListType, contingencyListId).then(
                (response) => {
                    if (response) {
                        const formData = getFormDataFromFetchedElement(
                            response,
                            contingencyListType,
                            contingencyListId,
                            name
                        );
                        reset(formData);
                    }
                }
            );
        }
    }, [contingencyListId, contingencyListType, name, reset]);

    const closeAndClear = (event) => {
        reset(emptyFormData, { keepDefaultValues: true });
        onClose(event);
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
                    headerValues: { name: contingencyList[NAME] },
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
        >
            <ContingencyListEditionForm
                contingencyListType={contingencyListType}
            />
        </CustomMuiDialog>
    );
};

export default ContingencyListEditionDialog;
