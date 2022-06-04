import { UserData } from "./user";

export interface FormationData {
    coleader: string;
    id: string;
    leader: string;
    locked: boolean;
    members: UserData[];
    name: string;
    tag: string;
}
