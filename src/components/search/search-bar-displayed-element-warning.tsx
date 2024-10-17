/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Paper, Theme, Typography } from '@mui/material';
import { useIntl } from 'react-intl';
import { HTMLAttributes } from 'react';

export type SearchBarPaperDisplayedElementWarningProps = HTMLAttributes<HTMLElement> & {
    elementFoundLength: number;
    elementFoundTotal: number;
    isLoading: boolean;
};

const styles = {
    displayedElementWarning: (theme: Theme) => ({
        color: theme.palette.info.main,
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
        marginLeft: theme.spacing(2),
    }),
};

export function SearchBarPaperDisplayedElementWarning(props: Readonly<SearchBarPaperDisplayedElementWarningProps>) {
    const { elementFoundLength, elementFoundTotal, isLoading, children, ...other } = props;
    const intl = useIntl();

    const shouldDisplayWarning = !isLoading && elementFoundLength < elementFoundTotal;

    return (
        <Paper {...other}>
            {shouldDisplayWarning && (
                <Typography variant="body1" sx={styles.displayedElementWarning}>
                    {intl
                        .formatMessage(
                            { id: 'showingSearchResults' },
                            {
                                nbElementsShown: elementFoundLength,
                                nbElementsTotal: elementFoundTotal,
                            }
                        )
                        .toString()}
                </Typography>
            )}
            {children}
        </Paper>
    );
}
