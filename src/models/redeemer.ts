import { Datum } from "./datum";

export interface Redeemer {
    tx_id?: number;
    hash?: string;
    unit_mem: number;
    unit_steps: number;
    fee?: number;
    purpose: string;
    index: number;
    script_hash?: string;
    data: Datum;
}