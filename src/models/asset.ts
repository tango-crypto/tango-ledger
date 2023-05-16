import { Metadata } from "./metadata";

export interface Asset {
	policy_id: string;
	asset_name: string;
	quantity: number;
	asset_name_label?: number;
	fingerprint?: string;
	created_at?: string;
	mint_transactions?: number;
	mint_quantity?: number;
	burn_quantity?: number;
	mint_or_burn_quantity?: number;
	initial_mint_tx_hash?: string;
	on_chain_metadata?: any;
	metadata?: Metadata[];
}