import { Utxo } from "../models/utxo";

const Utils = {
	groupUtxoAssets: function(utxos: Utxo[]) {
		const groups = utxos.reduce((acc: {[key: string]: Utxo}, curr) => { 
			const key = `${curr.address}.${curr.hash}.${curr.index}`;
			if (!acc[key]) {
				acc[key] = {
					address: curr.address,
					hash: curr.hash,
					index: curr.index,
					value: curr.value, 
					smart_contract: curr.smart_contract,
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