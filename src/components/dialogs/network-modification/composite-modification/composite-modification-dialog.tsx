/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { SyntheticEvent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { useForm } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { List, ListItem } from '@mui/material';
import {
    CustomMuiDialog,
    FieldConstants,
    NetworkModificationMetadata,
    NO_ITEM_SELECTION_FOR_COPY,
    unscrollableDialogStyles,
    useModificationLabelComputer,
    useSnackMessage,
    yupConfig as yup,
} from '@gridsuite/commons-ui';
import { yupResolver } from '@hookform/resolvers/yup';
import { AppState } from '../../../../redux/types';
import { useParameterState } from '../../use-parameters-dialog';
import { PARAM_LANGUAGE } from '../../../../utils/config-params';
import { fetchCompositeModificationContent, saveCompositeModification } from '../../../../utils/rest-api';
import CompositeModificationForm from './composite-modification-form';
import { setItemSelectionForCopy } from '../../../../redux/actions';

const schema = yup.object().shape({
    [FieldConstants.NAME]: yup.string().trim().required('nameEmpty'),
});

const emptyFormData = (name?: string) => ({
    [FieldConstants.NAME]: name,
});

interface FormData {
    [FieldConstants.NAME]: string;
}

interface CompositeModificationDialogProps {
    compositeModificationId: string;
    open: boolean;
    onClose: (event?: SyntheticEvent) => void;
    titleId: string;
    name: string;
    broadcastChannel: BroadcastChannel;
}

export default function CompositeModificationDialog({
    compositeModificationId,
    open,
    onClose,
    titleId,
    name,
    broadcastChannel,
}: Readonly<CompositeModificationDialogProps>) {
    const intl = useIntl();
    const [languageLocal] = useParameterState(PARAM_LANGUAGE);
    const [isFetching, setIsFetching] = useState(!!compositeModificationId);
    const { snackError } = useSnackMessage();
    const itemSelectionForCopy = useSelector((state: AppState) => state.itemSelectionForCopy);
    const [modifications, setModifications] = useState<NetworkModificationMetadata[]>([]);
    const dispatch = useDispatch();

    const methods = useForm<FormData>({
        defaultValues: emptyFormData(name),
        resolver: yupResolver(schema),
    });

    const {
        formState: { errors },
    } = methods;
    const nameError: any = errors[FieldConstants.NAME];
    const isValidating = errors.root?.isValidating;

    const { computeLabel } = useModificationLabelComputer();
    const getModificationLabel = (modif: NetworkModificationMetadata) => {
        if (!modif) {
            return null;
        }
        const labelData = {
            ...modif,
            ...computeLabel(modif),
        };
        return intl.formatMessage({ id: `network_modifications.${modif.messageType}` }, labelData);
    };

    const generateNetworkModificationsList = () => {
        return (
            <List sx={unscrollableDialogStyles.scrollableContent}>
                {modifications &&
                    modifications.map((modification: NetworkModificationMetadata) => (
                        <Box key={modification.uuid}>
                            <ListItem>
                                <Box>{getModificationLabel(modification)}</Box>
                            </ListItem>
                            <Divider component="li" />
                        </Box>
                    ))}
            </List>
        );
    };

    useEffect(() => {
        setIsFetching(true);
        fetchCompositeModificationContent(compositeModificationId)
            .then((response) => {
                if (response) {
                    setModifications(response);
                }
            })
            .catch((error) => {
                snackError({
                    messageTxt: error.message,
                    headerId: 'retrieveCompositeModificationError',
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
                if (itemSelectionForCopy.sourceItemUuid === compositeModificationId) {
                    dispatch(setItemSelectionForCopy(NO_ITEM_SELECTION_FOR_COPY));
                    broadcastChannel.postMessage({ NO_ITEM_SELECTION_FOR_COPY });
                }
                closeAndClear();
            })
            .catch((errorMessage) => {
                snackError({
                    messageTxt: errorMessage,
                    headerId: 'compositeModificationEditingError',
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
            removeOptional
            disabledSave={!!nameError || !!isValidating}
            isDataFetching={isFetching}
            language={languageLocal}
            formSchema={schema}
            formMethods={methods}
            unscrollableFullHeight
        >
            {!isFetching && (
                <Box sx={unscrollableDialogStyles.unscrollableContainer}>
                    <CompositeModificationForm />
                    {generateNetworkModificationsList()}
                </Box>
            )}
        </CustomMuiDialog>
    );
}
