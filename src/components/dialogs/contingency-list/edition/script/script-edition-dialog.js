/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useSnackMessage } from '@gridsuite/commons-ui';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';

import React, { useEffect, useState } from 'react';
import {
    getContingencyListEmptyFormData,
    getScriptFormDataFromFetchedElement,
} from '../../contingency-list-utils';
import { getContingencyList, saveScriptContingencyList } from 'utils/rest-api';
import { EQUIPMENT_TYPE, NAME, SCRIPT } from 'components/utils/field-constants';
import CustomMuiDialog from 'components/dialogs/custom-mui-dialog';
import NameWrapper from 'components/dialogs/name-wrapper';
import { ElementType } from 'utils/elementType';
import yup from 'components/utils/yup-config';
import ScriptEditionForm from './script-edition-form';

const schema = yup.object().shape({
    [NAME]: yup.string().required(),
    [EQUIPMENT_TYPE]: yup.string().nullable(),
    [SCRIPT]: yup.string().nullable(),
});

const emptyFormData = getContingencyListEmptyFormData();

const ScriptEditionDialog = ({
    contingencyListId,
    contingencyListType,
    open,
    onClose,
    titleId,
    name,
}) => {
    const [isValidName, setIsValidName] = useState(true);
    const [isFetching, setIsFetching] = useState(!!contingencyListId);
    const { snackError } = useSnackMessage();

    const methods = useForm({
        defaultValues: emptyFormData,
        resolver: yupResolver(schema),
    });

    const { reset, setValue } = methods;

    useEffect(() => {
        if (contingencyListId) {
            setIsFetching(true);
            getContingencyList(contingencyListType, contingencyListId)
                .then((response) => {
                    if (response) {
                        const formData =
                            getScriptFormDataFromFetchedElement(response);
                        reset({ ...formData, [NAME]: name });
                    }
                })
                .catch((error) => {
                    snackError({
                        messageTxt: error.message,
                        headerId: 'cannotRetrieveContingencyList',
                    });
                })
                .finally(() => setIsFetching(false));
        }
    }, [contingencyListId, contingencyListType, name, reset, snackError]);

    const closeAndClear = (event) => {
        reset(emptyFormData);
        onClose(event);
    };

    const handleNameChange = (isValid, newName) => {
        setIsValidName(isValid);
        setValue(NAME, newName, { shouldDirty: isValid });
    };

    const editContingencyList = (contingencyListId, contingencyList) => {
        const newScript = {
            id: contingencyListId,
            script: contingencyList[SCRIPT],
        };
        return saveScriptContingencyList(newScript, contingencyList[NAME]);
    };

    const onSubmit = (contingencyList) => {
        editContingencyList(contingencyListId, contingencyList)
            .then(() => {
                closeAndClear();
            })
            .catch((errorMessage) => {
                snackError({
                    messageTxt: errorMessage,
                    headerId: 'contingencyListEditingError',
                    headerValues: { name },
                });
            });
    };

    return (
        <CustomMuiDialog
            open={open}
            onClose={closeAndClear}
            onSave={onSubmit}
            formSchema={schema}
            formMethods={methods}
            titleId={titleId}
            removeOptional={true}
            disabledSave={!isValidName}
            isDataFetching={isFetching}
        >
            <NameWrapper
                titleMessage={'nameProperty'}
                contentType={ElementType.CONTINGENCY_LIST}
                initialValue={name}
                handleNameValidation={handleNameChange}
            />
            {!isFetching && <ScriptEditionForm />}
        </CustomMuiDialog>
    );
};

export default ScriptEditionDialog;
