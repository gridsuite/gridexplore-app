/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useIntl } from 'react-intl';
import {
    CustomMuiDialog,
    DeepNullable,
    useTabs,
    VoltageLevelCreationDto,
    VoltageLevelCreationForm,
    VoltageLevelCreationFormData,
    voltageLevelCreationDtoToForm,
    voltageLevelCreationEmptyFormData,
    voltageLevelCreationFormSchema,
    voltageLevelCreationFormToDto,
    VoltageLevelTab,
    VOLTAGE_LEVEL_TAB_FIELDS,
} from '@gridsuite/commons-ui';

export interface FreeEntryVoltageLevelCreationPaneProps {
    open: boolean;
    onClose: () => void;
    onCreateVoltageLevel: (voltageLevel: VoltageLevelCreationDto) => Promise<string>;
    editData: VoltageLevelCreationDto | null;
}

function FreeEntryVoltageLevelCreationPane({
    titleId,
    open,
    onClose,
    onCreateVoltageLevel,
    editData,
}: Readonly<FreeEntryVoltageLevelCreationPaneProps & { titleId: string }>) {
    const intl = useIntl();

    const formMethods = useForm<DeepNullable<VoltageLevelCreationFormData>>({
        defaultValues: voltageLevelCreationEmptyFormData,
        resolver: yupResolver<DeepNullable<VoltageLevelCreationFormData>>(voltageLevelCreationFormSchema),
    });

    const { reset, formState } = formMethods;
    const useTabsReturn = useTabs<VoltageLevelTab>({
        defaultTab: VoltageLevelTab.SUBSTATION_TAB,
        errors: formState.errors,
        tabFields: VOLTAGE_LEVEL_TAB_FIELDS,
    });

    useEffect(() => {
        if (editData) {
            reset(voltageLevelCreationDtoToForm(editData, intl, false));
        }
    }, [editData, intl, reset]);

    return (
        <CustomMuiDialog
            open={open}
            onClose={onClose}
            onSave={(form: DeepNullable<VoltageLevelCreationFormData>) =>
                onCreateVoltageLevel(voltageLevelCreationFormToDto(form as VoltageLevelCreationFormData))
            }
            onValidationError={useTabsReturn.onError}
            titleId={titleId}
            formContext={{
                ...formMethods,
                validationSchema: voltageLevelCreationFormSchema,
                removeOptional: false,
            }}
        >
            <VoltageLevelCreationForm substationOptions={[]} useTabsReturn={useTabsReturn} />
        </CustomMuiDialog>
    );
}

export function NewVoltageLevelCreationPane(props: Readonly<FreeEntryVoltageLevelCreationPaneProps>) {
    return <FreeEntryVoltageLevelCreationPane {...props} titleId="CreateVoltageLevel" />;
}

export function AttachmentPointCreationPane(props: Readonly<FreeEntryVoltageLevelCreationPaneProps>) {
    return <FreeEntryVoltageLevelCreationPane {...props} titleId="SpecifyAttachmentPoint" />;
}
