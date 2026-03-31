/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { useForm } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { List, ListItem, ListItemButton } from '@mui/material';
import {
    CustomMuiDialog,
    equipmentDeletionDtoToForm,
    equipmentDeletionFormToDto,
    equipmentDeletionFormSchema,
    EquipmentDeletionForm,
    FieldConstants,
    loadCreationDtoToForm,
    loadCreationFormSchema,
    loadCreationFormToDto,
    loadModificationDtoToForm,
    loadModificationFormSchema,
    loadModificationFormToDto,
    LoadForm,
    ModificationType,
    NetworkModificationMetadata,
    NO_ITEM_SELECTION_FOR_COPY,
    snackWithFallback,
    byFilterDeletionDtoToForm,
    byFilterDeletionFormSchema,
    byFilterDeletionFormToDto,
    ByFilterDeletionForm,
    ModificationByAssignmentForm,
    modificationByAssignmentDtoToForm,
    modificationByAssignmentFormSchema,
    modificationByAssignmentFormToDto,
    substationCreationDtoToForm,
    SubstationCreationForm,
    substationCreationFormSchema,
    substationCreationFormToDto,
    substationModificationDtoToForm,
    SubstationModificationForm,
    substationModificationFormSchema,
    substationModificationFormToDto,
    unscrollableDialogStyles,
    useModificationLabelComputer,
    useSnackMessage,
    voltageLevelCreationDtoToForm,
    VoltageLevelCreationForm,
    voltageLevelCreationFormSchema,
    voltageLevelCreationFormToDto,
    voltageLevelModificationDtoToForm,
    VoltageLevelModificationForm,
    voltageLevelModificationFormSchema,
    voltageLevelModificationFormToDto,
    yupConfig as yup,
} from '@gridsuite/commons-ui';
import { yupResolver } from '@hookform/resolvers/yup';
import { AppState } from '../../../../redux/types';
import { fetchCompositeModificationContent, saveCompositeModification } from '../../../../utils/rest-api';
import CompositeModificationForm from './composite-modification-form';
import { setItemSelectionForCopy } from '../../../../redux/actions';
import { ModificationDialog, ModificationDialogProps } from '../simple-modification/ModificationDialog';

const styles = {
    noPointer: {
        cursor: 'default',
        '&:hover': {
            cursor: 'default',
        },
    },
};

type SpecificModificationDialogProps = Pick<
    ModificationDialogProps<any, any>,
    | 'formSchema'
    | 'dtoToForm'
    | 'formToDto'
    | 'errorHeaderId'
    | 'titleId'
    | 'ModificationForm'
    | 'isModification'
    | 'removeOptional'
>;

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
    const [isFetching, setIsFetching] = useState(!!compositeModificationId);
    const { snackError } = useSnackMessage();
    const itemSelectionForCopy = useSelector((state: AppState) => state.itemSelectionForCopy);
    const [modifications, setModifications] = useState<NetworkModificationMetadata[]>([]);
    const dispatch = useDispatch();

    const [selectedModification, setSelectedModification] = useState<NetworkModificationMetadata>();

    const methods = useForm<FormData>({
        defaultValues: emptyFormData(name, description),
        resolver: yupResolver(schema),
    });

    const {
        formState: { errors },
    } = methods;
    const nameError: any = errors[FieldConstants.NAME];
    const isValidating = errors.root?.isValidating;

    const editableModificationDialogs = useMemo(
        () =>
            new Map<ModificationType, SpecificModificationDialogProps>([
                [
                    ModificationType.EQUIPMENT_DELETION,
                    {
                        formSchema: equipmentDeletionFormSchema,
                        dtoToForm: equipmentDeletionDtoToForm,
                        formToDto: equipmentDeletionFormToDto,
                        errorHeaderId: 'UnableToDeleteEquipment',
                        titleId: 'DeleteEquipment',
                        ModificationForm: EquipmentDeletionForm,
                        removeOptional: false,
                    },
                ],
                [
                    ModificationType.SUBSTATION_CREATION,
                    {
                        formSchema: substationCreationFormSchema,
                        dtoToForm: substationCreationDtoToForm,
                        formToDto: substationCreationFormToDto,
                        errorHeaderId: 'SubstationCreationError',
                        titleId: 'CreateSubstation',
                        ModificationForm: SubstationCreationForm,
                        removeOptional: false,
                    },
                ],
                [
                    ModificationType.SUBSTATION_MODIFICATION,
                    {
                        formSchema: substationModificationFormSchema,
                        dtoToForm: (substationDto) => substationModificationDtoToForm(substationDto, false),
                        formToDto: substationModificationFormToDto,
                        errorHeaderId: 'SubstationModificationError',
                        titleId: 'ModifySubstation',
                        ModificationForm: SubstationModificationForm,
                        removeOptional: true,
                    },
                ],
                [
                    ModificationType.LOAD_CREATION,
                    {
                        formSchema: loadCreationFormSchema,
                        dtoToForm: loadCreationDtoToForm,
                        formToDto: loadCreationFormToDto,
                        errorHeaderId: 'LoadCreationError',
                        titleId: 'CreateLoad',
                        ModificationForm: LoadForm,
                        removeOptional: false,
                    },
                ],
                [
                    ModificationType.LOAD_MODIFICATION,
                    {
                        formSchema: loadModificationFormSchema,
                        dtoToForm: (loadDto) => loadModificationDtoToForm(loadDto, false),
                        formToDto: loadModificationFormToDto,
                        errorHeaderId: 'LoadModificationError',
                        titleId: 'ModifyLoad',
                        ModificationForm: LoadForm,
                        isModification: true,
                        removeOptional: true,
                    },
                ],
                [
                    ModificationType.VOLTAGE_LEVEL_CREATION,
                    {
                        formSchema: voltageLevelCreationFormSchema,
                        dtoToForm: (dto) => voltageLevelCreationDtoToForm(dto, intl, false),
                        formToDto: voltageLevelCreationFormToDto,
                        errorHeaderId: 'VoltageLevelCreationError',
                        titleId: 'CreateVoltageLevel',
                        ModificationForm: VoltageLevelCreationForm,
                        removeOptional: false,
                    },
                ],
                [
                    ModificationType.VOLTAGE_LEVEL_MODIFICATION,
                    {
                        formSchema: voltageLevelModificationFormSchema,
                        dtoToForm: (dto) => voltageLevelModificationDtoToForm(dto, false),
                        formToDto: voltageLevelModificationFormToDto,
                        errorHeaderId: 'VoltageLevelModificationError',
                        titleId: 'ModifyVoltageLevel',
                        ModificationForm: VoltageLevelModificationForm,
                        removeOptional: true,
                    },
                ],
                [
                    ModificationType.MODIFICATION_BY_ASSIGNMENT,
                    {
                        formSchema: modificationByAssignmentFormSchema,
                        dtoToForm: modificationByAssignmentDtoToForm,
                        formToDto: modificationByAssignmentFormToDto,
                        errorHeaderId: 'ModifyByAssignment',
                        titleId: 'ModifyByAssignment',
                        ModificationForm: ModificationByAssignmentForm,
                        removeOptional: false,
                    },
                ],
                [
                    ModificationType.BY_FILTER_DELETION,
                    {
                        formSchema: byFilterDeletionFormSchema,
                        dtoToForm: byFilterDeletionDtoToForm,
                        formToDto: byFilterDeletionFormToDto,
                        errorHeaderId: 'UnableToDeleteEquipment',
                        titleId: 'DeleteEquipmentByFilter',
                        ModificationForm: ByFilterDeletionForm,
                        removeOptional: false,
                    },
                ],
            ]),
        [intl]
    );

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

    const isModificationEditable = useCallback(
        (modificationType: ModificationType) => {
            return editableModificationDialogs.has(modificationType);
        },
        [editableModificationDialogs]
    );

    const editModification = useCallback(
        async (modification: NetworkModificationMetadata) => {
            if (!isModificationEditable(modification.type)) {
                return;
            }
            setSelectedModification(modification);
        },
        [isModificationEditable]
    );

    const handleModificationDialogClose = useCallback(() => {
        setSelectedModification(undefined);
    }, []);

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
            .catch((error: unknown) => {
                snackWithFallback(snackError, error, {
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
                formContext={{
                    ...methods,
                    validationSchema: schema,
                    removeOptional: true,
                }}
                disabledSave={!!nameError || !!isValidating}
                isDataFetching={isFetching}
                unscrollableFullHeight
            >
                {!isFetching && (
                    <Box sx={unscrollableDialogStyles.unscrollableContainer}>
                        <CompositeModificationForm />
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
                    </Box>
                )}
            </CustomMuiDialog>
            {selectedModification && (
                <ModificationDialog
                    open={!!selectedModification}
                    onClose={handleModificationDialogClose}
                    modificationUuid={selectedModification.uuid}
                    // We can force to not undefined because if there is a selectedModification it means it is editable
                    // and then a configuration will be associated
                    {...editableModificationDialogs.get(selectedModification.type)!}
                />
            )}
        </>
    );
}
