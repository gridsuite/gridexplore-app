/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FilterType } from '../../../../utils/elementType';
import { noSelectionForCopy } from '../../../../utils/constants';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { getFilterById } from '../../../../utils/rest-api';
import { useSnackMessage } from '@gridsuite/commons-ui';
import CustomMuiDialog from '../../commons/custom-mui-dialog/custom-mui-dialog';
import yup from '../../../utils/yup-config';
import {
    EQUIPMENT_TYPE,
    FILTER_TYPE,
    NAME,
} from '../../../utils/field-constants';
import { FetchStatus } from '../../../../utils/custom-hooks';
import { FilterForm } from '../filter-form';
import { EXPERT_FILTER_QUERY, expertFilterSchema } from './expert-filter-form';
import { saveExpertFilter } from '../filters-utils';
import { importExpertRules } from './expert-filter-utils';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectionForCopy } from '../../../../redux/actions';

const formSchema = yup
    .object()
    .shape({
        [NAME]: yup.string().trim().required('nameEmpty'),
        [FILTER_TYPE]: yup.string().required(),
        [EQUIPMENT_TYPE]: yup.string().required(),
        ...expertFilterSchema,
    })
    .required();

interface ExpertFilterEditionDialogProps {
    id: string;
    name: string;
    titleId: string;
    open: boolean;
    onClose: () => void;
    broadcastChannel: BroadcastChannel;
}

const ExpertFilterEditionDialog = ({
    id,
    name,
    titleId,
    open,
    onClose,
    broadcastChannel,
}: ExpertFilterEditionDialogProps) => {
    const { snackError } = useSnackMessage();
    const [dataFetchStatus, setDataFetchStatus] = useState(FetchStatus.IDLE);
    const selectionForCopy = useSelector(
        (state: any) => state.selectionForCopy
    );
    const dispatch = useDispatch();
    // default values are set via reset when we fetch data
    const formMethods = useForm({
        resolver: yupResolver(formSchema),
    });

    const {
        reset,
        formState: { errors },
    } = formMethods;

    const nameError = errors[NAME];
    const isValidating = errors.root?.isValidating;

    // Fetch the filter data from back-end if necessary and fill the form with it
    useEffect(() => {
        if (id && open) {
            setDataFetchStatus(FetchStatus.FETCHING);
            getFilterById(id)
                .then((response: { [prop: string]: any }) => {
                    setDataFetchStatus(FetchStatus.FETCH_SUCCESS);
                    reset({
                        [NAME]: name,
                        [FILTER_TYPE]: FilterType.EXPERT.id,
                        [EQUIPMENT_TYPE]: response[EQUIPMENT_TYPE],
                        [EXPERT_FILTER_QUERY]: importExpertRules(
                            response[EXPERT_FILTER_QUERY]
                        ),
                    });
                })
                .catch((error) => {
                    setDataFetchStatus(FetchStatus.FETCH_ERROR);
                    snackError({
                        messageTxt: error.message,
                        headerId: 'cannotRetrieveFilter',
                    });
                });
        }
    }, [id, name, open, reset, snackError]);

    const onSubmit = useCallback(
        (filterForm: { [prop: string]: any }) => {
            saveExpertFilter(
                id,
                filterForm[EXPERT_FILTER_QUERY],
                filterForm[EQUIPMENT_TYPE],
                filterForm[NAME],
                '', // The description can not be edited from this dialog
                false,
                null,
                onClose,
                (error: string) => {
                    snackError({
                        messageTxt: error,
                    });
                }
            );
            if (selectionForCopy.sourceItemUuid === id) {
                dispatch(setSelectionForCopy(noSelectionForCopy));
                broadcastChannel.postMessage({
                    noSelectionForCopy,
                });
            }
        },
        [
            broadcastChannel,
            dispatch,
            id,
            onClose,
            selectionForCopy.sourceItemUuid,
            snackError,
        ]
    );

    const isDataReady = dataFetchStatus === FetchStatus.FETCH_SUCCESS;

    return (
        <CustomMuiDialog
            open={open}
            onClose={onClose}
            onSave={onSubmit}
            formSchema={formSchema}
            formMethods={formMethods}
            titleId={titleId}
            removeOptional={true}
            disabledSave={!!nameError || !!isValidating}
            isDataFetching={dataFetchStatus === FetchStatus.FETCHING}
        >
            {isDataReady && <FilterForm />}
        </CustomMuiDialog>
    );
};

export default ExpertFilterEditionDialog;
