/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useSelector } from 'react-redux';
import {
    CustomMuiDialog,
    FieldConstants,
    getCriteriaBasedSchema,
    MAX_CHAR_DESCRIPTION,
    useSnackMessage,
    yupConfig as yup,
} from '@gridsuite/commons-ui';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { createContingencyList } from '../../../../utils/rest-api';
import ContingencyListCreationForm from './contingency-list-creation-form';
import {
    ContingencyListFormData,
    ContingencyListFormDataWithRequiredCriteria,
    getContingencyListEmptyFormData,
    getFormContent,
} from '../contingency-list-utils';
import { ContingencyListType } from '../../../../utils/elementType';
import { useParameterState } from '../../use-parameters-dialog';
import { PARAM_LANGUAGE } from '../../../../utils/config-params';
import { AppState } from '../../../../redux/types';
import { getExplicitNamingSchema } from '../explicit-naming/explicit-naming-utils';
import { handleNotAllowedError } from '../../../utils/rest-errors';

const schema = yup.object().shape({
    [FieldConstants.NAME]: yup.string().trim().required('nameEmpty'),
    [FieldConstants.DESCRIPTION]: yup.string().max(MAX_CHAR_DESCRIPTION),
    [FieldConstants.CONTINGENCY_LIST_TYPE]: yup.string().nullable(),
    [FieldConstants.SCRIPT]: yup.string().nullable(),
    [FieldConstants.EQUIPMENT_TYPE]: yup.string().when([FieldConstants.CONTINGENCY_LIST_TYPE], {
        is: ContingencyListType.CRITERIA_BASED.id,
        then: (schemaThen) => schemaThen.required(),
        otherwise: (schemaOtherwise) => schemaOtherwise.nullable(),
    }),
    ...getExplicitNamingSchema(),
    ...getCriteriaBasedSchema(),
});

const emptyFormData = getContingencyListEmptyFormData();

export interface ContingencyListCreationDialogProps {
    onClose: () => void;
    open: boolean;
    titleId: string;
}

export default function ContingencyListCreationDialog({
    onClose,
    open,
    titleId,
}: Readonly<ContingencyListCreationDialogProps>) {
    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);
    const { snackError } = useSnackMessage();

    const [languageLocal] = useParameterState(PARAM_LANGUAGE);

    const methods = useForm<ContingencyListFormData>({
        defaultValues: emptyFormData,
        resolver: yupResolver<ContingencyListFormData>(schema),
    });

    const {
        reset,
        formState: { errors },
    } = methods;

    const nameError = errors[FieldConstants.NAME];
    const isValidating = errors.root?.isValidating;

    const closeAndClear = () => {
        reset(emptyFormData);
        onClose();
    };

    const onSubmit = (data: ContingencyListFormDataWithRequiredCriteria) => {
        const formContent = getFormContent(null, data);
        createContingencyList(
            data[FieldConstants.CONTINGENCY_LIST_TYPE],
            data[FieldConstants.NAME],
            data[FieldConstants.DESCRIPTION] ?? '',
            formContent,
            // @ts-expect-error TODO: manage null case of activeDirectory
            activeDirectory
        )
            .then(() => closeAndClear())
            .catch((error) => {
                if (!handleNotAllowedError(error, snackError)) {
                    snackError({
                        messageTxt: error.message,
                        headerId: 'contingencyListCreationError',
                        headerValues: { name: data[FieldConstants.NAME] },
                    });
                }
            });
    };
    return (
        <CustomMuiDialog
            open={open}
            onClose={closeAndClear}
            onSave={onSubmit}
            formSchema={schema}
            // @ts-expect-error TODO: formSchema is of type ContingencyListFormDataWithRequiredCriteria but formMethods of type ContingencyListFormData
            formMethods={methods}
            titleId={titleId}
            removeOptional
            disabledSave={Boolean(nameError || isValidating)}
            language={languageLocal}
            unscrollableFullHeight
        >
            <ContingencyListCreationForm />
        </CustomMuiDialog>
    );
}
