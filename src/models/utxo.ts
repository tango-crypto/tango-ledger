import { Asset } from "./asset";

export interface Utxo {
	address: string;
	hash: string;
	index: number;
	value: number;
	quantity?: number;
	policy_id?: string;
	asset_name?: string;
	assets?: Asset[];
}