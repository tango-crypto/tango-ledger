import { CostModel } from "./cost-model";

export interface EpochParameters {
	epoch_no?: number,
	min_fee_a?: number,
	min_fee_b?: number,
	max_block_size?: number,
	max_tx_size?: number,
	max_block_header_size?: number,
	key_deposit?: number,
	pool_deposit?: number,
	max_epoch?: number,
	optimal_pool_count?: number,
	influence_a0?: number,
	monetary_expand_rate_rho?: number,
	treasury_growth_rate_tau?: number,
	decentralisation?: number,
	extra_entropy?: string;
	protocol_major?: number,
	protocol_minor?: number,
	min_utxo?: number,
	min_pool_cost?: number,
	nonce: string,
	coins_per_utxo_size?: number;
	price_mem?: number;
	price_step?: number;
	max_tx_ex_mem?: number;
	max_tx_ex_steps?: number;
	max_block_ex_mem?: number;
	max_block_ex_steps?: number;
	max_val_size?: number;
	collateral_percent?: number;
	max_collateral_inputs?: number;
	block_id?: number;
	cost_model?: CostModel;
}