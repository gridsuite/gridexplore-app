/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useFormContext } from 'react-hook-form';
import { ElementType, FieldConstants, UniqueNameInput } from '@gridsuite/commons-ui';
import { useSelector } from 'react-redux';
import { elementExists } from '../../../utils/rest-api';
import { AppState } from '../../../redux/types';

export interface PrefilledNameInputProps {
    label: string;
    name: string;
    elementType: ElementType;
}

/**
 * Input component that automatically fill the field when a case is uploaded
 * Used for CreateCaseDialog and CreateStudyDialog
 */
export default function PrefilledNameInput({ label, name, elementType }: Readonly<PrefilledNameInputProps>) {
    const { watch } = useFormContext();

    const caseFile = watch(FieldConstants.CASE_FILE) as File;

    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);

    return (
        <UniqueNameInput
            name={name}
            label={label}
            elementType={elementType}
            elementExists={elementExists}
            activeDirectory={activeDirectory}
            autoFocus={!caseFile}
        />
    );
}
