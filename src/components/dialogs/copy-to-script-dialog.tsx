/**
 * Copyright (c) 2023, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { CircularProgress, Grid } from '@mui/material';
import { CustomMuiDialog, ElementType, FieldConstants, UniqueNameInput, useSnackMessage } from '@gridsuite/commons-ui';
import type { UUID } from 'crypto';
import { useSelector } from 'react-redux';
import * as yup from 'yup';
import { getNameCandidate } from '../../utils/rest-api';
import type { AppState } from '../../redux/types';
import { handleGenericTxtError } from '../utils/rest-errors';

const schema = yup.object().shape({
    [FieldConstants.NAME]: yup.string().trim().required('nameEmpty'),
});

const emptyFormData = {
    [FieldConstants.NAME]: '',
};

export interface CopyToScriptDialogProps {
    id: string;
    open: boolean;
    onClose: () => void;
    onValidate: (...args: any[]) => void;
    currentName: string;
    title: string;
    directoryUuid: UUID;
    elementType: ElementType;
}

interface FormData {
    [FieldConstants.NAME]: string;
}

/**
 * Dialog to copy a filters contingency list to a script contingency list or a filter to a script
 * @param id id of list or filter to edit
 * @param open Is the dialog open ?
 * @param onClose Event to close the dialog
 * @param onValidate Function to call to perform copy
 * @param currentName Name before renaming
 * @param title Title of the dialog
 * @param directoryUuid Directory uuid of the list or filter to copy
 * @param elementType Type of the element to copy
 */
export default function CopyToScriptDialog({
    id,
    open,
    onClose,
    onValidate,
    currentName,
    title,
    directoryUuid,
    elementType,
}: Readonly<CopyToScriptDialogProps>) {
    const [loading, setLoading] = useState(false);
    const { snackError } = useSnackMessage();
    const intl = useIntl();
    const methods = useForm<FormData>({
        defaultValues: emptyFormData,
        resolver: yupResolver(schema),
    });

    const {
        formState: { errors },
        setValue,
    } = methods;

    const nameError = errors[FieldConstants.NAME];
    const isValidating = errors.root?.isValidating;

    const activeDirectory = useSelector((state: AppState) => state.activeDirectory);

    const onSubmit = (data: FormData) => {
        onValidate(id, data[FieldConstants.NAME]);
    };

    const handleGenerateNameError = useCallback(
        () =>
            handleGenericTxtError(
                intl.formatMessage({ id: 'generateCopyScriptNameError' }, { itemName: currentName }),
                snackError
            ),
        [currentName, intl, snackError]
    );

    useEffect(() => {
        setLoading(true);
        getNameCandidate(directoryUuid, currentName, elementType)
            .then((newName) => {
                const generatedName: string = newName || '';
                setValue(FieldConstants.NAME, generatedName, {
                    shouldDirty: true,
                });
            })
            .catch(() => {
                handleGenerateNameError();
            })
            .finally(() => {
                setLoading(false);
            });
    }, [handleGenerateNameError, setValue, currentName, elementType, directoryUuid]);

    return (
        <CustomMuiDialog
            open={open}
            onClose={onClose}
            onSave={onSubmit}
            formSchema={schema}
            formMethods={methods}
            titleId={title}
            removeOptional
            disabledSave={!!nameError || !!isValidating}
        >
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    {loading ? (
                        <CircularProgress />
                    ) : (
                        <UniqueNameInput
                            name={FieldConstants.NAME}
                            label="nameProperty"
                            elementType={ElementType.CONTINGENCY_LIST}
                            autoFocus
                            activeDirectory={activeDirectory}
                        />
                    )}
                </Grid>
            </Grid>
        </CustomMuiDialog>
    );
}
