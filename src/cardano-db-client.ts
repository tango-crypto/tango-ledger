import { Knex, knex } from 'knex';
import { Utxo } from './models/utxo';

export class CardanoDbClient {
	knex: Knex;
	config: Knex.Config;
	destroyed: boolean;

	constructor(conf: Knex.Config) {
		this.config = {
			...conf,
			client: conf.client || 'pg',
			debug: conf.debug || false,
		};
		this.destroyed = false;
	}

	connect(){
		if (!this.destroyed) {
			this.knex = knex(this.config);
		} else {
			this.knex.initialize(this.config);
		}
	}

	async disconnect() {
		this.destroyed = true;
		return this.knex.destroy();
	}

	async getClientConnection() {
		return this.knex.client.acquireRawConnection();
	}

	async getUtxos(txId: number): Promise<Utxo[]> {
		return this.knex.select(
			'utxo.address',
			this.knex.raw(`encode(tx.hash, 'hex') as hash`),
			'utxo.index',
			'utxo.value',
			'asset.quantity',
			this.knex.raw(`encode(asset.policy, 'hex') as policy_id`),
			this.knex.raw(`convert_from(asset.name, 'UTF-8') as asset_name`)
		)
		.from<Utxo>({utxo: 'tx_out'})
		.innerJoin('tx', 'tx.id', 'utxo.tx_id')
		.leftJoin({asset: 'ma_tx_out'}, 'asset.tx_out_id', 'utxo.id')
		.where('utxo.tx_id', '=', txId)
		.then(rows => rows);
	}
}
