import { FieldValues, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useCallback, useEffect } from 'react';
import { UUID } from 'node:crypto';
import { ObjectSchema } from 'yup';
import { snackWithFallback, updateModification, useSnackMessage } from '@gridsuite/commons-ui';

export interface WithId {
    uuid: UUID;
}

export interface UseUpdateModificationProps<FormData extends FieldValues, ModificationData extends WithId> {
    formSchema: ObjectSchema<FormData>;
    modificationData: ModificationData | undefined;
    dtoToForm: (dto: ModificationData) => FormData;
    formToDto: (form: FormData) => Omit<ModificationData, 'uuid'>;
    errorHeaderId: string;
}

export const useUpdateModification = <FormData extends FieldValues, ModificationData extends WithId>({
    formSchema,
    modificationData,
    dtoToForm,
    formToDto,
    errorHeaderId,
}: UseUpdateModificationProps<FormData, ModificationData>) => {
    const { snackError } = useSnackMessage();

    const formMethods = useForm<FormData>({
        resolver: yupResolver(formSchema) as any, // really difficult to type with yup inferred types
    });

    useEffect(() => {
        if (modificationData) {
            formMethods.reset(dtoToForm(modificationData));
        }
    }, [formMethods, modificationData, dtoToForm]);

    const onSubmit = useCallback(
        (form: FormData) => {
            if (modificationData) {
                updateModification({
                    modificationUuid: modificationData.uuid,
                    body: JSON.stringify(formToDto(form)),
                }).catch((error: unknown) => {
                    snackWithFallback(snackError, error, { headerId: errorHeaderId });
                });
            }
        },
        [snackError, modificationData?.uuid, formToDto, errorHeaderId]
    );

    return { formMethods, onSubmit };
};
