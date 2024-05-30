/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useSelector } from 'react-redux';
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useSnackMessage } from '@gridsuite/commons-ui';
import { fetchElementsInfos } from '../utils/rest-api';
import { UUID } from 'crypto';
import { IElement, IElementMetadata, ReduxState } from '../redux/reducer.type';

export const useDirectoryContent = (
    setIsMissingDataAfterDirChange: React.Dispatch<
        React.SetStateAction<boolean>
    >
) => {
    const currentChildren = useSelector(
        (state: ReduxState) => state.currentChildren
    );
    const [childrenMetadata, setChildrenMetadata] = useState<
        Record<UUID, IElementMetadata>
    >({});
    const { snackError } = useSnackMessage();

    const [rows, setRows] = useState<IElement[]>(currentChildren);
    const previousData = useRef<IElement[]>();
    previousData.current = currentChildren;

    const handleError = useCallback(
        (message: string) => {
            snackError({
                messageTxt: message,
            });
        },
        [snackError]
    );

    useEffect(() => {
        if (!currentChildren?.length) {
            setChildrenMetadata({});
            setIsMissingDataAfterDirChange(false);
            return;
        }

        let metadata: Record<UUID, IElementMetadata> = {};
        let childrenToFetchElementsInfos = Object.values(currentChildren)
            .filter((e) => !e.uploading)
            .map((e) => e.elementUuid);
        if (childrenToFetchElementsInfos.length > 0) {
            fetchElementsInfos(childrenToFetchElementsInfos)
                .then((res: IElementMetadata[]) => {
                    res.forEach((e) => {
                        metadata[e.elementUuid] = e;
                    });
                })
                .catch((error) => {
                    if (
                        previousData.current &&
                        Object.keys(previousData.current).length === 0
                    ) {
                        handleError(error.message);
                    }
                })
                .finally(() => {
                    // discarding request for older directory
                    if (previousData.current === currentChildren) {
                        setChildrenMetadata(metadata);
                        setIsMissingDataAfterDirChange(false);
                    }
                });
        }
    }, [handleError, currentChildren, setIsMissingDataAfterDirChange]);

    useEffect(() => {
        setRows(currentChildren);
    }, [currentChildren]);

    return [rows, childrenMetadata];
};
