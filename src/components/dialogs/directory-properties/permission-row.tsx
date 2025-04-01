/**
 * Copyright (c) 2025, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Typography, Grid, Paper, RadioGroup, Radio, FormControlLabel } from '@mui/material';
import { AutocompleteInput, Option } from '@gridsuite/commons-ui';
import { FormattedMessage } from 'react-intl';
import { Group, areIdsEqual } from './utils';

interface PermissionRowProps {
    permissionType: string;
    label: string;
    allUsersValue: boolean;
    groupsKey: string;
    groups: Group[];
    isFormDisabled: boolean;
    onPermissionTypeChange: (permissionType: string, value: string) => void;
    isRestrictedRadioDisabled?: (permissionType: string) => boolean;
}

function PermissionRow({
    permissionType,
    label,
    allUsersValue,
    groupsKey,
    groups,
    isFormDisabled,
    onPermissionTypeChange,
    isRestrictedRadioDisabled,
}: Readonly<PermissionRowProps>) {
    const inputTransform = (value: Option | null) => {
        return groups.find((option) => option?.id === value) || value;
    };

    const outputTransform = (value: Option | null) => {
        const group = value as Group;
        return group?.id ?? value;
    };

    const isRestrictedDisabled = isRestrictedRadioDisabled ? isRestrictedRadioDisabled(permissionType) : false;

    return (
        <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        <FormattedMessage id={label} />
                    </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <RadioGroup
                        row
                        value={allUsersValue ? 'all' : 'restricted'}
                        onChange={(e) => onPermissionTypeChange(permissionType, e.target.value)}
                    >
                        <FormControlLabel
                            value="all"
                            control={<Radio disabled={isFormDisabled} />}
                            label={<FormattedMessage id="allUsers" />}
                        />
                        <FormControlLabel
                            value="restricted"
                            control={<Radio disabled={isFormDisabled || isRestrictedDisabled} />}
                            label={<FormattedMessage id="restricted" />}
                        />
                    </RadioGroup>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <AutocompleteInput
                        name={groupsKey}
                        label="selectGroups"
                        options={groups}
                        getOptionLabel={(option: any) => option?.label ?? ''}
                        isOptionEqualToValue={areIdsEqual}
                        inputTransform={inputTransform}
                        outputTransform={outputTransform}
                        disableClearable={false}
                        disableCloseOnSelect
                        allowNewValue={false}
                        freeSolo={false}
                        disabled={isFormDisabled || allUsersValue}
                        multiple
                        ChipProps={{ size: 'small' }}
                    />
                </Grid>
            </Grid>
        </Paper>
    );
}

export default PermissionRow;
