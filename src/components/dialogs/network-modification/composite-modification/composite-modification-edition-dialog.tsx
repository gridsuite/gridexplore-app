/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { FunctionComponent, SyntheticEvent, useEffect, useState } from 'react';
import { useParameterState } from '../../use-parameters-dialog';
import { PARAM_LANGUAGE } from '../../../../utils/config-params';
import { CustomMuiDialog, FieldConstants, useSnackMessage, yup } from '@gridsuite/commons-ui';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { getCompositeModificationContent } from '../../../../utils/rest-api';
import { CriteriaBasedEditionFormData } from '../../contingency-list/edition/criteria-based/criteria-based-edition-dialog';
import CompositeModificationEditionForm from './composite-modification-edition-form';

const schema = yup.object().shape({
    [FieldConstants.NAME]: yup.string().trim().required('nameEmpty'),
});

const emptyFormData = (name?: string) => ({
    [FieldConstants.NAME]: name,
});

interface FormData {
    [FieldConstants.NAME]: string;
}

interface CompositeModificationEditionDialogProps {
    compositeModificationListId: string;
    open: boolean;
    onClose: (event?: SyntheticEvent) => void;
    titleId: string;
    name: string;
}

export interface ModificationInfos {
    // TODO : voir si ça n'existe pas déjà ailleurs, sinon étendre ce type avec les autres ModificationInfos du back
    uuid?: string;
}

const CompositeModificationEditionDialog: FunctionComponent<CompositeModificationEditionDialogProps> = ({
    compositeModificationListId,
    open,
    onClose,
    titleId,
    name,
}: Readonly<CompositeModificationEditionDialogProps>) => {
    const [languageLocal] = useParameterState(PARAM_LANGUAGE);
    const [isFetching, setIsFetching] = useState(!!compositeModificationListId);
    const { snackError } = useSnackMessage();
    const [modificationsData, setModificationsData] = useState<ModificationInfos[]>([]);

    const methods = useForm<FormData>({
        defaultValues: emptyFormData(name),
        resolver: yupResolver(schema),
    });

    useEffect(() => {
        setIsFetching(true);
        getCompositeModificationContent(compositeModificationListId)
            .then((response) => {
                if (response) {
                    setModificationsData(response);
                }
            })
            .catch((error) => {
                snackError({
                    messageTxt: error.message,
                    headerId: 'cannotRetrieveContingencyList',
                });
            })
            .finally(() => setIsFetching(false));
    }, [compositeModificationListId, name, snackError]);

    const closeAndClear = (event?: SyntheticEvent) => {
        onClose(event);
    };

    const onSubmit = (contingencyList: CriteriaBasedEditionFormData) => {
        // SAUVE LE NOM ??
    };

    return (
        <CustomMuiDialog
            open={open}
            onClose={closeAndClear}
            titleId={titleId}
            onSave={onSubmit}
            removeOptional={true}
            isDataFetching={isFetching}
            language={languageLocal}
            formSchema={schema}
            formMethods={methods}
            unscrollableFullHeight
        >
            {!isFetching && <CompositeModificationEditionForm />}
            <ul>
                {modificationsData &&
                    modificationsData.map((modification) => <li key={modification.uuid}>id : {modification.uuid}</li>)}
            </ul>
        </CustomMuiDialog>
    );
};

export default CompositeModificationEditionDialog;
