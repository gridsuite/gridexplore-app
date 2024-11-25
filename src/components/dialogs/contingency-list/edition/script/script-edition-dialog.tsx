/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
    CustomMuiDialog,
    FieldConstants,
    NO_SELECTION_FOR_COPY,
    useSnackMessage,
    yupConfig as yup,
} from '@gridsuite/commons-ui';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import { useEffect, useState } from 'react';
import { getContingencyList, saveScriptContingencyList } from 'utils/rest-api';
import { useDispatch, useSelector } from 'react-redux';
import { getContingencyListEmptyFormData, getScriptFormDataFromFetchedElement } from '../../contingency-list-utils';
import ScriptEditionForm from './script-edition-form';
import { setSelectionForCopy } from '../../../../../redux/actions';
import { AppState } from '../../../../../redux/types';

interface ScriptEditionFormData {
    [FieldConstants.NAME]: string;
    [FieldConstants.SCRIPT]?: string | null;
    [FieldConstants.EQUIPMENT_TYPE]?: string | null;
}

const schema = yup.object().shape({
    [FieldConstants.NAME]: yup.string().trim().required('nameEmpty'),
    [FieldConstants.EQUIPMENT_TYPE]: yup.string().nullable(),
    [FieldConstants.SCRIPT]: yup.string().nullable(),
});

const emptyFormData = (name?: string) => getContingencyListEmptyFormData(name);

export interface ScriptEditionDialogProps {
    contingencyListId: string;
    contingencyListType: string;
    open: boolean;
    onClose: () => void;
    titleId: string;
    name: string;
    broadcastChannel: BroadcastChannel;
}

export default function ScriptEditionDialog({
    contingencyListId,
    contingencyListType,
    open,
    onClose,
    titleId,
    name,
    broadcastChannel,
}: Readonly<ScriptEditionDialogProps>) {
    const [isFetching, setIsFetching] = useState(!!contingencyListId);
    const { snackError } = useSnackMessage();
    const selectionForCopy = useSelector((state: AppState) => state.selectionForCopy);
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
        setIsFetching(true);
        getContingencyList(contingencyListType, contingencyListId)
            .then((response) => {
                if (response) {
                    const formData = getScriptFormDataFromFetchedElement(response);
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
    }, [contingencyListId, contingencyListType, name, reset, snackError]);

    const closeAndClear = () => {
        reset(emptyFormData());
        onClose();
    };

    const editContingencyList = (contingencyListId2: string, contingencyList: ScriptEditionFormData) => {
        const newScript = {
            id: contingencyListId2,
            script: contingencyList[FieldConstants.SCRIPT],
        };
        return saveScriptContingencyList(newScript, contingencyList[FieldConstants.NAME]);
    };
    const onSubmit = (contingencyList: ScriptEditionFormData) => {
        editContingencyList(contingencyListId, contingencyList)
            .then(() => {
                if (selectionForCopy.sourceItemUuid === contingencyListId) {
                    dispatch(setSelectionForCopy(NO_SELECTION_FOR_COPY));
                    broadcastChannel.postMessage({ NO_SELECTION_FOR_COPY });
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
            unscrollableFullHeight
        >
            {!isFetching && <ScriptEditionForm />}
        </CustomMuiDialog>
    );
}
