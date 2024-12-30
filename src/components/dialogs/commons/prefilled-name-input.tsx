/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { ElementType, FieldConstants, UniqueNameInput, useSnackMessage } from '@gridsuite/commons-ui';
import { useSelector } from 'react-redux';
import { elementExists, getBaseName } from '../../../utils/rest-api';
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
    const {
        setValue,
        getValues,
        clearErrors,
        watch,
        formState: { errors },
    } = useFormContext();

    const [modifiedByUser, setModifiedByUser] = useState(false);
    const { snackError } = useSnackMessage();

    const caseFile = watch(FieldConstants.CASE_FILE) as File;
    const caseFileErrorMessage = errors.caseFile?.message;
    const apiCallErrorMessage = errors.root?.apiCall?.message;

    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);

    useEffect(() => {
        // we replace the name only if some conditions are respected
        if (caseFile && !modifiedByUser && !apiCallErrorMessage && !caseFileErrorMessage) {
            const { name: caseName } = caseFile;
            const currentCaseName = getValues(name);

            if (caseName && caseName !== currentCaseName) {
                clearErrors(name);
                getBaseName(caseName)
                    .then((response) => {
                        setValue(name, response, {
                            shouldDirty: true,
                        });
                    })
                    .catch((error) => {
                        snackError({
                            messageTxt: error.message,
                        });
                    });
            }
        }
    }, [
        caseFile,
        modifiedByUser,
        apiCallErrorMessage,
        caseFileErrorMessage,
        setValue,
        getValues,
        clearErrors,
        name,
        snackError,
    ]);

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
