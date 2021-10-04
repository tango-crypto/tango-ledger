import { Metadata } from "./metadata";

export interface Asset {
	quantity: number;
	policy_id: string;
	asset_name: string;
	mint_or_burn_count?: number;
	initial_mint_tx_hash?: string;
	on_chain_metadata?: any;
	fingerprint?: string;
	metadata?: Metadata;
}