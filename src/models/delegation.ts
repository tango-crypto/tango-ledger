export interface Delegation {
    id: number;
    addr_id: number;
    cer_index: number;
    pool_hash_id: number;
    active_epoch_no: number;
    tx_id: number;
    slot_no: number;
    redeemer_id?: number;
}