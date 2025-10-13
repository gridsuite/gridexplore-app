/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
    CustomMuiDialog,
    FieldConstants,
    MAX_CHAR_DESCRIPTION,
    useSnackMessage,
    yupConfig as yup,
} from '@gridsuite/commons-ui';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSelector } from 'react-redux';
import { useCallback, useEffect, useState } from 'react';
import { UUID } from 'node:crypto';
import { ObjectSchema } from 'yup';
import {
    ContingencyFieldConstants,
    FilterBasedContingencyList,
    FilterElement,
    FilterSubEquipments,
} from '../../../../utils/contingency-list.type';
import ContingencyListFilterBasedForm from './contingency-list-filter-based-form';
import { AppState } from '../../../../redux/types';
import {
    createFilterBasedContingency,
    getContingencyList,
    saveFilterBasedContingencyList,
} from '../../../../utils/rest-api';
import { handleNotAllowedError } from '../../../utils/rest-errors';
import { ContingencyListType } from '../../../../utils/elementType';
import { getFilterBasedFormDataFromFetchedElement } from '../contingency-list-utils';

const schema: ObjectSchema<ContingencyListFilterBasedFormData> = yup.object().shape({
    [FieldConstants.NAME]: yup.string().required(),
    [FieldConstants.DESCRIPTION]: yup.string().max(MAX_CHAR_DESCRIPTION),
    [FieldConstants.FILTERS]: yup.array().required(),
    [ContingencyFieldConstants.SUB_EQUIPMENT_TYPES_BY_FILTER]: yup
        .array()
        .required()
        .of(
            yup.object().shape({
                [ContingencyFieldConstants.FILTER_ID]: yup.string().required(),
                [ContingencyFieldConstants.SUB_EQUIPMENT_TYPES]: yup.array().required().of(yup.string().required()),
            })
        ),
});

export interface ContingencyListFilterBasedFormData {
    [FieldConstants.NAME]: string;
    [FieldConstants.DESCRIPTION]?: string;
    [FieldConstants.FILTERS]: FilterElement[];
    [ContingencyFieldConstants.SUB_EQUIPMENT_TYPES_BY_FILTER]: FilterSubEquipments[];
}

const getContingencyListEmptyFormData = (name = '') => ({
    [FieldConstants.NAME]: name,
    [FieldConstants.DESCRIPTION]: '',
    [FieldConstants.FILTERS]: [],
    [ContingencyFieldConstants.SUB_EQUIPMENT_TYPES_BY_FILTER]: [],
});

const emptyFormData = (name?: string) => getContingencyListEmptyFormData(name);

export interface FilterBasedContingencyListProps {
    titleId: string;
    open: boolean;
    onClose: () => void;
    name?: string;
    description?: string;
    id?: UUID;
}

export default function FilterBasedContingencyListDialog({
    titleId,
    open,
    onClose,
    name,
    description,
    id,
}: Readonly<FilterBasedContingencyListProps>) {
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    const { snackError } = useSnackMessage();
    const [isFetching, setIsFetching] = useState(!!id);

    const methods = useForm<ContingencyListFilterBasedFormData>({
        defaultValues: emptyFormData(),
        resolver: yupResolver(schema),
    });
    const {
        reset,
        formState: { errors },
    } = methods;

    useEffect(() => {
        if (id) {
            setIsFetching(true);
            getContingencyList(ContingencyListType.FILTERS.id, id?.toString())
                .then((response) => {
                    const formData: ContingencyListFilterBasedFormData = getFilterBasedFormDataFromFetchedElement(
                        response,
                        name ?? '',
                        description ?? ''
                    );
                    reset({ ...formData });
                })
                .catch((error) => {
                    snackError({
                        messageTxt: error.message,
                        headerId: 'cannotRetrieveContingencyList',
                    });
                })
                .finally(() => setIsFetching(false));
        }
    }, [id, name, reset, snackError, description]);

    const closeAndClear = useCallback(() => {
        reset(emptyFormData());
        onClose();
    }, [onClose, reset]);

    const onSubmit = useCallback(
        (data: ContingencyListFilterBasedFormData) => {
            const filterBaseContingencyList: FilterBasedContingencyList = {
                filters: data[FieldConstants.FILTERS]?.map((filter) => {
                    return {
                        id: filter.id,
                    };
                }),
                selectedEquipmentTypesByFilter: data[ContingencyFieldConstants.SUB_EQUIPMENT_TYPES_BY_FILTER]?.map(
                    (filterSubEquipments) => ({
                        id: filterSubEquipments[ContingencyFieldConstants.FILTER_ID],
                        equipmentTypes: filterSubEquipments[ContingencyFieldConstants.SUB_EQUIPMENT_TYPES],
                    })
                ),
            };

            if (id) {
                saveFilterBasedContingencyList(
                    id,
                    data[FieldConstants.NAME],
                    data[FieldConstants.DESCRIPTION] ?? '',
                    filterBaseContingencyList
                )
                    .then(() => closeAndClear())
                    .catch((error) => {
                        if (handleNotAllowedError(error, snackError)) {
                            return;
                        }
                        snackError({
                            messageTxt: error.message,
                            headerId: 'contingencyListEditingError',
                            headerValues: { name: data[FieldConstants.NAME] },
                        });
                    });
            } else {
                createFilterBasedContingency(
                    data[FieldConstants.NAME],
                    data[FieldConstants.DESCRIPTION] ?? '',
                    filterBaseContingencyList,
                    activeDirectory
                )
                    .then(() => closeAndClear())
                    .catch((error) => {
                        if (handleNotAllowedError(error, snackError)) {
                            return;
                        }
                        snackError({
                            messageTxt: error.message,
                            headerId: 'contingencyListCreationError',
                            headerValues: { name: data[FieldConstants.NAME] },
                        });
                    });
            }
        },
        [activeDirectory, closeAndClear, id, snackError]
    );

    const nameError = errors[FieldConstants.NAME];
    const isValidating = errors.root?.isValidating;

    return (
        <CustomMuiDialog
            titleId={titleId}
            open={open}
            onClose={closeAndClear}
            onSave={onSubmit}
            formSchema={schema}
            formMethods={methods}
            disabledSave={Boolean(!!nameError || isValidating)}
            isDataFetching={isFetching}
            sx={{
                '.MuiDialog-paper': {
                    minWidth: '60vw',
                },
            }}
        >
            <ContingencyListFilterBasedForm />
        </CustomMuiDialog>
    );
}
