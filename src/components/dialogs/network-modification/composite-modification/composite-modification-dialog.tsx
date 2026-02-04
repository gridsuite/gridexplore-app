/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { type FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { useForm } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { List, ListItem, ListItemButton } from '@mui/material';
import {
    CustomMuiDialog,
    FieldConstants,
    NetworkModificationMetadata,
    NO_ITEM_SELECTION_FOR_COPY,
    unscrollableDialogStyles,
    useModificationLabelComputer,
    useSnackMessage,
    yupConfig as yup,
    PARAM_LANGUAGE,
    ModificationType,
    SubstationCreationDialog,
    FetchStatus,
    fetchNetworkModification,
    snackWithFallback,
    NetworkModificationData,
    removeNullFields,
} from '@gridsuite/commons-ui';
import { yupResolver } from '@hookform/resolvers/yup';
import { AppState } from '../../../../redux/types';
import { useParameterState } from '../../use-parameters-dialog';
import { fetchCompositeModificationContent, saveCompositeModification } from '../../../../utils/rest-api';
import CompositeModificationForm from './composite-modification-form';
import { setItemSelectionForCopy } from '../../../../redux/actions';

const styles = {
    noPointer: {
        cursor: 'default',
        '&:hover': {
            cursor: 'default',
        },
    },
};

const EDITABLE_MODIFICATION_DIALOGS = new Map<ModificationType, FunctionComponent<any>>([
    [ModificationType.SUBSTATION_CREATION, SubstationCreationDialog],
]);

const schema = yup.object().shape({
    [FieldConstants.NAME]: yup.string().trim().required('nameEmpty'),
    [FieldConstants.DESCRIPTION]: yup.string().trim(),
});

const emptyFormData = (name?: string, description?: string) => ({
    [FieldConstants.NAME]: name,
    [FieldConstants.DESCRIPTION]: description,
});

interface FormData {
    [FieldConstants.NAME]: string;
    [FieldConstants.DESCRIPTION]?: string;
}

interface CompositeModificationDialogProps {
    compositeModificationId: string;
    open: boolean;
    onClose: () => void;
    titleId: string;
    name: string;
    description: string;
    broadcastChannel: BroadcastChannel;
}

export default function CompositeModificationDialog({
    compositeModificationId,
    open,
    onClose,
    titleId,
    name,
    description,
    broadcastChannel,
}: Readonly<CompositeModificationDialogProps>) {
    const intl = useIntl();
    const [languageLocal] = useParameterState(PARAM_LANGUAGE);
    const [isFetching, setIsFetching] = useState(!!compositeModificationId);
    const { snackError } = useSnackMessage();
    const itemSelectionForCopy = useSelector((state: AppState) => state.itemSelectionForCopy);
    const [modifications, setModifications] = useState<NetworkModificationMetadata[]>([]);
    const dispatch = useDispatch();

    const [editSelectedType, setEditSelectedType] = useState<ModificationType>();
    const [editData, setEditData] = useState<NetworkModificationData>();
    const [editDataFetchStatus, setEditDataFetchStatus] = useState(FetchStatus.IDLE);

    const methods = useForm<FormData>({
        defaultValues: emptyFormData(name, description),
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

    const isModificationEditable = useCallback((modificationType: ModificationType) => {
        return EDITABLE_MODIFICATION_DIALOGS.has(modificationType);
    }, []);

    const editModification = useCallback(
        async (modification: NetworkModificationMetadata) => {
            if (!isModificationEditable(modification.type)) {
                return;
            }
            // we can already open the empty dialog
            setEditSelectedType(modification.type);
            setEditDataFetchStatus(FetchStatus.RUNNING);

            try {
                const res = await fetchNetworkModification(modification.uuid);
                const data: NetworkModificationData = await res.json();
                // remove all null values to avoid showing a "null" in the forms
                setEditData(removeNullFields(data));
                setEditDataFetchStatus(FetchStatus.SUCCEED);
            } catch (error: unknown) {
                snackWithFallback(snackError, error, {
                    headerId: 'ModificationReadError',
                });
                setEditDataFetchStatus(FetchStatus.FAILED);
            }
        },
        [isModificationEditable, snackError]
    );

    const handleModificationDialogClose = useCallback(() => {
        setEditSelectedType(undefined);
        setEditData(undefined);
    }, []);

    function withDefaultParams(Dialog: React.FC<any>) {
        return (
            <Dialog
                editData={editData}
                isUpdate
                onClose={handleModificationDialogClose}
                editDataFetchStatus={editDataFetchStatus}
                language={languageLocal}
            />
        );
    }

    const renderEditionDialog = () => {
        if (!editSelectedType) {
            return null;
        }
        const dialog = EDITABLE_MODIFICATION_DIALOGS.get(editSelectedType);
        if (!dialog) {
            return null;
        }
        return withDefaultParams(dialog);
    };

    const generateNetworkModificationsList = () => {
        return (
            <List sx={unscrollableDialogStyles.scrollableContent}>
                {modifications?.map((modification: NetworkModificationMetadata) => (
                    <Box key={modification.uuid}>
                        <ListItem disablePadding>
                            <ListItemButton
                                sx={isModificationEditable(modification.type) ? null : styles.noPointer}
                                onClick={() => editModification(modification)}
                                disableRipple
                            >
                                <Box>{getModificationLabel(modification)}</Box>
                            </ListItemButton>
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

    const onSubmit = (formData: FormData) => {
        const modificationUuids = modifications.map((modification) => modification.uuid);
        saveCompositeModification(
            compositeModificationId,
            modificationUuids,
            formData[FieldConstants.NAME],
            formData[FieldConstants.DESCRIPTION]
        )
            .then(() => {
                if (itemSelectionForCopy.sourceItemUuid === compositeModificationId) {
                    dispatch(setItemSelectionForCopy(NO_ITEM_SELECTION_FOR_COPY));
                    broadcastChannel.postMessage({ NO_ITEM_SELECTION_FOR_COPY });
                }
                onClose();
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
        <>
            <CustomMuiDialog
                open={open}
                onClose={onClose}
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
            {renderEditionDialog()}
        </>
    );
}
