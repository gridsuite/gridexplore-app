/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { getFileIcon } from '@gridsuite/commons-ui';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { FormattedMessage } from 'react-intl';
import { FunctionComponent } from 'react';
import { Theme } from '@mui/material';

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

interface HighlightedTextProps {
    text: string;
    highlight: string;
}

interface SearchItemProps {
    matchingElement: matchingElementProps;
    inputValue: string;
}

interface matchingElementProps {
    id: string;
    name: string;
    type: string;
    pathName: string[];
    pathUuid: string[];
}

export const HighlightedText: FunctionComponent<HighlightedTextProps> = ({
    text,
    highlight,
}) => {
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <span key={i} style={{ fontWeight: 'bold' }}>
                        {part}
                    </span>
                ) : (
                    part
                )
            )}
        </span>
    );
};

export const SearchItem: FunctionComponent<SearchItemProps> = ({
    matchingElement,
    inputValue,
    ...othersProps
}) => {
    return (
        <li {...othersProps}>
            <>
                <span>{getFileIcon(matchingElement.type, styles.icon)}</span>
                <Grid container>
                    <Grid item xs={11} sx={styles.grid}>
                        <HighlightedText
                            text={matchingElement.name}
                            highlight={inputValue}
                        />
                    </Grid>
                    <Grid item sx={styles.grid2}>
                        <Typography>
                            <FormattedMessage id="path" />
                            {matchingElement.pathName?.join(' / ')}
                        </Typography>
                    </Grid>
                </Grid>
            </>
        </li>
    );
};
