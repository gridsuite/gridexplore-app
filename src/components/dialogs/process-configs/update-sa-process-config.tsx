/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Grid2 } from '@mui/material';
import {
    DescriptionField,
    DirectoryItemsInput,
    ElementType,
    FieldConstants,
    UniqueNameInput,
    GridSection,
} from '@gridsuite/commons-ui';
import { UUID } from 'node:crypto';
import { UpdateSaProcessConfigModifications } from './update-sa-process-config-modifications';

interface UpdateSaProcessConfigProps {
    directory?: UUID;
    processConfigName: string;
}

export function UpdateSaProcessConfig({ directory, processConfigName }: Readonly<UpdateSaProcessConfigProps>) {
    return (
        <Grid2 container spacing={2}>
            <Grid2 size={12}>
                <UniqueNameInput
                    name={FieldConstants.NAME}
                    label="name"
                    elementType={ElementType.PROCESS_CONFIG}
                    currentName={processConfigName}
                    activeDirectory={directory}
                    autoFocus
                />
            </Grid2>
            <Grid2 size={12}>
                <DescriptionField />
            </Grid2>
            <GridSection title="modifications" />
            <UpdateSaProcessConfigModifications />
            <GridSection title="providersParameters" />
            <Grid2 size={12}>
                <DirectoryItemsInput
                    titleId="loadflow"
                    elementType={ElementType.LOADFLOW_PARAMETERS}
                    label="loadflow"
                    name="loadflowParameters"
                    allowMultiSelect={false}
                />
            </Grid2>
            <Grid2 size={12}>
                <DirectoryItemsInput
                    titleId="securityAnalysis"
                    elementType={ElementType.SECURITY_ANALYSIS_PARAMETERS}
                    label="securityAnalysis"
                    name="securityAnalysisParameters"
                    allowMultiSelect={false}
                />
            </Grid2>
        </Grid2>
    );
}
