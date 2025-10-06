/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, CircularProgress } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import {
    ElementAttributes,
    useSnackMessage,
    CancelButton,
    CustomFormProvider,
    SubmitButton,
} from '@gridsuite/commons-ui';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import type { UUID } from 'node:crypto';
import {
    fetchDirectoryPermissions,
    updateDirectoryPermissions,
    fetchGroups,
    hasManagePermission,
    PermissionDTO,
    PermissionType,
} from '../../../utils/rest-api';
import {
    Group,
    PermissionForm,
    READ_ALL_USERS,
    READ_GROUPS,
    WRITE_ALL_USERS,
    WRITE_GROUPS,
    emptyForm,
    schema,
} from './utils';
import PermissionRow from './permission-row';

interface DirectoryPropertiesDialogProps {
    open: boolean;
    onClose: () => void;
    directory: ElementAttributes | null;
}

function DirectoryPropertiesDialog({ open, onClose, directory }: Readonly<DirectoryPropertiesDialogProps>) {
    const { snackError } = useSnackMessage();

    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState<Group[]>([]);
    const [canManage, setCanManage] = useState(false);

    const methods = useForm<PermissionForm>({
        defaultValues: emptyForm,
        resolver: yupResolver<PermissionForm>(schema),
    });

    const {
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { isDirty },
    } = methods;

    const readAllUsers = watch(READ_ALL_USERS);
    const writeAllUsers = watch(WRITE_ALL_USERS);

    useEffect(() => {
        if (writeAllUsers) {
            setValue(READ_ALL_USERS, true, { shouldDirty: true });
        }
    }, [writeAllUsers, setValue]);

    const fetchData = useCallback(async () => {
        if (!directory?.elementUuid) return;

        setLoading(true);
        try {
            const [permissionsData, groupsData, managePermission] = await Promise.all([
                fetchDirectoryPermissions(directory.elementUuid),
                fetchGroups(),
                hasManagePermission(directory.elementUuid),
            ]);

            const formattedGroupsData = groupsData.map((group) => ({
                id: group.id,
                label: group.name,
            }));
            setGroups(formattedGroupsData);
            setCanManage(managePermission);

            const formData = { ...emptyForm };

            permissionsData.forEach((permission) => {
                if (permission.type === PermissionType.READ) {
                    formData[READ_ALL_USERS] = permission.allUsers;
                    formData[READ_GROUPS] = groupsData
                        .filter((g) => permission.groups.includes(g.id))
                        .map((g) => ({ id: g.id, label: g.name }));
                }
                if (permission.type === PermissionType.WRITE) {
                    formData[WRITE_ALL_USERS] = permission.allUsers;
                    formData[WRITE_GROUPS] = groupsData
                        .filter((g) => permission.groups.includes(g.id))
                        .map((g) => ({ id: g.id, label: g.name }));
                }
            });

            reset(formData);
        } catch (error: any) {
            snackError({
                messageTxt: error.message,
                headerId: 'directoryPermissionsFetchError',
            });
        } finally {
            setLoading(false);
        }
    }, [directory?.elementUuid, snackError, reset]);

    useEffect(() => {
        if (open && directory) {
            fetchData();
        }
    }, [open, directory, fetchData]);

    const handleClose = useCallback(() => {
        reset(emptyForm);
        onClose();
    }, [reset, onClose]);

    const onSubmit = useCallback(
        async (data: PermissionForm) => {
            if (!directory?.elementUuid) return;

            try {
                const permissions: PermissionDTO[] = [
                    {
                        type: PermissionType.READ,
                        allUsers: data[READ_ALL_USERS] || false,
                        groups: data[READ_GROUPS]?.map((g) => g.id as UUID) ?? [],
                    },
                    {
                        type: PermissionType.WRITE,
                        allUsers: data[WRITE_ALL_USERS] || false,
                        groups: data[WRITE_GROUPS]?.map((g) => g.id as UUID) ?? [],
                    },
                ];

                handleClose();
                updateDirectoryPermissions(directory.elementUuid, permissions);
            } catch (error: any) {
                snackError({
                    messageTxt: error.message,
                    headerId: 'directoryPermissionsUpdateError',
                });
            }
        },
        [directory?.elementUuid, handleClose, snackError]
    );

    const isFormDisabled = !canManage;

    const handlePermissionTypeChange = useCallback(
        (permissionType: string, value: string) => {
            const isAllUsers = value === 'all';
            const permissionKey = `${permissionType}AllUsers`;
            setValue(permissionKey as keyof PermissionForm, isAllUsers, { shouldDirty: true });
        },
        [setValue]
    );

    const isRestrictedRadioDisabled = useCallback(
        (permissionType: string) => {
            const isRead = permissionType === 'read';
            return isRead && writeAllUsers;
        },
        [writeAllUsers]
    );

    return (
        <CustomFormProvider validationSchema={schema} {...methods} removeOptional>
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    <FormattedMessage id="directoryProperties" values={{ name: directory?.elementName }} />
                </DialogTitle>
                <DialogContent>
                    {loading ? (
                        <Box display="flex" justifyContent="center" p={3}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                                <FormattedMessage id="directoryPermissions" />
                            </Typography>

                            {!canManage && (
                                <Typography color="warning.main" gutterBottom sx={{ mb: 2 }}>
                                    <FormattedMessage id="directoryPermissionsViewOnly" />
                                </Typography>
                            )}

                            <PermissionRow
                                permissionType="read"
                                label="readOnly"
                                allUsersValue={readAllUsers}
                                groupsKey={READ_GROUPS}
                                groups={groups}
                                isFormDisabled={isFormDisabled}
                                onPermissionTypeChange={handlePermissionTypeChange}
                                isRestrictedRadioDisabled={isRestrictedRadioDisabled}
                            />

                            <PermissionRow
                                permissionType="write"
                                label="read&Write"
                                allUsersValue={writeAllUsers}
                                groupsKey={WRITE_GROUPS}
                                groups={groups}
                                isFormDisabled={isFormDisabled}
                                onPermissionTypeChange={handlePermissionTypeChange}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <CancelButton onClick={handleClose} />
                    {canManage && (
                        <SubmitButton
                            onClick={handleSubmit(onSubmit)}
                            variant="outlined"
                            disabled={!isDirty || loading}
                        />
                    )}
                </DialogActions>
            </Dialog>
        </CustomFormProvider>
    );
}

export default DirectoryPropertiesDialog;
