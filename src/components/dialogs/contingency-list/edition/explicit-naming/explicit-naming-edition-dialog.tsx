/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
    CustomMuiDialog,
    FieldConstants,
    MAX_CHAR_DESCRIPTION,
    NO_ITEM_SELECTION_FOR_COPY,
    useSnackMessage,
    yupConfig as yup,
} from '@gridsuite/commons-ui';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useState } from 'react';
import { getContingencyList, saveExplicitNamingContingencyList } from 'utils/rest-api';
import { prepareContingencyListForBackend } from 'components/dialogs/contingency-list-helper';
import { useDispatch, useSelector } from 'react-redux';
import {
    getContingencyListEmptyFormData,
    getExplicitNamingFormDataFromFetchedElement,
} from '../../contingency-list-utils';
import ExplicitNamingEditionForm from './explicit-naming-edition-form';
import { setItemSelectionForCopy } from '../../../../../redux/actions';
import { AppState } from '../../../../../redux/types';
import { getExplicitNamingEditSchema } from '../../explicit-naming/explicit-naming-utils';

interface ExplicitNamingEditionFormData {
    [FieldConstants.NAME]: string;
    [FieldConstants.DESCRIPTION]?: string;
    [FieldConstants.EQUIPMENT_TYPE]?: string | null;
    [FieldConstants.EQUIPMENT_TABLE]?: {
        [FieldConstants.CONTINGENCY_NAME]?: string | null;
        [FieldConstants.EQUIPMENT_IDS]?: (string | null | undefined)[];
    }[];
}

const schema = yup.object().shape({
    [FieldConstants.NAME]: yup.string().trim().required('nameEmpty'),
    [FieldConstants.EQUIPMENT_TYPE]: yup.string().nullable(),
    [FieldConstants.DESCRIPTION]: yup.string().max(MAX_CHAR_DESCRIPTION),
    ...getExplicitNamingEditSchema(),
});

const emptyFormData = (name?: string) => getContingencyListEmptyFormData(name);

export interface ExplicitNamingEditionDialogProps {
    contingencyListId: string;
    contingencyListType: string;
    open: boolean;
    onClose: () => void;
    titleId: string;
    name: string;
    broadcastChannel: BroadcastChannel;
    description: string;
}

export default function ExplicitNamingEditionDialog({
    contingencyListId,
    contingencyListType,
    open,
    onClose,
    titleId,
    name,
    broadcastChannel,
    description,
}: Readonly<ExplicitNamingEditionDialogProps>) {
    const [isFetching, setIsFetching] = useState(!!contingencyListId);
    const { snackError } = useSnackMessage();
    const itemSelectionForCopy = useSelector((state: AppState) => state.itemSelectionForCopy);
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
                    const formData = getExplicitNamingFormDataFromFetchedElement(response, name, description);
                    reset({ ...formData });
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
        reset(emptyFormData());
        onClose();
    };

    const editContingencyList = (contingencyListId2: string, contingencyList: ExplicitNamingEditionFormData) => {
        const equipments = prepareContingencyListForBackend(contingencyListId2, contingencyList);
        return saveExplicitNamingContingencyList(
            equipments,
            contingencyList[FieldConstants.NAME],
            contingencyList[FieldConstants.DESCRIPTION] ?? ''
        );
    };

    const onSubmit = (contingencyList: ExplicitNamingEditionFormData) => {
        editContingencyList(contingencyListId, contingencyList)
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
            unscrollableFullHeight
        >
            {!isFetching && <ExplicitNamingEditionForm />}
        </CustomMuiDialog>
    );
}
