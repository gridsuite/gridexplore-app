/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useSnackMessage, CustomMuiDialog, FieldConstants } from '@gridsuite/commons-ui';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';

import React, { useEffect, useState } from 'react';
import {
    getContingencyListEmptyFormData,
    getExplicitNamingFormDataFromFetchedElement,
} from '../../contingency-list-utils';
import { getContingencyList, saveExplicitNamingContingencyList } from 'utils/rest-api';
import yup from 'components/utils/yup-config';
import { getExplicitNamingEditSchema } from '../../explicit-naming/explicit-naming-form';
import ExplicitNamingEditionForm from './explicit-naming-edition-form';
import { prepareContingencyListForBackend } from 'components/dialogs/contingency-list-helper';
import { useDispatch, useSelector } from 'react-redux';
import { noSelectionForCopy } from 'utils/constants';
import { setSelectionForCopy } from '../../../../../redux/actions';

const schema = yup.object().shape({
    [FieldConstants.NAME]: yup.string().trim().required('nameEmpty'),
    [FieldConstants.EQUIPMENT_TYPE]: yup.string().nullable(),
    [FieldConstants.EQUIPMENT_TABLE]: yup.string().nullable(),
    ...getExplicitNamingEditSchema(FieldConstants.EQUIPMENT_TABLE),
});

const emptyFormData = (name) => getContingencyListEmptyFormData(name);

const ExplicitNamingEditionDialog = ({
    contingencyListId,
    contingencyListType,
    open,
    onClose,
    titleId,
    name,
    broadcastChannel,
}) => {
    const [isFetching, setIsFetching] = useState(!!contingencyListId);
    const { snackError } = useSnackMessage();
    const selectionForCopy = useSelector((state) => state.selectionForCopy);
    const dispatch = useDispatch();
    const methods = useForm({
        defaultValues: emptyFormData(name),
        resolver: yupResolver(schema),
    });

    const {
        reset,
        formState: { errors },
    } = methods;

    const nameError = errors[FieldConstants.NAME];
    const isValidating = errors.root?.isValidating;

    useEffect(() => {
        if (contingencyListId) {
            setIsFetching(true);
            getContingencyList(contingencyListType, contingencyListId)
                .then((response) => {
                    if (response) {
                        const formData = getExplicitNamingFormDataFromFetchedElement(response);
                        reset({ ...formData, [FieldConstants.NAME]: name });
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
        reset(emptyFormData());
        onClose(event);
    };

    const editContingencyList = (contingencyListId, contingencyList) => {
        const equipments = prepareContingencyListForBackend(contingencyListId, contingencyList);
        return saveExplicitNamingContingencyList(equipments, contingencyList[FieldConstants.NAME]);
    };

    const onSubmit = (contingencyList) => {
        editContingencyList(contingencyListId, contingencyList)
            .then(() => {
                if (selectionForCopy.sourceItemUuid === contingencyListId) {
                    dispatch(setSelectionForCopy(noSelectionForCopy));
                    broadcastChannel.postMessage({
                        noSelectionForCopy,
                    });
                }
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
            disabledSave={!!nameError || isValidating}
            isDataFetching={isFetching}
        >
            {!isFetching && <ExplicitNamingEditionForm />}
        </CustomMuiDialog>
    );
};

export default ExplicitNamingEditionDialog;
