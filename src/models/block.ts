export interface Block {
	id?: number;
	hash: string;
	epoch_no: number;
	slot_no: number;
	epoch_slot_no?: number;
	block_no: number;
	previous_block?: number;
	next_block?: number;
	merkle_root?: number;
	slot_leader_id?: number;
	slot_leader?: string;
	out_sum?: number;
	fees?: number;
	confirmations?: number;
	size?: number;
	time?: Date;
	tx_count?: number;
	proto_major?: number;
	proto_minor?: number;
	vrf_key?: string;
	op_cert?: string;
}