declare module '@gridsuite/commons-ui' {
    import { FunctionComponent } from 'react';

    interface SnackInputs {
        messageTxt?: string;
        messageId?: string;
        messageValues?: string[];
        headerTxt?: string;
        headerId?: string;
        headerValues?: string[];
    }

    interface UseSnackMessageReturn {
        snackError: (snackInputs: SnackInputs) => void;
        snackWarning: (snackInputs: SnackInputs) => void;
        snackInfo: (snackInputs: SnackInputs) => void;
    }

    type ParameterType = {
        type: string;
        name: string;
        possibleValues: string[];
        defaultValue: string;
    };

    interface IFlatParameters {
        paramsAsArray: ParameterType[];
        initValues: Record<string, string | boolean>;
        onChange: (
            paramName: string,
            newValue: string,
            isInEdition: boolean
        ) => void;
        variant?: 'outlined' | 'standard' | 'filled';
        showSeparator?: boolean;
    }

    export function useSnackMessage(): UseSnackMessageReturn;

    export const FlatParameters: FunctionComponent<IFlatParameters>;

    export function useDebounce(
        [string]: () => void,
        [string]: number,
        ...args: any[]
    ): () => void;
}
