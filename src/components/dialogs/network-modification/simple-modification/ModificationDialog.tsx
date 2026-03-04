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
import { FieldErrors, FieldValues, useForm } from 'react-hook-form';
import { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { ObjectSchema } from 'yup';

export interface ModificationFormProps {
    tabIndex: number;
}

export interface ModificationDialogProps<FormData extends FieldValues, ModificationData extends WithId> {
    open: CustomMuiDialogProps['open'];
    onClose: CustomMuiDialogProps['onClose'];
    titleId: CustomMuiDialogProps['titleId'];
    modificationUuid: UUID;
    formSchema: ObjectSchema<FormData>;
    dtoToForm: (dto: ModificationData) => FormData;
    formToDto: (form: FormData) => Omit<ModificationData, 'uuid'>;
    errorHeaderId: string;
    HeaderForm?: FunctionComponent<any>;
    ModificationForm: React.ComponentType<ModificationFormProps>;
    tabsInError?: (errors: FieldErrors) => number[];
}

interface WithId {
    uuid: UUID;
}

export function ModificationDialog<FormData extends FieldValues, ModificationData extends WithId>({
    open,
    onClose,
    titleId,
    ModificationForm,
    modificationUuid,
    formSchema,
    dtoToForm,
    formToDto,
    errorHeaderId,
    HeaderForm,
    tabsInError,
}: Readonly<ModificationDialogProps<FormData, ModificationData>>) {
    const { snackError } = useSnackMessage();
    const [modificationData, setModificationData] = useState<ModificationData>();
    const [tabIndexesWithError, setTabIndexesWithError] = useState<number[]>([]);
    const [tabIndex, setTabIndex] = useState<number>(0);

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

    const onValidationError = (errors: FieldErrors) => {
        const errorTabs = tabsInError ? tabsInError(errors) : [];
        if (errorTabs.length > 0) {
            setTabIndex(errorTabs[0]);
        }
        setTabIndexesWithError(errorTabs);
    };

    const headerAndTabs = HeaderForm ? (
        <HeaderForm tabIndexesWithError={tabIndexesWithError} tabIndex={tabIndex} setTabIndex={setTabIndex} />
    ) : null;

    return (
        <CustomMuiDialog
            open={open}
            formSchema={formSchema}
            formMethods={formMethods}
            onClose={onClose}
            onSave={onSubmit}
            onValidationError={onValidationError}
            titleId={titleId}
            subtitle={headerAndTabs}
            isDataFetching={!modificationData}
        >
            <ModificationForm tabIndex={tabIndex} />
        </CustomMuiDialog>
    );
}
