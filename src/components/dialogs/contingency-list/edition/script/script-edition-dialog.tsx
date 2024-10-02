/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useSnackMessage, CustomMuiDialog, FieldConstants } from '@gridsuite/commons-ui';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';

import React, { FunctionComponent, SyntheticEvent, useEffect, useState } from 'react';
import { getContingencyListEmptyFormData, getScriptFormDataFromFetchedElement } from '../../contingency-list-utils';
import { getContingencyList, saveScriptContingencyList } from 'utils/rest-api';
import yup from 'components/utils/yup-config';
import ScriptEditionForm from './script-edition-form';
import { useDispatch, useSelector } from 'react-redux';
import { noSelectionForCopy } from 'utils/constants';
import { setSelectionForCopy } from '../../../../../redux/actions';
import { AppState } from 'redux/reducer';

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

interface ScriptEditionDialogProps {
    contingencyListId: string;
    contingencyListType: string;
    open: boolean;
    onClose: (event?: React.SyntheticEvent) => void;
    titleId: string;
    name: string;
    broadcastChannel: BroadcastChannel;
}

const ScriptEditionDialog: FunctionComponent<ScriptEditionDialogProps> = ({
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
        if (contingencyListId) {
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
        }
    }, [contingencyListId, contingencyListType, name, reset, snackError]);

    const closeAndClear = (event?: SyntheticEvent) => {
        reset(emptyFormData());
        onClose(event);
    };

    const editContingencyList = (contingencyListId: string, contingencyList: ScriptEditionFormData) => {
        const newScript = {
            id: contingencyListId,
            script: contingencyList[FieldConstants.SCRIPT],
        };
        return saveScriptContingencyList(newScript, contingencyList[FieldConstants.NAME]);
    };
    const onSubmit = (contingencyList: ScriptEditionFormData) => {
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
            disabledSave={Boolean(!!nameError || isValidating)}
            isDataFetching={isFetching}
            unscrollableFullHeight
        >
            {!isFetching && <ScriptEditionForm />}
        </CustomMuiDialog>
    );
};

export default ScriptEditionDialog;
