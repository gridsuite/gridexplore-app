/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import { useForm } from 'react-hook-form';
import { useIntl } from 'react-intl';
import {
    BASE_MODIFICATION_TABLE_COLUMNS,
    CustomMuiDialog,
    FieldConstants,
    ModificationType,
    NameHeaderProps,
    NetworkModificationMetadata,
    NO_ITEM_SELECTION_FOR_COPY,
    snackWithFallback,
    substationCreationDtoToForm,
    SubstationCreationForm,
    substationCreationFormSchema,
    substationCreationFormToDto,
    substationModificationDtoToForm,
    SubstationModificationForm,
    substationModificationFormSchema,
    substationModificationFormToDto,
    unscrollableDialogStyles,
    useSnackMessage,
    voltageLevelCreationDtoToForm,
    VoltageLevelCreationForm,
    voltageLevelCreationFormSchema,
    voltageLevelCreationFormToDto,
    NetworkModificationEditorNameHeader,
    NameCell,
    networkTableStyles,
    yupConfig as yup,
} from '@gridsuite/commons-ui';
import { yupResolver } from '@hookform/resolvers/yup';
import { NetworkModificationsTable } from '@gridsuite/commons-ui';
import { ColumnDef } from '@tanstack/react-table';
import { AppState } from '../../../../redux/types';
import { fetchCompositeModificationContent, saveCompositeModification } from '../../../../utils/rest-api';
import CompositeModificationForm from './composite-modification-form';
import { setItemSelectionForCopy } from '../../../../redux/actions';
import { ModificationDialog, ModificationDialogProps } from '../simple-modification/ModificationDialog';

type SpecificModificationDialogProps = Pick<
    ModificationDialogProps<any, any>,
    'formSchema' | 'dtoToForm' | 'formToDto' | 'errorHeaderId' | 'titleId' | 'ModificationForm'
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
const createBaseColumns = (
    isRowDragDisabled: boolean,
    modificationsCount: number,
    nameHeaderProps: NameHeaderProps,
    setModifications: React.Dispatch<SetStateAction<NetworkModificationMetadata[]>>
): ColumnDef<NetworkModificationMetadata>[] => [
    {
        id: BASE_MODIFICATION_TABLE_COLUMNS.NAME.id,
        header: () => (
            <NetworkModificationEditorNameHeader modificationCount={modificationsCount} {...nameHeaderProps} />
        ),
        cell: ({ row }) => <NameCell row={row} />,
        meta: {
            cellStyle: networkTableStyles.columnCell.modificationName,
        },
        minSize: 160,
    },
];

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
                    ModificationType.SUBSTATION_CREATION,
                    {
                        formSchema: substationCreationFormSchema,
                        dtoToForm: substationCreationDtoToForm,
                        formToDto: substationCreationFormToDto,
                        errorHeaderId: 'SubstationCreationError',
                        titleId: 'CreateSubstation',
                        ModificationForm: SubstationCreationForm,
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
                    },
                ],
            ]),
        [intl]
    );

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
                        <NetworkModificationsTable
                            handleCellClick={editModification}
                            modifications={modifications}
                            onRowDragStart={() => {}}
                            onRowDragEnd={() => {}}
                            onRowSelected={() => {}}
                            isRowDragDisabled
                            isImpactedByNotification={() => false}
                            notificationMessageId="notificationMessageId"
                            isFetchingModifications={false}
                            pendingState={false}
                            createAllColumns={createBaseColumns}
                            highlightedModificationUuid={null}
                            setModifications={setModifications}
                        />
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
