/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Box } from '@mui/material';
import { useSearchParams } from 'react-router';
import TreeViewsContainer from './tree-views-container';
import DirectoryBreadcrumbs from './directory-breadcrumbs';
import DirectoryContent from './directory-content';

export default function ExplorerLayout() {
    const [searchParams] = useSearchParams();
    const sourceItemUuid = searchParams.get('sourceItemUuid') || undefined;
    return (
        <Box display="flex" width="100%" height="100%">
            <Box width="30%" height="100%" overflow="auto" style={{ borderRight: '1px solid #515151' }}>
                <TreeViewsContainer sourceItemUuid={sourceItemUuid} />
            </Box>
            <Box width="70%" height="100%" display="flex" flexDirection="column">
                <Box flexShrink={0}>
                    <DirectoryBreadcrumbs />
                </Box>
                <DirectoryContent />
            </Box>
        </Box>
    );
}
