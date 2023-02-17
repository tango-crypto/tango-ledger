import { Metadata } from "../models/metadata";
import { Utxo } from "../models/utxo";
import { PlutusData } from "@emurgo/cardano-serialization-lib-nodejs";

const CIP68_REFERENCE_PREFIX = '000643b0';
const CIP68_NFT_PREFIX = '000de140';
const CIP68_FT_PREFIX = '0014de40';
const CIP68_STANDARD: {[key:string]: number} = {
	[CIP68_REFERENCE_PREFIX]: 100, // Reference Token
	[CIP68_NFT_PREFIX]: 222, // NFT Token
	[CIP68_FT_PREFIX]: 333, // FT token
}

const UNPRINTABLE_CHARACTERS_REGEXP = /[\p{Cc}\p{Cn}\p{Cs}]+/gu;

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

	isPrintableUtf8(text: string, encoding: BufferEncoding = 'hex'): { utf8: boolean, text: string} {
		try {
			const t = Buffer.from(text, encoding).toString('utf8');
			return { utf8: !UNPRINTABLE_CHARACTERS_REGEXP.test(t), text: t};
		} catch (error) {
			return { utf8: false, text }
		}
	},

	convertAssetName: function(asset_name: string, encoding: BufferEncoding = 'hex'): { asset_name: string, asset_name_label: number } {
		const result: any = {};
		if (!asset_name) return result;
		const asset_name_label = CIP68_STANDARD[asset_name.substring(0, 8)];
		const real_asset_name = asset_name_label ? asset_name.substring(8) : asset_name;
		if (asset_name_label) {
			result.asset_name_label = asset_name_label;
		}
		const { utf8, text } = Utils.isPrintableUtf8(real_asset_name, encoding);
		result.asset_name = utf8 ? text : real_asset_name;
		return result;
	},

	isCIP68Standard(asset_name: string): boolean {
		return !!CIP68_STANDARD[asset_name.substring(0, 8)];
	},

	buildCip68ReferenceAssetName(policy_id: string, asset_name: string): string {
		const reference_asset_name = CIP68_REFERENCE_PREFIX + asset_name.substring(8);
		return policy_id + reference_asset_name;
	},

	convertDatumToMetadata(policy_id: string, asset_name: string, raw: any, datum?: any): Metadata {
		const { asset_name: name, asset_name_label } = Utils.convertAssetName(asset_name);
		let json;
		try {
			const [metadata, version] = JSON.parse(PlutusData.from_hex(raw).to_json(0)).fields;
			json = {
				[policy_id]: {
					[name]: metadata
				}, 
				version
			}
		} catch (err) {
			// TODO: parse datum for integer overflow
			json = datum?.fields
			console.log(err);
		}
		return {
			label: asset_name_label.toString(),
			json
		}
	}
}

export default Utils;