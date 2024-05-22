/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { getFileIcon } from '@gridsuite/commons-ui';
import { Theme } from '@mui/material';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { FormattedMessage } from 'react-intl';
import { HighlightedText } from './highlighted-text';
import { FC } from 'react';
import { ElementInfos } from './search.type';

interface SearchItemProps {
    matchingElement: ElementInfos;
    inputValue: string;
    [x: string]: any;
}

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

const SearchItem: FC<SearchItemProps> = (props) => {
    const { matchingElement, inputValue, ...othersProps } = props;
    return (
        <li {...othersProps}>
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
        </li>
    );
};

export default SearchItem;
