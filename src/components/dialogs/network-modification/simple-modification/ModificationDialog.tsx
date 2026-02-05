/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { CustomMuiDialog, CustomMuiDialogProps } from '@gridsuite/commons-ui';
import { useUpdateModification, UseUpdateModificationProps, WithId } from './useUpdateModification';
import { FieldValues } from 'react-hook-form';
import { FunctionComponent } from 'react';

export interface ModificationDialogProps<
    FormData extends FieldValues,
    ModificationData extends WithId,
> extends UseUpdateModificationProps<FormData, ModificationData> {
    open: CustomMuiDialogProps['open'];
    onClose: CustomMuiDialogProps['onClose'];
    language: CustomMuiDialogProps['language'];
    titleId: CustomMuiDialogProps['titleId'];
    ModificationForm: FunctionComponent;
}

/**
 * Dialog to update a substation creation
 */
export function ModificationDialog<FormData extends FieldValues, ModificationData extends WithId>({
    open,
    onClose,
    language,
    titleId,
    ModificationForm,
    ...useUpdateModificationProps
}: Readonly<ModificationDialogProps<FormData, ModificationData>>) {
    const { formMethods, onSubmit } = useUpdateModification<FormData, ModificationData>(useUpdateModificationProps);

    return (
        <CustomMuiDialog
            open={open}
            formSchema={useUpdateModificationProps.formSchema}
            formMethods={formMethods}
            onClose={onClose}
            onSave={onSubmit}
            titleId={titleId}
            isDataFetching={!useUpdateModificationProps.modificationData}
            language={language}
        >
            <ModificationForm />
        </CustomMuiDialog>
    );
}
