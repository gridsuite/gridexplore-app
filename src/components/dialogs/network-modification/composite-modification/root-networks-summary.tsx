/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Box, Chip, Typography } from '@mui/material';
import { FormattedMessage } from 'react-intl';

const styles = {
    container: { paddingBottom: 1 },
    title: { fontWeight: 600, marginBottom: 0.5 },
    chips: { display: 'flex', flexWrap: 'wrap', gap: 0.5 },
};

interface RootNetworksSummaryProps {
    tags: string[];
    studyCountByTag: Record<string, number>;
}

export default function RootNetworksSummary({ tags, studyCountByTag }: Readonly<RootNetworksSummaryProps>) {
    if (tags.length === 0) {
        return null;
    }
    return (
        <Box sx={styles.container}>
            <Typography variant="body2" sx={styles.title}>
                <FormattedMessage id="rootNetworks" />
            </Typography>
            <Box sx={styles.chips}>
                {tags.map((tag) => (
                    <Chip
                        key={tag}
                        size="small"
                        color="primary"
                        label={studyCountByTag[tag] ? `${tag} (${studyCountByTag[tag]})` : tag}
                    />
                ))}
            </Box>
        </Box>
    );
}
