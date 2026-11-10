/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Dispatch, SetStateAction, useState } from 'react';
import { Switch, Tooltip } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import type { Row, Table } from '@tanstack/react-table';
import type { UUID } from 'node:crypto';
import {
    ActivableChip,
    type ComposedModificationMetadata,
    isActivated,
    isApplicableOn,
    isAppliedOn,
    isDeactivatedByAncestor,
    isDeactivatedItselfOrByAncestor,
    isModificationEditLocked,
    type NetworkModificationActivations,
    type NetworkModificationApplicabilities,
    snackWithFallback,
    useSnackMessage,
} from '@gridsuite/commons-ui';
import { updateModificationsActivation, updateRootNetworkApplicability } from '../../../../utils/rest-api';

/**
 * These cells are SwitchCell and RootNetworkChipCell of commons-ui, which only save within a study, saving out of any
 * study. They read what NetworkModificationsTable puts in its meta, untyped outside commons-ui: the activations as
 * fetched, with the changes still on their way to the server laid over. GridExplore has no study, hence no root
 * network id: the tag stands for it.
 */
interface TableMeta {
    modifications: {
        activations: NetworkModificationActivations;
        setPendingActivations: Dispatch<SetStateAction<NetworkModificationActivations>>;
        applicabilities: NetworkModificationApplicabilities;
        setPendingApplicabilities: Dispatch<SetStateAction<NetworkModificationApplicabilities>>;
    };
    status: { isDisabled?: boolean };
}

interface ApplicabilityCellProps {
    row: Row<ComposedModificationMetadata>;
    table: Table<ComposedModificationMetadata>;
    compositeModificationId: UUID;
}

export function ActivationSwitchCell({ row, table, compositeModificationId }: Readonly<ApplicabilityCellProps>) {
    const [isLoading, setIsLoading] = useState(false);
    const { snackError } = useSnackMessage();
    const { modifications, status } = table.options.meta as TableMeta;
    const { uuid, type } = row.original;
    const activated = isActivated(modifications.activations, uuid);

    const toggleActivation = (_event: unknown, checked: boolean) => {
        setIsLoading(true);
        modifications.setPendingActivations((prev) => ({ ...prev, [uuid]: checked }));
        updateModificationsActivation(compositeModificationId, [uuid], checked, type)
            .catch((error) => {
                modifications.setPendingActivations((prev) => {
                    const rolledBack = { ...prev };
                    delete rolledBack[uuid];
                    return rolledBack;
                });
                snackWithFallback(snackError, error, { headerId: 'networkModificationActivationError' });
            })
            .finally(() => setIsLoading(false));
    };

    return (
        <Tooltip
            title={<FormattedMessage id={activated ? 'deactivateModification' : 'activateModification'} />}
            arrow
            enterDelay={250}
        >
            <span>
                <Switch
                    size="small"
                    checked={activated}
                    disabled={
                        isLoading ||
                        !!status.isDisabled ||
                        !!row.original.childFromReadOnlyShared ||
                        isDeactivatedByAncestor(row, modifications.activations)
                    }
                    onChange={toggleActivation}
                />
            </span>
        </Tooltip>
    );
}

export function RootNetworkApplicabilityCell({
    row,
    table,
    compositeModificationId,
    tag,
}: Readonly<ApplicabilityCellProps & { tag: string }>) {
    const [isLoading, setIsLoading] = useState(false);
    const { snackError } = useSnackMessage();
    const { modifications, status } = table.options.meta as TableMeta;
    const { uuid } = row.original;
    const rootNetworkId = tag as UUID;
    const applicable = isApplicableOn(modifications.applicabilities, uuid, rootNetworkId);

    const setPending = (applicability?: boolean) =>
        modifications.setPendingApplicabilities((prev) => {
            const byTag = { ...prev[uuid] };
            if (applicability === undefined) {
                delete byTag[rootNetworkId];
            } else {
                byTag[rootNetworkId] = applicability;
            }
            return { ...prev, [uuid]: byTag };
        });

    const toggleApplicability = () => {
        setIsLoading(true);
        setPending(!applicable);
        updateRootNetworkApplicability(compositeModificationId, [uuid], tag, !applicable)
            .catch((error) => {
                setPending(undefined);
                snackWithFallback(snackError, error, { headerId: 'modificationActivationByRootNetworkError' });
            })
            .finally(() => setIsLoading(false));
    };

    return (
        <ActivableChip
            label={tag}
            tooltipMessage={tag}
            isActivationRequested={applicable}
            isActivationEffective={isAppliedOn(
                row,
                modifications.activations,
                modifications.applicabilities,
                rootNetworkId
            )}
            isDisabled={
                isLoading ||
                !!status.isDisabled ||
                isModificationEditLocked(row.original) ||
                isDeactivatedItselfOrByAncestor(row, modifications.activations)
            }
            onClick={toggleApplicability}
        />
    );
}
