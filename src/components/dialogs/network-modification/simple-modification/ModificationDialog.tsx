/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { UUID } from 'node:crypto';
import {
    CustomMuiDialog,
    CustomMuiDialogProps,
    fetchNetworkModification,
    removeNullFields,
    snackWithFallback,
    updateModification,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { FieldValues, useForm } from 'react-hook-form';
import { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { ObjectSchema } from 'yup';

export interface ModificationDialogProps<FormData extends FieldValues, ModificationData extends WithId> {
    open: CustomMuiDialogProps['open'];
    onClose: CustomMuiDialogProps['onClose'];
    language: CustomMuiDialogProps['language'];
    titleId: CustomMuiDialogProps['titleId'];
    modificationUuid: UUID;
    ModificationForm: FunctionComponent;
    formSchema: ObjectSchema<FormData>;
    dtoToForm: (dto: ModificationData) => FormData;
    formToDto: (form: FormData) => Omit<ModificationData, 'uuid'>;
    errorHeaderId: string;
}

interface WithId {
    uuid: UUID;
}

export function ModificationDialog<FormData extends FieldValues, ModificationData extends WithId>({
    open,
    onClose,
    language,
    titleId,
    ModificationForm,
    modificationUuid,
    formSchema,
    dtoToForm,
    formToDto,
    errorHeaderId,
}: Readonly<ModificationDialogProps<FormData, ModificationData>>) {
    const { snackError } = useSnackMessage();
    const [modificationData, setModificationData] = useState<ModificationData>();

    const formMethods = useForm<FormData>({
        resolver: yupResolver(formSchema) as any, // really difficult to type with yup inferred types
    });

    useEffect(() => {
        if (modificationData) {
            formMethods.reset(dtoToForm(modificationData));
        }
    }, [formMethods, modificationData, dtoToForm]);

    useEffect(() => {
        fetchNetworkModification(modificationUuid)
            .then((res) => res.json())
            .then((res) => setModificationData(removeNullFields(res)))
            .catch((error: unknown) => {
                snackWithFallback(snackError, error, {
                    headerId: 'ModificationReadError',
                });
                onClose();
            });
    }, [modificationUuid, onClose, snackError]);

    const onSubmit = useCallback(
        (form: FormData) => {
            if (modificationData) {
                updateModification({
                    modificationUuid: modificationData.uuid,
                    body: JSON.stringify(formToDto(form)),
                }).catch((error: unknown) => {
                    snackWithFallback(snackError, error, { headerId: errorHeaderId });
                });
            }
        },
        [modificationData, formToDto, snackError, errorHeaderId]
    );

    return (
        <CustomMuiDialog
            open={open}
            formSchema={formSchema}
            formMethods={formMethods}
            onClose={onClose}
            onSave={onSubmit}
            titleId={titleId}
            isDataFetching={!modificationData}
            language={language}
        >
            <ModificationForm />
        </CustomMuiDialog>
    );
}
