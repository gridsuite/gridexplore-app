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
    TreeViewFinderNodeProps,
    useSnackMessage,
    yupConfig as yup,
} from '@gridsuite/commons-ui';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { useCallback, useEffect, useState } from 'react';
import { UUID } from 'crypto';
import { ObjectSchema } from 'yup';
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
import { FilterBasedContingencyList } from '../../../../utils/contingency-list.type';

const schema: ObjectSchema<ContingencyListFilterBasedFormData> = yup.object().shape({
    [FieldConstants.NAME]: yup.string().required(),
    [FieldConstants.DESCRIPTION]: yup.string().max(MAX_CHAR_DESCRIPTION),
    [FieldConstants.FILTERS]: yup.array().required(),
});

export interface ContingencyListFilterBasedFormData {
    [FieldConstants.NAME]: string;
    [FieldConstants.DESCRIPTION]?: string;
    [FieldConstants.FILTERS]: TreeViewFinderNodeProps[];
}

const getContingencyListEmptyFormData = (name = '') => ({
    [FieldConstants.NAME]: name,
    [FieldConstants.DESCRIPTION]: '',
    [FieldConstants.FILTERS]: [],
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
    const intl = useIntl();
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
                filters: data[FieldConstants.FILTERS]?.map((item: TreeViewFinderNodeProps) => {
                    return {
                        id: item.id,
                    };
                }),
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
                        if (handleNotAllowedError(error, snackError, intl)) {
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
                        if (handleNotAllowedError(error, snackError, intl)) {
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
        [activeDirectory, closeAndClear, id, intl, snackError]
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
            unscrollableFullHeight
            disabledSave={Boolean(!!nameError || isValidating)}
            isDataFetching={isFetching}
        >
            <ContingencyListFilterBasedForm />
        </CustomMuiDialog>
    );
}
