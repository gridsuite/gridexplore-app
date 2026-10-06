/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
    CustomMuiDialog,
    DeepNullable,
    useTabs,
    LineCreationDto,
    LineCreationDtoWithId,
    LineForm,
    LineCreationFormData,
    lineCreationDtoToForm,
    lineCreationEmptyFormData,
    lineCreationFormSchema,
    lineCreationFormToDto,
    LineDialogTab,
    LINE_TAB_FIELDS,
} from '@gridsuite/commons-ui';

export interface FreeEntryLineCreationPaneProps {
    open: boolean;
    onClose: () => void;
    onCreateLine: (params: { lineCreationInfos: LineCreationDto }) => Promise<string>;
    editData: LineCreationDtoWithId | null;
}

// The attached line has no connectivity of its own, so connectivity stays disabled throughout.
const schema = lineCreationFormSchema(false);

export function FreeEntryLineCreationPane({
    open,
    onClose,
    onCreateLine,
    editData,
}: Readonly<FreeEntryLineCreationPaneProps>) {
    const formMethods = useForm<DeepNullable<LineCreationFormData>>({
        defaultValues: lineCreationEmptyFormData,
        resolver: yupResolver<DeepNullable<LineCreationFormData>>(schema),
    });

    const { reset, formState } = formMethods;
    const useTabsReturn = useTabs<LineDialogTab>({
        defaultTab: LineDialogTab.CHARACTERISTICS_TAB,
        errors: formState.errors,
        tabFields: LINE_TAB_FIELDS,
    });

    useEffect(() => {
        if (editData) {
            reset(lineCreationDtoToForm(editData));
        }
    }, [editData, reset]);

    return (
        <CustomMuiDialog
            open={open}
            onClose={onClose}
            onSave={(form: DeepNullable<LineCreationFormData>) => {
                onCreateLine({ lineCreationInfos: lineCreationFormToDto(form as LineCreationFormData) });
            }}
            onValidationError={useTabsReturn.onError}
            titleId="CreateLine"
            dialogWidth="xl"
            unscrollableFullHeight
            formContext={{
                ...formMethods,
                validationSchema: schema,
                removeOptional: false,
            }}
        >
            {/* voltageLevelOptions/fetchBusesOrBusbarSections are required props but unused once withConnectivity is false */}
            <LineForm
                withConnectivity={false}
                voltageLevelOptions={[]}
                fetchBusesOrBusbarSections={() => Promise.resolve([])}
                useTabsReturn={useTabsReturn}
            />
        </CustomMuiDialog>
    );
}
