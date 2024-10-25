/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useMemo } from 'react';
import { getFileIcon } from '@gridsuite/commons-ui';
import { Grid, Theme, Typography } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { ElementAttributesES } from '../../redux/types';
import cyrb53 from '../../utils/cyrb53';

const styles = {
    icon: (theme: Theme) => ({
        marginRight: theme.spacing(2),
        width: '18px',
        height: '18px',
    }),
    grid: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'inline-block',
    },
    grid2: (theme: Theme) => ({
        marginRight: theme.spacing(2),
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'inline-block',
        color: 'grey',
    }),
};

export interface HighlightedTextProps {
    text: string;
    highlight: string;
}

export interface SearchItemProps {
    matchingElement: ElementAttributesES;
    inputValue: string;
}

export function HighlightedText({ text, highlight }: Readonly<HighlightedTextProps>) {
    const escapedHighlight = useMemo(() => highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), [highlight]);
    const parts = useMemo<[string, number][]>(
        () => text.split(new RegExp(`(${escapedHighlight})`, 'gi')).map((part) => [part, cyrb53(part)]),
        [escapedHighlight, text]
    );
    return (
        <span>
            {parts.map(([part, hashCode]) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <span key={`part-${hashCode}`} style={{ fontWeight: 'bold' }}>
                        {part}
                    </span>
                ) : (
                    part
                )
            )}
        </span>
    );
}

export function SearchItem({ matchingElement, inputValue, ...othersProps }: Readonly<SearchItemProps>) {
    return (
        <li {...othersProps}>
            <span>{getFileIcon(matchingElement.type, styles.icon)}</span>
            <Grid container>
                <Grid item xs={11} sx={styles.grid}>
                    <HighlightedText text={matchingElement.name} highlight={inputValue} />
                </Grid>
                <Grid item sx={styles.grid2}>
                    <Typography>
                        <FormattedMessage id="path" />
                        {matchingElement.pathName?.join(' / ')}
                    </Typography>
                </Grid>
            </Grid>
        </li>
    );
}
