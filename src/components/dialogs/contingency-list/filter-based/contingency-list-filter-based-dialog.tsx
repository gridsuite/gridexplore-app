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
    TreeViewFinderNodeProps,
} from '@gridsuite/commons-ui';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSelector } from 'react-redux';
import ContingencyListFilterBasedFrom from './contingency-list-filter-based-from';
import { AppState } from '../../../../redux/types';
import { createFilterBasedContingency } from '../../../../utils/rest-api';
import { handleNotAllowedError } from '../../../utils/rest-errors';

export interface FilterBasedContingencyListProps {
    titleId: string;
    open: boolean;
    onClose: () => void;
}

const schema: any = yup.object().shape({
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

export default function FilterBasedContingencyListDialog({
    titleId,
    open,
    onClose,
}: Readonly<FilterBasedContingencyListProps>) {
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    const { snackError } = useSnackMessage();

    const methods = useForm<ContingencyListFilterBasedFormData>({
        defaultValues: emptyFormData(),
        resolver: yupResolver(schema),
    });
    const {
        reset,
        formState: { errors },
    } = methods;

    const closeAndClear = () => {
        reset(emptyFormData());
        onClose();
    };

    const onSubmit = (data: ContingencyListFilterBasedFormData) => {
        createFilterBasedContingency(
            data[FieldConstants.NAME],
            data[FieldConstants.DESCRIPTION] ?? '',
            data[FieldConstants.FILTERS]?.map((item: TreeViewFinderNodeProps) => item.id),
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
    };

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
        >
            <ContingencyListFilterBasedFrom studyName="" />
        </CustomMuiDialog>
    );
}
