/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useSelector } from 'react-redux';
import { useRef, useEffect, useCallback, useState } from 'react';
import { ElementAttributes, fetchElementsInfos, useSnackMessage } from '@gridsuite/commons-ui';
import { UUID } from 'crypto';
import { AppState } from '../redux/reducer';

export const useDirectoryContent = () => {
    const currentChildren = useSelector((state: AppState) => state.currentChildren);
    const [childrenMetadata, setChildrenMetadata] = useState<Record<UUID, ElementAttributes>>({});
    const { snackError } = useSnackMessage();
    const previousData = useRef<ElementAttributes[]>();
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
            return;
        }

        // Do not fetch metadata again if we just added a ghost element
        if (Object.values(currentChildren).some((e) => e.uploading)) {
            return;
        }

        const metadata: Record<UUID, ElementAttributes> = {};
        const childrenToFetchElementsInfos = Object.values(currentChildren).map((e) => e.elementUuid);
        if (childrenToFetchElementsInfos.length > 0) {
            fetchElementsInfos(childrenToFetchElementsInfos)
                .then((res) => {
                    // discarding request for older directory
                    if (previousData.current === currentChildren) {
                        res.forEach((e) => {
                            metadata[e.elementUuid] = e;
                        });
                        setChildrenMetadata(metadata);
                    }
                })
                .catch((error) => {
                    if (previousData.current && Object.keys(previousData.current).length === 0) {
                        handleError(error.message);
                    }
                });
        }
    }, [handleError, currentChildren]);

    return [currentChildren, childrenMetadata] as const;
};
