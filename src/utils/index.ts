import { Utxo } from "../models/utxo";

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
					asset_name: Utils.convert(curr.asset_name),
					fingerprint: curr.fingerprint
				})
			}
			return acc; 
		}, {});
		
		return Object.keys(groups).map(addr => ({ ...groups[addr]}));
	},

	convert: function(text: string, encoding: BufferEncoding = 'hex') {
		try {
			return Buffer.from(text, encoding).toString('utf8');
		} catch(err) {
			return text;
		}
	}
}

export default Utils;