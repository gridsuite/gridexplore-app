/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Box, Checkbox, IconButton, Typography } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { useIntl } from 'react-intl';

const styles = {
    container: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    checkbox: { padding: '2px' },
    tag: { fontWeight: 'inherit', whiteSpace: 'nowrap' },
    deleteButton: { padding: '3px' },
};

interface RootNetworkColumnHeaderProps {
    tag: string;
    selectedTags: string[];
    toggleTag: (tag: string) => void;
}

export default function RootNetworkColumnHeader({
    tag,
    selectedTags,
    toggleTag,
}: Readonly<RootNetworkColumnHeaderProps>) {
    return (
        <Box sx={styles.container}>
            <Checkbox
                size="small"
                sx={styles.checkbox}
                checked={selectedTags.includes(tag)}
                onChange={() => toggleTag(tag)}
                slotProps={{ input: { 'aria-label': tag } }}
            />
            <Typography variant="inherit" sx={styles.tag}>
                {tag}
            </Typography>
        </Box>
    );
}

interface DeleteSelectedRootNetworksHeaderProps {
    selectedTags: string[];
}

export function DeleteSelectedRootNetworksHeader({ selectedTags }: Readonly<DeleteSelectedRootNetworksHeaderProps>) {
    const intl = useIntl();
    return (
        <Box sx={styles.container}>
            <IconButton
                size="small"
                sx={styles.deleteButton}
                // TODO remove the selected root networks once the backend allows it
                onClick={() => {
                    console.log('Delete selected root networks', selectedTags);
                }}
                aria-label={intl.formatMessage({ id: 'delete' })}
            >
                <Delete fontSize="small" />
            </IconButton>
        </Box>
    );
}
