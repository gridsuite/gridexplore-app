/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { FunctionComponent, useCallback } from 'react';
import yup from '../../utils/yup-config';
import { DESCRIPTION } from '../../utils/field-constants';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { updateElement } from '../../../utils/rest-api';
import { useSnackMessage } from '@gridsuite/commons-ui';
import CustomMuiDialog from '../commons/custom-mui-dialog/custom-mui-dialog';
import React from 'react';
import DescriptionInput from './description-input';

interface IDescriptionModificationDialogue {
    elementUuid: string;
    description: string;
    open: boolean;
    onClose: () => void;
}

const schema = yup.object().shape({
    [DESCRIPTION]: yup.string().max(500, 'descriptionLimitError'),
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

    const onSubmit = useCallback(
        (data: { description: string }) => {
            updateElement(elementUuid, {
                [DESCRIPTION]: data[DESCRIPTION].trim(),
            }).catch((error) => {
                snackError({
                    messageTxt: error.message,
                    headerId: 'descriptionModificationError',
                });
            });
        },
        [elementUuid, snackError]
    );

    return (
        <CustomMuiDialog
            open={open}
            onClose={onCancel}
            onSave={onSubmit}
            formSchema={schema}
            formMethods={methods}
            titleId={'description'}
            removeOptional={true}
        >
            <DescriptionInput minRows={3} sx={{ marginTop: '10px' }} />
        </CustomMuiDialog>
    );
};

export default DescriptionModificationDialogue;
