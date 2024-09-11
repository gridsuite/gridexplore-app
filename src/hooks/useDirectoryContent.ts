/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useSelector } from 'react-redux';
import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { ElementAttributes, fetchElementsInfos, useSnackMessage } from '@gridsuite/commons-ui';
import { UUID } from 'crypto';
import { fetchUsersIdentities } from '../utils/rest-api';
import { AppState } from '../redux/reducer';

const getName = (userId, data) => {
    const firstName = data?.[userId]?.firstName;
    const lastName = data?.[userId]?.lastName;
    if (firstName && lastName) {
        return firstName + ' ' + lastName;
    } else if (firstName) {
        return firstName;
    } else if (lastName) {
        return lastName;
    } else {
        return userId; // fallback to id
    }
};

export const useDirectoryContent = (setIsMissingDataAfterDirChange: React.Dispatch<React.SetStateAction<boolean>>) => {
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
            setIsMissingDataAfterDirChange(false);
            return;
        }

        let metadata: Record<UUID, ElementAttributes> = {};
        let childrenToFetchElementsInfos = Object.values(currentChildren)
            .filter((e) => !e.uploading)
            .map((e) => e.elementUuid);
        if (childrenToFetchElementsInfos.length > 0) {
            Promise.all([
                fetchUsersIdentities(childrenToFetchElementsInfos), // TODO cache user identities across elements
                fetchElementsInfos(childrenToFetchElementsInfos),
            ])
                .then((res) => {
                    res[1].forEach((e) => {
                        // TODO proper typescript modeling instead of monkeypatching e directly
                        e.ownerName = getName(e.owner, res[0]?.data);
                        e.lastModifiedByName = getName(e.lastModifiedBy, res[0]?.data);
                        metadata[e.elementUuid] = e;
                    });
                })
                .catch((error) => {
                    if (previousData.current && Object.keys(previousData.current).length === 0) {
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

    // TODO remove this when global user identity caching is implemented
    const currentChildrenWithOwnerNames = useMemo(() => {
        if (!currentChildren) {
            return currentChildren;
        } else {
            return currentChildren.map((x) => ({
                ...x,
                ownerName: childrenMetadata?.[x.elementUuid]?.ownerName,
                lastModifiedByName: childrenMetadata?.[x.elementUuid]?.lastModifiedByName,
            }));
        }
    }, [currentChildren, childrenMetadata]);
    return [currentChildrenWithOwnerNames, childrenMetadata];
};
