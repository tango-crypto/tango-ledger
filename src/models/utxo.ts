import { Asset } from "./asset";
import { Datum } from "./datum";
import { Script } from "./script";

export interface Utxo {
	tx_id?: number;
	address: string;
	hash?: string;
	index?: number;
	value?: number;
	has_script?: boolean;
	quantity?: number;
	policy_id?: string;
	asset_name?: string;
	fingerprint?: string;
	assets?: Asset[];
	inline_datum?: Datum;
	reference_script?: Script;
	script?: Script;
}