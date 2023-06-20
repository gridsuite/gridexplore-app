/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useSelector } from 'react-redux';
import { useSnackMessage } from '@gridsuite/commons-ui';
import { CONTINGENCY_LIST_TYPE, NAME } from '../../../utils/field-constants';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import { createContingencyList } from '../../../../utils/rest-api';
import { useMemo } from 'react';
import CustomMuiDialog from '../../CustomMuiDialog';
import ContingencyListCreationForm from './contingency-list-creation-form';
import {
    getEmptyFormData,
    getFormContent,
    getSchema,
} from '../contingency-list-utils';

const emptyFormData = getEmptyFormData();

const ContingencyListCreationDialog = ({ onClose, open, titleId }) => {
    const activeDirectory = useSelector((state) => state.activeDirectory);
    const { snackError } = useSnackMessage();

    const schema = useMemo(() => getSchema(activeDirectory), [activeDirectory]);

    const methods = useForm({
        defaultValues: emptyFormData,
        resolver: yupResolver(schema),
    });

    const { reset } = methods;

    const closeAndClear = (event) => {
        reset(emptyFormData, { keepDefaultValues: true });
        onClose(event);
    };

    const handleClose = (event) => {
        closeAndClear(event);
    };

    const onSubmit = (data) => {
        const formContent = getFormContent(null, data);
        createContingencyList(
            data[CONTINGENCY_LIST_TYPE],
            data[NAME],
            formContent,
            activeDirectory
        )
            .then(() => handleClose())
            .catch((errorMessage) => {
                snackError({
                    messageTxt: errorMessage,
                    headerId: 'contingencyListCreationError',
                    headerValues: { name: data[NAME] },
                });
            });
    };
    return (
        <CustomMuiDialog
            open={open}
            onClose={closeAndClear}
            onSave={onSubmit}
            schema={schema}
            methods={methods}
            titleId={titleId}
        >
            <ContingencyListCreationForm />
        </CustomMuiDialog>
    );
};

export default ContingencyListCreationDialog;
