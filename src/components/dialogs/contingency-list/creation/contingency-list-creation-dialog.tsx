/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useSelector } from 'react-redux';
import { useSnackMessage, CustomMuiDialog, getCriteriaBasedSchema, FieldConstants } from '@gridsuite/commons-ui';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import { createContingencyList } from '../../../../utils/rest-api';
import { FunctionComponent, SyntheticEvent } from 'react';
import ContingencyListCreationForm from './contingency-list-creation-form';
import {
    ContingencyListFormData,
    ContingencyListFormDataWithRequiredCriteria,
    getContingencyListEmptyFormData,
    getFormContent,
} from '../contingency-list-utils';
import yup from '../../../utils/yup-config';
import { getExplicitNamingSchema } from '../explicit-naming/explicit-naming-form';
import { ContingencyListType } from '../../../../utils/elementType';
import { useParameterState } from '../../use-parameters-dialog';
import { PARAM_LANGUAGE } from '../../../../utils/config-params';
import { AppState } from 'redux/reducer';

const schema = yup.object().shape({
    [FieldConstants.NAME]: yup.string().trim().required('nameEmpty'),
    [FieldConstants.DESCRIPTION]: yup.string().max(500, 'descriptionLimitError'),
    [FieldConstants.CONTINGENCY_LIST_TYPE]: yup.string().nullable(),
    [FieldConstants.SCRIPT]: yup.string().nullable(),
    [FieldConstants.EQUIPMENT_TYPE]: yup.string().when([FieldConstants.CONTINGENCY_LIST_TYPE], {
        is: ContingencyListType.CRITERIA_BASED.id,
        then: (schema) => schema.required(),
        otherwise: (schema) => schema.nullable(),
    }),
    ...getExplicitNamingSchema(FieldConstants.EQUIPMENT_TABLE),
    ...getCriteriaBasedSchema({}),
});

const emptyFormData = getContingencyListEmptyFormData();

interface ContingencyListCreationDialogProps {
    onClose: (event?: SyntheticEvent) => void;
    open: boolean;
    titleId: string;
}

const ContingencyListCreationDialog: FunctionComponent<ContingencyListCreationDialogProps> = ({
    onClose,
    open,
    titleId,
}) => {
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

    const closeAndClear = (event?: SyntheticEvent) => {
        reset(emptyFormData);
        onClose(event);
    };

    const onSubmit = (data: ContingencyListFormData) => {
        const formContent = getFormContent(null, data as ContingencyListFormDataWithRequiredCriteria);
        createContingencyList(
            data[FieldConstants.CONTINGENCY_LIST_TYPE],
            data[FieldConstants.NAME],
            data[FieldConstants.DESCRIPTION],
            formContent,
            activeDirectory
        )
            .then(() => closeAndClear())
            .catch((error) => {
                snackError({
                    messageTxt: error.message,
                    headerId: 'contingencyListCreationError',
                    headerValues: { name: data[FieldConstants.NAME] },
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
            disabledSave={Boolean(nameError || isValidating)}
            language={languageLocal}
            unscrollableFullHeight
        >
            <ContingencyListCreationForm />
        </CustomMuiDialog>
    );
};

export default ContingencyListCreationDialog;
