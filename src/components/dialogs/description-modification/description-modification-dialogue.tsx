/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FunctionComponent } from 'react';
import yup from '../../utils/yup-config';
import { DESCRIPTION } from '../../utils/field-constants';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { updateElement } from '../../../utils/rest-api';
import { TextInput, useSnackMessage } from '@gridsuite/commons-ui';
import CustomMuiDialog from '../commons/custom-mui-dialog/custom-mui-dialog';
import React from 'react';

interface IDescriptionModificationDialogue {
    elementUuid: string;
    description: string;
    open: boolean;
    onClose: () => void;
}

const schema = yup.object().shape({
    [DESCRIPTION]: yup.string().nullable(),
});

const DescriptionModificationDialogue: FunctionComponent<
    IDescriptionModificationDialogue
> = ({ elementUuid, description, open, onClose }) => {
    const { snackError } = useSnackMessage();

    const emptyFormData = {
        [DESCRIPTION]: description ?? '',
    };

    const methods = useForm({
        defaultValues: emptyFormData,
        resolver: yupResolver(schema),
    });

    const { reset } = methods;

    const onCancel = () => {
        reset({
            [DESCRIPTION]: '',
        });
        onClose();
    };

    const onSubmit = (data: { description: string }) => {
        updateElement(elementUuid, { ...data }).catch((error) => {
            snackError({
                messageTxt: error.message,
                headerId: 'descriptionModificationError',
            });
        });
    };

    return (
        <CustomMuiDialog
            open={open}
            onClose={onCancel}
            onSave={onSubmit}
            formSchema={schema}
            formMethods={methods}
            titleId={'descriptionModificationDialog'}
        >
            <TextInput name={DESCRIPTION} />
        </CustomMuiDialog>
    );
};

export default DescriptionModificationDialogue;
