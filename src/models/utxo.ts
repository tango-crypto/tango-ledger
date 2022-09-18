import { Asset } from "./asset";
import { Script } from "./script";

export interface Utxo {
	tx_id?: number;
	address: string;
	hash?: string;
	index?: number;
	value?: number;
	smart_contract?: boolean;
	has_script?: boolean;
	quantity?: number;
	policy_id?: string;
	asset_name?: string;
	fingerprint?: string;
	assets?: Asset[];
	script?: Script;
}