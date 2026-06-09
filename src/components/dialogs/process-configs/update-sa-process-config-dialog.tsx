/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { CustomMuiDialog, FieldConstants } from '@gridsuite/commons-ui';
import { useCallback, useEffect, useState } from 'react';
import { UUID } from 'node:crypto';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { LinearProgress } from '@mui/material';
import { fetchSAProcessConfig, updateSAProcessConfig } from '../../../utils/rest-api';
import { UpdateSaProcessConfig } from './update-sa-process-config';
import {
    getSAProcessConfigFormDataFromFetchedElement,
    getSAProcessConfigBackendFromFormData,
    updateProcessConfigFormSchema,
    UpdateSAProcessConfigFormData,
} from './update-process-configs-utils';

interface UpdateSAProcessConfigDialogProps {
    open: boolean;
    onClose: () => void;
    processConfigId: UUID;
    name: string;
    description: string | null;
    directory?: UUID;
}

export function UpdateSAProcessConfigDialog({
    onClose,
    open,
    processConfigId,
    description,
    name,
    directory,
}: Readonly<UpdateSAProcessConfigDialogProps>) {
    const [isLoading, setIsLoading] = useState(false);

    const emptyFormData = {
        name,
        description: description ?? '',
        modifications: [],
        loadflowParameters: [],
        securityAnalysisParameters: [],
    };

    const methods = useForm<UpdateSAProcessConfigFormData>({
        defaultValues: emptyFormData,
        resolver: yupResolver<UpdateSAProcessConfigFormData>(updateProcessConfigFormSchema),
    });

    const {
        reset,
        formState: { errors },
    } = methods;

    useEffect(() => {
        setIsLoading(true);
        fetchSAProcessConfig(processConfigId)
            .then((processConfig) => {
                if (processConfig) {
                    const formData: UpdateSAProcessConfigFormData = getSAProcessConfigFormDataFromFetchedElement(
                        processConfig,
                        name,
                        description
                    );
                    reset({ ...formData });
                }
            })
            .finally(() => setIsLoading(false));
    }, [description, name, processConfigId, reset]);

    const handleUpdateProcessConfig = useCallback(
        (processConfigFormData: UpdateSAProcessConfigFormData) => {
            updateSAProcessConfig(
                processConfigId,
                processConfigFormData.name,
                processConfigFormData.description ?? '',
                getSAProcessConfigBackendFromFormData(processConfigFormData)
            ).then(() => onClose());
        },
        [processConfigId, onClose]
    );

    const nameError = errors[FieldConstants.NAME];
    const isValidating = errors.root?.isValidating;

    return (
        <CustomMuiDialog
            titleId="editASProcessConfig"
            formContext={{
                ...methods,
                validationSchema: updateProcessConfigFormSchema,
                removeOptional: true,
            }}
            open={open}
            onClose={onClose}
            onSave={handleUpdateProcessConfig}
            disabledSave={Boolean(nameError || isValidating)}
        >
            {!isLoading && <UpdateSaProcessConfig directory={directory} processConfigName={name} />}
            {isLoading && <LinearProgress />}
        </CustomMuiDialog>
    );
}
