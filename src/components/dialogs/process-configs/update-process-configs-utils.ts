/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import * as yup from 'yup';
import {
    ProcessType,
    SecurityAnalysisProcessConfig,
    SecurityAnalysisProcessConfigBackend,
} from './process-configs.type';

export function getSAProcessConfigFormDataFromFetchedElement(
    processConfig: SecurityAnalysisProcessConfig,
    name: string,
    description: string | null
) {
    return {
        name,
        description: description ?? undefined,
        modifications: processConfig.modifications.map((modification) => ({
            modification: [{ id: modification.id, name: modification.name }],
        })),
        securityAnalysisParameters: [processConfig.securityAnalysisParameters],
        loadflowParameters: [processConfig.loadflowParameters],
    };
}

export function getSAProcessConfigBackendFromFormData(
    formData: UpdateSAProcessConfigFormData
): SecurityAnalysisProcessConfigBackend {
    return {
        processType: ProcessType.SECURITY_ANALYSIS,
        loadflowParametersUuid: formData.loadflowParameters[0].id,
        securityAnalysisParametersUuid: formData.securityAnalysisParameters[0].id,
        modificationUuids: formData.modifications.map((modification) => modification.modification[0].id),
    };
}

export const updateProcessConfigFormSchema = yup.object().shape({
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

export type UpdateSAProcessConfigFormData = yup.InferType<typeof updateProcessConfigFormSchema>;
