import { Asset } from "./asset";

export interface Utxo {
	address: string;
	hash: string;
	index: number;
	value: number;
	smart_contract: boolean;
	quantity?: number;
	policy_id?: string;
	asset_name?: string;
	fingerprint?: string;
	assets?: Asset[];
}