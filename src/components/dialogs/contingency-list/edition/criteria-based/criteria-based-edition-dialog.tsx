/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
    CustomMuiDialog,
    FieldConstants,
    getCriteriaBasedSchema,
    MAX_CHAR_DESCRIPTION,
    NO_ITEM_SELECTION_FOR_COPY,
    useSnackMessage,
    yupConfig as yup,
} from '@gridsuite/commons-ui';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useState } from 'react';
import { getContingencyList, saveCriteriaBasedContingencyList } from 'utils/rest-api';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../../../../../redux/types';
import {
    getContingencyListEmptyFormData,
    getCriteriaBasedFormDataFromFetchedElement,
} from '../../contingency-list-utils';
import CriteriaBasedEditionForm from './criteria-based-edition-form';
import { setItemSelectionForCopy } from '../../../../../redux/actions';
import { useParameterState } from '../../../use-parameters-dialog';
import { CriteriaBasedEditionFormData } from '../../../../../utils/rest-api';
import { PARAM_LANGUAGE } from '../../../../../utils/config-params';

const schema = yup.object().shape({
    [FieldConstants.NAME]: yup.string().trim().required('nameEmpty'),
    [FieldConstants.EQUIPMENT_TYPE]: yup.string().required(),
    [FieldConstants.DESCRIPTION]: yup.string().max(MAX_CHAR_DESCRIPTION),
    ...getCriteriaBasedSchema(),
});

export interface CriteriaBasedEditionDialogProps {
    contingencyListId: string;
    contingencyListType: string;
    open: boolean;
    onClose: () => void;
    titleId: string;
    name: string;
    broadcastChannel: BroadcastChannel;
    description: string;
}

export default function CriteriaBasedEditionDialog({
    contingencyListId,
    contingencyListType,
    open,
    onClose,
    titleId,
    name,
    broadcastChannel,
    description,
}: Readonly<CriteriaBasedEditionDialogProps>) {
    const [languageLocal] = useParameterState(PARAM_LANGUAGE);
    const [isFetching, setIsFetching] = useState(!!contingencyListId);
    const { snackError } = useSnackMessage();
    const itemSelectionForCopy = useSelector((state: AppState) => state.itemSelectionForCopy);
    const dispatch = useDispatch();
    const methods = useForm<CriteriaBasedEditionFormData>({
        defaultValues: getContingencyListEmptyFormData(name),
        resolver: yupResolver<CriteriaBasedEditionFormData>(schema),
    });

    const {
        reset,
        formState: { errors },
    } = methods;

    const nameError = errors[FieldConstants.NAME];
    const isValidating = errors.root?.isValidating;

    useEffect(() => {
        setIsFetching(true);
        getContingencyList(contingencyListType, contingencyListId)
            .then((response) => {
                if (response) {
                    const formData = getCriteriaBasedFormDataFromFetchedElement(response, name, description);
                    reset({
                        ...formData,
                    });
                }
            })
            .catch((error) => {
                snackError({
                    messageTxt: error.message,
                    headerId: 'cannotRetrieveContingencyList',
                });
            })
            .finally(() => setIsFetching(false));
    }, [contingencyListId, contingencyListType, name, reset, snackError, description]);

    const closeAndClear = () => {
        reset(getContingencyListEmptyFormData());
        onClose();
    };

    const onSubmit = (contingencyList: CriteriaBasedEditionFormData) => {
        saveCriteriaBasedContingencyList(contingencyListId, contingencyList)
            .then(() => {
                if (itemSelectionForCopy.sourceItemUuid === contingencyListId) {
                    dispatch(setItemSelectionForCopy(NO_ITEM_SELECTION_FOR_COPY));
                    broadcastChannel.postMessage({ NO_ITEM_SELECTION_FOR_COPY });
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
            removeOptional
            disabledSave={Boolean(!!nameError || isValidating)}
            isDataFetching={isFetching}
            language={languageLocal}
            unscrollableFullHeight
        >
            {!isFetching && <CriteriaBasedEditionForm />}
        </CustomMuiDialog>
    );
}
