import { Pool } from "./pool";
import { StakeAddress } from "./stake-address";
import { Transaction } from "./transaction";

export interface Delegation {
    id: number;
    addr_id: number;
    cer_index: number;
    pool_hash_id: number;
    active_epoch_no: number;
    tx_id: number;
    slot_no: number;
    redeemer_id?: number;
    stake_address?: StakeAddress;
    pool?: Pool;
    transaction?: Transaction;
}