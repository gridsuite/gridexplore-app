import { UUID } from 'crypto';

export interface StashedElementFirst {
    elementUuid: UUID;
    elementName: string;
    type: string;
    accessRights: { isPrivate: boolean | null };
    owner: string;
    subDirectoryCount: number;
    description: string;
    creationDate: Date;
    lastModificationDate: Date;
    lastModifiedBy: Date;
}

export interface StashedElement {
    first: StashedElementFirst;
    second: number;
}
