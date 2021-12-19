export interface Epoch {
    id: number;
    out_sum: number;
    fees: number;
    tx_count: number;
    blk_count: number;
    no: number;
    start_time: Date;
    end_time: Date
}