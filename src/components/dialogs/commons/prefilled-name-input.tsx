/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { ElementType, FieldConstants, UniqueNameInput } from '@gridsuite/commons-ui';
import { useSelector } from 'react-redux';
import { elementExists } from '../../../utils/rest-api';
import { AppState } from '../../../redux/reducer';

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
    const {
        setValue,
        clearErrors,
        watch,
        formState: { errors },
    } = useFormContext();

    const [modifiedByUser, setModifiedByUser] = useState(false);

    const caseFile = watch(FieldConstants.CASE_FILE) as File;
    const caseFileErrorMessage = errors.caseFile?.message;
    const apiCallErrorMessage = errors.root?.apiCall?.message;

    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);

    useEffect(() => {
        // we replace the name only if some conditions are respected
        if (caseFile && !modifiedByUser && !apiCallErrorMessage && !caseFileErrorMessage) {
            const { name: caseName } = caseFile;

            if (caseName) {
                clearErrors(name);
                setValue(name, caseName?.substring(0, caseName.indexOf('.')), {
                    shouldDirty: true,
                });
            }
        }
    }, [caseFile, modifiedByUser, apiCallErrorMessage, caseFileErrorMessage, setValue, clearErrors, name]);

    return (
        <UniqueNameInput
            name={name}
            label={label}
            elementType={elementType}
            elementExists={elementExists}
            activeDirectory={activeDirectory}
            autoFocus={!caseFile}
            onManualChangeCallback={() => setModifiedByUser(true)}
        />
    );
}
