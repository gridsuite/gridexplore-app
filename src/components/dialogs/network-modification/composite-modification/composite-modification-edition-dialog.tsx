/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { FunctionComponent, SyntheticEvent, useEffect, useState } from 'react';
import { useParameterState } from '../../use-parameters-dialog';
import { PARAM_LANGUAGE } from '../../../../utils/config-params';
import {
    CustomMuiDialog,
    FieldConstants,
    NetworkModificationMetadata,
    NO_SELECTION_FOR_COPY,
    unscrollableDialogStyles,
    useModificationLabelComputer,
    useSnackMessage,
    yupConfig as yup,
} from '@gridsuite/commons-ui';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { getCompositeModificationContent, saveCompositeModification } from '../../../../utils/rest-api';
import CompositeModificationEditionForm from './composite-modification-edition-form';
import { List, ListItem } from '@mui/material';
import { useIntl } from 'react-intl';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import { setSelectionForCopy } from '../../../../redux/actions';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../../../../redux/reducer';

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
    compositeModificationId: string;
    open: boolean;
    onClose: (event?: SyntheticEvent) => void;
    titleId: string;
    name: string;
    broadcastChannel: BroadcastChannel;
}

export const CompositeModificationEditionDialog: FunctionComponent<CompositeModificationEditionDialogProps> = ({
    compositeModificationId,
    open,
    onClose,
    titleId,
    name,
    broadcastChannel,
}: Readonly<CompositeModificationEditionDialogProps>) => {
    const intl = useIntl();
    const [languageLocal] = useParameterState(PARAM_LANGUAGE);
    const [isFetching, setIsFetching] = useState(!!compositeModificationId);
    const { snackError } = useSnackMessage();
    const selectionForCopy = useSelector((state: AppState) => state.selectionForCopy);
    const [modifications, setModifications] = useState<NetworkModificationMetadata[]>([]);
    const dispatch = useDispatch();

    const methods = useForm<FormData>({
        defaultValues: emptyFormData(name),
        resolver: yupResolver(schema),
    });

    const { computeLabel } = useModificationLabelComputer();
    const getModificationLabel = (modif: NetworkModificationMetadata) => {
        if (!modif) {
            return null;
        }
        return intl.formatMessage(
            { id: 'network_modifications.' + modif.type },
            {
                ...modif,
                ...computeLabel(modif),
            }
        );
    };

    const renderNetworkModificationsList = () => {
        return (
            <>
                {modifications && (
                    <List sx={unscrollableDialogStyles.scrollableContent}>
                        {modifications.map((modification: NetworkModificationMetadata) => (
                            <>
                                <ListItem key={modification.uuid}>
                                    <Box>{getModificationLabel(modification)}</Box>
                                </ListItem>
                                <Divider component="li" />
                            </>
                        ))}
                    </List>
                )}
            </>
        );
    };

    useEffect(() => {
        setIsFetching(true);
        getCompositeModificationContent(compositeModificationId)
            .then((response) => {
                if (response) {
                    setModifications(response);
                }
            })
            .catch((error) => {
                snackError({
                    messageTxt: error.message,
                    headerId: 'cannotRetrieveCompositeModification',
                });
            })
            .finally(() => setIsFetching(false));
    }, [compositeModificationId, name, snackError]);

    const closeAndClear = (event?: SyntheticEvent) => {
        onClose(event);
    };

    const onSubmit = (formData: FormData) => {
        saveCompositeModification(compositeModificationId, formData[FieldConstants.NAME])
            .then(() => {
                if (selectionForCopy.sourceItemUuid === compositeModificationId) {
                    dispatch(setSelectionForCopy(NO_SELECTION_FOR_COPY));
                    broadcastChannel.postMessage({
                        NO_SELECTION_FOR_COPY,
                    });
                }
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
            titleId={titleId}
            onSave={onSubmit}
            removeOptional={true}
            isDataFetching={isFetching}
            language={languageLocal}
            formSchema={schema}
            formMethods={methods}
            unscrollableFullHeight
        >
            {!isFetching && (
                <Box sx={unscrollableDialogStyles.unscrollableContainer}>
                    <CompositeModificationEditionForm />
                    {renderNetworkModificationsList()}
                </Box>
            )}
        </CustomMuiDialog>
    );
};
