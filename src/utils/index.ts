import { Utxo } from "../models/utxo";

const Utils = {
	groupUtxoAssets: function(utxos: Utxo[]) {
		let groups = utxos.reduce((acc: {[key: string]: Utxo}, curr) => { 
			const key = `${curr.address}.${curr.hash}.${curr.index}`;
			if (!acc[key]) {
				acc[key] = {
					address: curr.address,
					hash: curr.hash,
					index: curr.index,
					value: curr.value, 
					assets: [], 
				};
			}

			if (curr.policy_id) {
				acc[key].assets.push({
					quantity: curr.quantity,
					policy_id: curr.policy_id,
					asset_name: curr.asset_name
				})
			}
			return acc; 
		}, {});
		
		return Object.keys(groups).map(addr => ({ ...groups[addr]}));
	}
}

export default Utils;