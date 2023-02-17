import { Utxo } from "../models/utxo";

const CIP68_STANDARD: {[key:string]: number} = {
	'000643b0': 100, // Reference Token
	'000de140': 222, // NFT Token
	'0014de40': 333, // FT token
}

const Utils = {
	groupUtxoAssets: function(utxos: Utxo[]) {
		const groups = utxos.reduce((acc: {[key: string]: Utxo}, curr) => { 
			const key = `${curr.address}.${curr.hash}.${curr.index}`;
			if (!acc[key]) {
				acc[key] = {
					tx_id: curr.tx_id,
					address: curr.address,
					hash: curr.hash,
					index: curr.index,
					value: curr.value, 
					has_script: curr.has_script,
					datum: curr.datum,
					inline_datum: curr.inline_datum,
					reference_script: curr.reference_script,
					script: curr.script,
					assets: [], 
				};
			}

			if (curr.policy_id) {
				acc[key].assets.push({
					quantity: curr.quantity,
					policy_id: curr.policy_id,
					...Utils.convertAssetName(curr.asset_name),
					fingerprint: curr.fingerprint,
				})
			}
			return acc; 
		}, {});
		
		return Object.keys(groups).map(addr => ({ ...groups[addr]}));
	},

	convertAssetName: function(asset_name: string, encoding: BufferEncoding = 'hex') {
		const result: any = {};
		if (!asset_name) return result;
		const asset_name_label = CIP68_STANDARD[asset_name.substring(0, 8)];
		const real_asset_name = asset_name_label ? asset_name.substring(8) : asset_name;
		if (asset_name_label) {
			result.asset_name_label = asset_name_label;
		}
		try {
			result.asset_name = Buffer.from(real_asset_name, encoding).toString('utf8');
			return result;
		} catch(err) {
			result.asset_name = real_asset_name;
			return result;
		}
	}
}

export default Utils;