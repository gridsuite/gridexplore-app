/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Box, Checkbox, IconButton, Typography } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { useIntl } from 'react-intl';
import type { HeaderContext } from '@tanstack/react-table';
import type { ComposedModificationMetadata } from '@gridsuite/commons-ui';
import { useRootNetworkColumnSelection } from './use-root-network-column-selection';

const styles = {
    container: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    checkbox: { padding: '2px' },
    tag: { fontWeight: 'inherit', whiteSpace: 'nowrap' },
    // fits in the 30px of the column, minus the padding of the header cell
    deleteButton: { padding: '3px' },
};

/**
 * The column id is the tag: a single component for all the columns, so that rebuilding the columns doesn't remount the
 * headers, which would make the checkbox being clicked lose the focus.
 */
export default function RootNetworkColumnHeader({
    column,
}: Readonly<HeaderContext<ComposedModificationMetadata, unknown>>) {
    const tag = column.id;
    const { selectedTags, toggleTag } = useRootNetworkColumnSelection();
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

/**
 * The header of the sticky column deleting the selected root networks, shown only when some are selected.
 */
export function DeleteSelectedRootNetworksHeader() {
    const intl = useIntl();
    return (
        <Box sx={styles.container}>
            <IconButton
                size="small"
                sx={styles.deleteButton}
                // TODO remove the selected root networks once the backend allows it
                onClick={() => {}}
                aria-label={intl.formatMessage({ id: 'delete' })}
            >
                <Delete fontSize="small" />
            </IconButton>
        </Box>
    );
}
