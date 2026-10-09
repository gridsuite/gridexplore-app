/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useIntl } from 'react-intl';
import {
    CustomMuiDialog,
    DeepNullable,
    FieldConstants,
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

// An attachment point is a voltage level reduced to just its substation: structure (busbar sections) and
// nominal voltage are not meaningful for it, and it always needs a brand-new substation.
const applyAttachmentPointOverrides = (formData: VoltageLevelCreationFormData): VoltageLevelCreationFormData => ({
    ...formData,
    [FieldConstants.HIDE_NOMINAL_VOLTAGE]: true,
    [FieldConstants.HIDE_BUS_BAR_SECTION]: true,
    [FieldConstants.ADD_SUBSTATION_CREATION]: true,
});

function FreeEntryVoltageLevelCreationPane({
    titleId,
    isAttachmentPoint,
    open,
    onClose,
    onCreateVoltageLevel,
    editData,
}: Readonly<FreeEntryVoltageLevelCreationPaneProps & { titleId: string; isAttachmentPoint: boolean }>) {
    const intl = useIntl();

    const defaultValues = useMemo(
        () =>
            isAttachmentPoint
                ? applyAttachmentPointOverrides(voltageLevelCreationEmptyFormData)
                : voltageLevelCreationEmptyFormData,
        [isAttachmentPoint]
    );

    const formMethods = useForm<DeepNullable<VoltageLevelCreationFormData>>({
        defaultValues,
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
            const formData = voltageLevelCreationDtoToForm(editData, intl, false);
            reset(isAttachmentPoint ? applyAttachmentPointOverrides(formData) : formData);
        }
    }, [editData, intl, isAttachmentPoint, reset]);

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
            <VoltageLevelCreationForm
                substationOptions={[]}
                showDeleteSubstationButton={!isAttachmentPoint}
                useTabsReturn={useTabsReturn}
            />
        </CustomMuiDialog>
    );
}

export function NewVoltageLevelCreationPane(props: Readonly<FreeEntryVoltageLevelCreationPaneProps>) {
    return <FreeEntryVoltageLevelCreationPane {...props} titleId="CreateVoltageLevel" isAttachmentPoint={false} />;
}

export function AttachmentPointCreationPane(props: Readonly<FreeEntryVoltageLevelCreationPaneProps>) {
    return <FreeEntryVoltageLevelCreationPane {...props} titleId="SpecifyAttachmentPoint" isAttachmentPoint />;
}
