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
    useTabs,
} from '@gridsuite/commons-ui';
import { FieldValues, useForm } from 'react-hook-form';
import { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { ObjectSchema } from 'yup';
import { Breakpoint } from '@mui/material';

export interface ModificationDialogProps<FormData extends FieldValues, ModificationData extends WithId> {
    open: CustomMuiDialogProps['open'];
    onClose: CustomMuiDialogProps['onClose'];
    titleId: CustomMuiDialogProps['titleId'];
    modificationUuid: UUID;
    ModificationForm: FunctionComponent<any>;
    formSchema: ObjectSchema<FormData>;
    dtoToForm: (dto: ModificationData) => FormData;
    formToDto: (form: FormData, dto?: ModificationData) => Omit<ModificationData, 'uuid'>;
    errorHeaderId: string;
    isModification?: boolean;
    removeOptional?: boolean;
    unscrollableFullHeight?: boolean;
    dialogWidth?: Breakpoint;
    getExtraFormProps?: (dto: ModificationData) => Record<string, unknown>;
    tabsProps?: UseTabsProps;
}

export type UseTabsProps = {
    defaultTab: any;
    tabFields: Partial<Record<number, string[]>>;
};

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
    tabsProps,
    errorHeaderId,
    dialogWidth,
    isModification = false,
    removeOptional = true,
    unscrollableFullHeight = false,
    getExtraFormProps,
}: Readonly<ModificationDialogProps<FormData, ModificationData>>) {
    const { snackError } = useSnackMessage();
    const [modificationData, setModificationData] = useState<ModificationData>();

    const formMethods = useForm<FormData>({
        resolver: yupResolver(formSchema) as any, // really difficult to type with yup inferred types
    });

    const { errors } = formMethods.formState;

    const useTabsReturn = useTabs({
        defaultTab: tabsProps?.defaultTab,
        errors,
        tabFields: tabsProps?.tabFields,
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
                    body: JSON.stringify(formToDto(form, modificationData)),
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
            formContext={{
                ...formMethods,
                validationSchema: formSchema,
                removeOptional,
            }}
            onClose={onClose}
            onSave={onSubmit}
            onValidationError={useTabsReturn?.onError}
            titleId={titleId}
            isDataFetching={!modificationData}
            unscrollableFullHeight={unscrollableFullHeight}
            dialogWidth={dialogWidth}
        >
            <ModificationForm
                isModification={isModification}
                useTabsReturn={useTabsReturn}
                {...(modificationData && getExtraFormProps?.(modificationData))}
            />
        </CustomMuiDialog>
    );
}
