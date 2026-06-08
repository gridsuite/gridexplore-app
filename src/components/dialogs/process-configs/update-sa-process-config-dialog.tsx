/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { CustomMuiDialog } from '@gridsuite/commons-ui';
import { useCallback, useEffect, useState } from 'react';
import { UUID } from 'node:crypto';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { LinearProgress } from '@mui/material';
import { ProcessType, SecurityAnalysisProcessConfigFromBack } from './process-configs.type';
import { fetchSAProcessConfig, updateSAProcessConfig } from '../../../utils/rest-api';
import { UpdateSaProcessConfig } from './update-sa-process-config';
import { getSAProcessConfigFormDataFromFetchedElement } from './update-process-configs-utils';

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
    const schema = yup.object().shape({
        name: yup.string().required(),
        description: yup.string(),
        modifications: yup
            .array()
            .required()
            .of(
                yup.object().shape({
                    modification: yup
                        .array()
                        .required()
                        .of(
                            yup
                                .object()
                                .shape({
                                    id: yup.string().required(),
                                    name: yup.string().required(),
                                })
                                .required()
                        )
                        .length(1),
                })
            ),
        loadflowParameters: yup
            .array()
            .required()
            .of(yup.object().shape({ id: yup.string().required(), name: yup.string().required() }))
            .length(1),
        securityAnalysisParameters: yup
            .array()
            .required()
            .of(yup.object().shape({ id: yup.string().required(), name: yup.string().required() }))
            .length(1),
    });

    type UpdateSAProcessConfigFormData = yup.InferType<typeof schema>;

    const emptyFormData = {
        name,
        description: description ?? '',
        modifications: [],
        loadflowParametersUuid: [],
        securityAnalysisParametersUuid: [],
    };

    const methods = useForm<UpdateSAProcessConfigFormData>({
        defaultValues: emptyFormData,
        resolver: yupResolver<UpdateSAProcessConfigFormData>(schema),
    });

    const { reset } = methods;

    useEffect(() => {
        setIsLoading(true);
        fetchSAProcessConfig(processConfigId)
            .then((processConfig) => {
                console.log('PROCESSCONFIG FETCHED', processConfig);
                if (processConfig) {
                    const formData: UpdateSAProcessConfigFormData = getSAProcessConfigFormDataFromFetchedElement(
                        processConfig,
                        name,
                        description
                    );
                    console.log('formData', formData);
                    reset({ ...formData });
                }
            })
            .finally(() => setIsLoading(false));
    }, [description, name, processConfigId, reset]);

    const handleUpdateProcessConfig = useCallback(
        (processConfigFormData: UpdateSAProcessConfigFormData) => {
            const processConfig: SecurityAnalysisProcessConfigFromBack = {
                processType: ProcessType.SECURITY_ANALYSIS,
                loadflowParametersUuid: processConfigFormData.loadflowParameters[0].id,
                securityAnalysisParametersUuid: processConfigFormData.securityAnalysisParameters[0].id,
                modificationUuids: processConfigFormData.modifications.map(
                    (modification) => modification.modification[0].id
                ),
            };
            updateSAProcessConfig(
                processConfigId,
                processConfigFormData.name,
                processConfigFormData.description ?? '',
                processConfig
            ).then(() => onClose());
        },
        [processConfigId, onClose]
    );

    return (
        <CustomMuiDialog
            titleId="EditASProcessConfig"
            formContext={{
                ...methods,
                validationSchema: schema,
                removeOptional: true,
            }}
            open={open}
            onClose={onClose}
            onSave={handleUpdateProcessConfig}
        >
            {!isLoading && <UpdateSaProcessConfig directory={directory} processConfigName={name} />}
            {isLoading && <LinearProgress />}
        </CustomMuiDialog>
    );
}
