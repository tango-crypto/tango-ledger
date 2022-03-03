import { Knex, knex } from 'knex';
import { Address } from '../models/address';
import { Asset } from '../models/asset';
import { Block } from '../models/block';
import { Pool } from '../models/pool';
import { Stake } from '../models/stake';
import { Transaction } from '../models/transaction';

import { Utxo } from "../models/utxo";
import { DbClient } from "./db-client";

import Utils from "../utils";
import { Metadata } from '../models/metadata';
import { EpochParameters } from '../models/epoch-paramenters';
import { PoolDelegation } from '../models/pool-delegation';
import { Epoch } from '../models/epoch';
import { StakeAddress } from '../models/stake-address';

export class PostgresClient implements DbClient {
	knex: Knex;
	config: Knex.Config;
	destroyed: boolean;

	constructor(conf: Knex.Config) {
		this.config = {
			...conf,
			client: 'pg'
		};
		this.destroyed = false;
		this.knex = knex(this.config);
	}
	
	isConnected(): boolean{
		return !this.destroyed;
	}

	reconnect(){
		this.knex.initialize(this.config);
	}

	disconnect(): Promise<void> {
		this.destroyed = true;
		return this.knex.destroy();
	}

	async getLatestBlock(): Promise<Block> {
		return this.knex.select(
			'block.id',
			this.knex.raw(`encode(block.hash, 'hex') as hash`),
			'block.epoch_no',
			'block.slot_no',
			'block.epoch_slot_no',
			'block.block_no',
			'prev_block.block_no as previous_block',
			'pool_hash.view as slot_leader',
			'block.size',
			'block.time',
			'block.tx_count',
			'tx.out_sum',
			'tx.fees',
			this.knex.raw(`encode(block.op_cert, 'hex') as op_cert`),
			'block.vrf_key',
		)
		.from<Block>('block')
		.leftJoin('slot_leader', 'slot_leader.id', 'block.slot_leader_id')
		.leftJoin('pool_hash', 'pool_hash.id', 'slot_leader.pool_hash_id')
		.leftJoin({prev_block: 'block'}, 'prev_block.id', 'block.previous_id')
		.innerJoin(this.knex.select(
				'block.block_no',
				this.knex.raw(`SUM(tx.out_sum) as out_sum`),
				this.knex.raw(`SUM(tx.fee) as fees`),
			)
			.from('block')
			.leftJoin('tx', 'tx.block_id', 'block.id')
			.whereRaw('block.block_no is not null')
			.groupBy('block.block_no')
			.orderBy('block.block_no', 'desc')
			.limit(1)
			.as('tx'), pg => pg.on('tx.block_no', 'block.block_no')
		)
		.then(rows => ({...rows[0], confirmations: 1}))
	}

	async getBlock(id: number|string): Promise<Block> {
		let query = this.knex.select(
			'block.id',
			this.knex.raw(`encode(block.hash, 'hex') as hash`),
			'block.epoch_no',
			'block.slot_no',
			'block.epoch_slot_no',
			'block.block_no',
			'prev_block.block_no as previous_block',
			'next_block.block_no as next_block',
			'pool_hash.view as slot_leader',
			'block.size',
			'block.time',
			'block.tx_count',
			'tx.out_sum',
			'tx.fees',
			this.knex.raw(`(select block_no from block where block_no is not null order by block_no desc limit 1 ) - block.block_no + 1 as confirmations`),
			this.knex.raw(`encode(block.op_cert, 'hex') as op_cert`),
			'block.vrf_key',
		)
		.from<Block>('block')
		.leftJoin('slot_leader', 'slot_leader.id', 'block.slot_leader_id')
		.leftJoin('pool_hash', 'pool_hash.id', 'slot_leader.pool_hash_id')
		.leftJoin({prev_block: 'block'}, 'prev_block.id', 'block.previous_id')
		.leftJoin({next_block: 'block'}, 'next_block.previous_id', 'block.id');
		// .innerJoin('tx', 'tx.block_id', 'block.id');
		const numberOrHash = Number(id); 
		if (Number.isNaN(numberOrHash)) {
			query = query
			.innerJoin(this.knex.select(
					'block.id as block_id',
					this.knex.raw(`SUM(tx.out_sum) as out_sum`),
					this.knex.raw(`SUM(tx.fee) as fees`),
				)
				.from('block')
				.leftJoin('tx', 'tx.block_id', 'block.id')
				.whereRaw(`block.hash = decode('${id}', 'hex')`)
				.groupBy('block.id')
				.as('tx'), pg => pg.on('tx.block_id', 'block.id')
			)
		} else {
			query = query
			.innerJoin(this.knex.select(
					'block.id as block_id',
					this.knex.raw(`SUM(tx.out_sum) as out_sum`),
					this.knex.raw(`SUM(tx.fee) as fees`),
				)
				.from('block')
				.leftJoin('tx', 'tx.block_id', 'block.id')
				.where('block.block_no', '=', id)
				.groupBy('block.id')
				.as('tx'), pg => pg.on('tx.block_id', 'block.id')
			)
		}
		return query.then(rows => rows[0]);
	}

	async getBlockById(id: number|string): Promise<Block> {
		let query = this.knex.select(
			'block.id',
			this.knex.raw(`encode(block.hash, 'hex') as hash`),
			'block.epoch_no',
			'block.slot_no',
			'block.epoch_slot_no',
			'block.block_no',
			'prev_block.block_no as previous_block',
			'next_block.block_no as next_block',
			'pool_hash.view as slot_leader',
			'block.size',
			'block.time',
			'block.tx_count',
			'tx.out_sum',
			'tx.fees',
			this.knex.raw(`(select block_no from block where block_no is not null order by block_no desc limit 1 ) - block.block_no + 1 as confirmations`),
			this.knex.raw(`encode(block.op_cert, 'hex') as op_cert`),
			'block.vrf_key',
		)
		.from<Block>('block')
		.leftJoin('slot_leader', 'slot_leader.id', 'block.slot_leader_id')
		.leftJoin('pool_hash', 'pool_hash.id', 'slot_leader.pool_hash_id')
		.leftJoin({prev_block: 'block'}, 'prev_block.id', 'block.previous_id')
		.leftJoin({next_block: 'block'}, 'next_block.previous_id', 'block.id');
		// .innerJoin('tx', 'tx.block_id', 'block.id');
		const numberOrHash = Number(id); 
		if (Number.isNaN(numberOrHash)) {
			query = query
			.innerJoin(this.knex.select(
					'block.id as block_id',
					this.knex.raw(`SUM(tx.out_sum) as out_sum`),
					this.knex.raw(`SUM(tx.fee) as fees`),
				)
				.from('block')
				.leftJoin('tx', 'tx.block_id', 'block.id')
				.whereRaw(`block.hash = decode('${id}', 'hex')`)
				.groupBy('block.id')
				.as('tx'), pg => pg.on('tx.block_id', 'block.id')
			)
		} else {
			query = query
			.innerJoin(this.knex.select(
					'block.id as block_id',
					this.knex.raw(`SUM(tx.out_sum) as out_sum`),
					this.knex.raw(`SUM(tx.fee) as fees`),
				)
				.from('block')
				.leftJoin('tx', 'tx.block_id', 'block.id')
				.where('block.id', '=', id)
				.groupBy('block.id')
				.as('tx'), pg => pg.on('tx.block_id', 'block.id')
			)
		}
		return query.then(rows => rows[0]);
	}

	async getBlockTip(id: number|string): Promise<number> {
		let query = this.knex.select(
			'block.block_no as block_no',
		)
		.from<Block>('block')
		const numberOrHash = Number(id); 
		if (Number.isNaN(numberOrHash)) {
			query = query.whereRaw(`block.hash = decode('${id}', 'hex')`)
		} else {
			query = query.where('block.id', '=', id)
		}
		return query.then(rows => rows[0]?.block_no);
	}

	async getLatestBlockTip(): Promise<number> {
		return this.knex.select(
			'block.block_no as block_no',
		)
		.from<Block>('block')
		.whereRaw('block.block_no is not null')
		.orderBy('block.block_no', 'desc')
		.limit(1)
		.then(rows => rows[0].block_no)
	}

	async getBlockTransactions(id: number | string, size = 50, order = 'desc', txId = 0): Promise<Transaction[]> {
		const seekExpr = txId <= 0 ? '' : order == 'asc' ? `> ${txId}` : `< ${txId}`;
		const numberOrHash = Number(id);
		const whereFilter = Number.isNaN(numberOrHash) ? `block.hash = decode('${id}', 'hex')` : `block.block_no = ${numberOrHash}`
		return this.knex.select(
			'tx.id',
			this.knex.raw(`encode(tx.hash, 'hex') as hash`),
			'tx.block_id',
			'tx.block_index',
			'tx.out_sum',
			'tx.fee',
			'tx.deposit',
			'tx.size',
			'tx.invalid_before',
			'tx.invalid_hereafter',
			'tx.valid_contract',
			'tx.script_size'
		)
		.from<Transaction>('tx')
		.innerJoin('block', 'tx.block_id', 'block.id')
		.whereRaw(`${whereFilter}${seekExpr ? ' and tx.id ' + seekExpr : ''}`)
		.orderBy('tx.id', order)
		.limit(size);
	}

	async getBlockTransactionsById(block_id: number): Promise<Transaction[]> {
		return this.knex.select(
			'tx.id',
			this.knex.raw(`encode(tx.hash, 'hex') as hash`),
			'tx.block_id',
			'tx.block_index',
			'tx.out_sum',
			'tx.fee',
			'tx.deposit',
			'tx.size',
			'tx.invalid_before',
			'tx.invalid_hereafter',
			'tx.valid_contract',
			'tx.script_size'
		)
		.from<Transaction>('tx')
		.where('tx.block_id', '=', block_id);
	}

	async getTransaction(id: number|string, shallow = false): Promise<Transaction> {
		if (shallow) return this.getTransactionShallow(id);
		const numberOrHash = Number(id);
		const whereFilter = Number.isNaN(numberOrHash) ? `tx.hash = decode('${id}', 'hex')` : `tx.id = ${id}`;
		return this.knex.select(
			'tx.id',
			'tx.block_id',
			this.knex.raw(`encode(tx.hash, 'hex') as hash`),
			'tx.block_index',
			'tx.out_sum',
			'tx.fee',
			'tx.deposit',
			'tx.size',
			'tx.invalid_before',
			'tx.invalid_hereafter',
			'tx.valid_contract',
			'tx.script_size',
			this.knex.raw(`(select count(*) from (select tx.id from tx_out where tx_out.tx_id = tx.id union all (select tx.id from tx_in where tx_in.tx_in_id = tx.id)) tx_count) as utxo_count`),
			this.knex.raw(`(select count(*) from withdrawal where withdrawal.tx_id = tx.id) as withdrawal_count`),
			this.knex.raw(`(select count(*) from delegation where delegation.tx_id = tx.id) as delegation_count`),
			this.knex.raw(`(select count(*) from stake_registration where stake_registration.tx_id = tx.id) as stake_cert_count`),
			this.knex.raw(`exists (select 1 from pool_update where pool_update.registered_tx_id = tx.id) as pool_update`),
			this.knex.raw(`exists (select 1 from pool_retire where pool_retire.announced_tx_id = tx.id) as pool_retire`),
			this.knex.raw(`(select count(*) from ma_tx_mint where ma_tx_mint.tx_id = tx.id) as asset_mint_or_burn_count`),
			this.knex.raw(`encode(block.hash, 'hex') as block_hash`),
			'block.epoch_no as block_epoch_no',
			'block.block_no as block_block_no',
			'block.slot_no as block_slot_no',
			'asset.quantity',
			'asset.policy_id',
			'asset.asset_name',
			'asset.fingerprint',
		)
		.from<Transaction>('tx')
		.innerJoin('block', 'block.id', 'tx.block_id')
		.innerJoin(
			this.knex.select(
					'tx.id as tx_id', 
					this.knex.raw(`SUM(mto.quantity) as quantity`),
					this.knex.raw(`encode(asset.policy, 'hex') as policy_id`),
					this.knex.raw(`encode(asset.name, 'hex') as asset_name`),
					'asset.fingerprint'
				)
				.from({utxo: 'tx_out'})
				.innerJoin('tx', 'tx.id', 'utxo.tx_id')
				.leftJoin({mto: 'ma_tx_out'}, 'mto.tx_out_id', 'utxo.id')
				.leftJoin({asset: 'multi_asset'}, 'asset.id', 'mto.ident')
				.whereRaw(whereFilter)
				.groupBy('tx.id', 'asset.policy', 'asset.name', 'asset.fingerprint')
				.as('asset'), pg => pg.on('asset.tx_id', 'tx.id')
		)
		.then(rows => {
			const assets: Asset[] = rows.map(r => ({
				quantity: r.quantity, 
				policy_id: r.policy_id, 
				asset_name: Utils.convert(r.asset_name),
				fingerprint: r.fingerprint
			})).filter(a => a.policy_id);
			const tx: Transaction = rows.length > 0 ? {
				id: rows[0].id,
				hash: rows[0].hash,
				block_id: rows[0].block_id,
				block_index: rows[0].block_index,
				out_sum: rows[0].out_sum,
				fee: rows[0].fee,
				deposit: rows[0].deposit,
				size: rows[0].size,
				invalid_before: rows[0].invalid_before,
				invalid_hereafter: rows[0].invalid_hereafter,
				valid_contract: rows[0].valid_contract,
				script_size: rows[0].script_size,
				utxo_count: rows[0].utxo_count,
				withdrawal_count: rows[0].withdrawal_count,
				delegation_count: rows[0].delegation_count,
				stake_cert_count: rows[0].stake_cert_count,
				pool_update: rows[0].pool_update,
				pool_retire: rows[0].pool_retire,
				asset_mint_or_burn_count: rows[0].asset_mint_or_burn_count,
				block: { 
					hash: rows[0].block_hash,
					epoch_no: rows[0].block_epoch_no, 
					block_no: rows[0].block_block_no,
					slot_no: rows[0].block_slot_no
				},
				assets: assets
			} : null;
			return tx;
		});
	}

	private async getTransactionShallow(id: number|string): Promise<Transaction> {
		let query = this.knex.select(
			'tx.id',
			this.knex.raw(`encode(tx.hash, 'hex') as hash`),
			'tx.block_id',
			'tx.block_index',
			'tx.out_sum',
			'tx.fee',
			'tx.deposit',
			'tx.size',
			'tx.invalid_before',
			'tx.invalid_hereafter',
			'tx.valid_contract',
			'tx.script_size'
		)
		.from<Transaction>('tx');

		const numberOrHash = Number(id); 
		if (Number.isNaN(numberOrHash)) {
			query = query.whereRaw(`tx.hash = decode('${id}', 'hex')`)
		} else {
			query  = query.where('tx.id', '=', id)
		}
		return query.then((rows: any[]) => rows[0]);
	}

	async getTransactionTip(id: number | string): Promise<number> {
		let query = this.knex.select(
			'block.block_no as block_no',
		)
		.from<Transaction>('tx')
		.innerJoin('block', 'block.id', 'tx.block_id');
		const numberOrHash = Number(id); 
		if (Number.isNaN(numberOrHash)) {
			query = query.whereRaw(`tx.hash = decode('${id}', 'hex')`)
		} else {
			query = query.where('tx.id', '=', id)
		}
		return query.then(rows => rows[0]?.block_no);
	}

	async getTransactionUtxos(txHash: string): Promise<{hash: string, outputs: Utxo[], inputs: Utxo[]}> {
		return this.knex.select(
			'utxo.address',
			this.knex.raw(`encode(tx.hash, 'hex') as hash`),
			'utxo.index',
			'utxo.value',
			this.knex.raw('utxo.address_has_script as smart_contract'),
			'mto.quantity',
			'asset.fingerprint',
			this.knex.raw(`encode(asset.policy, 'hex') as policy_id`),
			this.knex.raw(`encode(asset.name, 'hex') as asset_name`)
		)
		.from<Utxo>({utxo: 'tx_out'})
		.innerJoin('tx', 'tx.id', 'utxo.tx_id')
		.leftJoin({mto: 'ma_tx_out'}, 'mto.tx_out_id', 'utxo.id')
		.leftJoin({asset: 'multi_asset'}, 'asset.id', 'mto.ident')
		.whereRaw(`tx.hash = decode('${txHash}', 'hex')`)
		.union(pg => pg.select(
				'tx_out.address',
				'tx_out.hash',
				'tx_out.index',
				'tx_out.value',
				this.knex.raw('tx_out.address_has_script as smart_contract'),
				'mto.quantity',
				'asset.fingerprint',
				this.knex.raw(`encode(asset.policy, 'hex') as policy_id`),
				this.knex.raw(`encode(asset.name, 'hex') as asset_name`)
			)
			.from<Utxo>('tx_in')
			.innerJoin(this.knex.select(
				'tx_out.*', 
				this.knex.raw(`encode(tx.hash, 'hex') as hash`)
				)
				.from('tx_out')
				.innerJoin('tx', 'tx.id', 'tx_out.tx_id')
				.as('tx_out'), pg => pg.on('tx_out.tx_id', 'tx_in.tx_out_id').andOn('tx_out.index', 'tx_in.tx_out_index')
			)
			.innerJoin('tx', 'tx.id', 'tx_in.tx_in_id')
			.leftJoin({mto: 'ma_tx_out'}, 'mto.tx_out_id', 'tx_out.id')
			.leftJoin({asset: 'multi_asset'}, 'asset.id', 'mto.ident')
			.whereRaw(`tx.hash = decode('${txHash}', 'hex')`)
		)
		.then(rows => {
			const inputs: Utxo[] = [];
			const outputs: Utxo[] = [];
			rows.forEach((utxo: Utxo) => {
				if (utxo.hash != txHash) {
					inputs.push(utxo);
				} else {
					outputs.push(utxo);
				}
			});
			return { hash: txHash, inputs: Utils.groupUtxoAssets(inputs), outputs: Utils.groupUtxoAssets(outputs)};
		});
	}

	async getTransactionInputUtxos(txHash: string): Promise<Utxo[]> {
		return this.knex.select(
			'tx_out.address',
			'tx_out.hash',
			'tx_out.index',
			'tx_out.value',
			this.knex.raw('tx_out.address_has_script as smart_contract'),
			'mto.quantity',
			this.knex.raw(`encode(asset.policy, 'hex') as policy_id`),
			this.knex.raw(`encode(asset.name, 'hex') as asset_name`),
			'asset.fingerprint'
		)
		.from<Utxo>('tx_in')
		.innerJoin(this.knex.select(
			'tx_out.*', 
			this.knex.raw(`encode(tx.hash, 'hex') as hash`)
			)
			.from('tx_out')
			.innerJoin('tx', 'tx.id', 'tx_out.tx_id')
			.as('tx_out'), pg => pg.on('tx_out.tx_id', 'tx_in.tx_out_id').andOn('tx_out.index', 'tx_in.tx_out_index')
		)
		.innerJoin('tx', 'tx.id', 'tx_in.tx_in_id')
		.leftJoin({mto: 'ma_tx_out'}, 'mto.tx_out_id', 'tx_out.id')
		.leftJoin({asset: 'multi_asset'}, 'asset.id', 'mto.ident')
		.whereRaw(`tx.hash = decode('${txHash}', 'hex')`)
		.then(rows => Utils.groupUtxoAssets(rows));
	}

	async getTransactionMetadata(txHash: string, size = 50, order = 'desc', key = -1): Promise<Metadata[]> {
		const seekExpr = key < 0 ? '' : order == 'asc' ? `> ${key}` : `< ${key}`;
		return this.knex.select(
			'tx_metadata.key as label',
			'tx_metadata.json',
		)
		.from<Metadata>('tx_metadata')
		.innerJoin('tx', 'tx.id', 'tx_metadata.tx_id')
		.whereRaw(`tx.hash = decode('${txHash}', 'hex')${seekExpr ? ' and tx_metadata.key ' + seekExpr : ''}`)
		.orderBy('tx_metadata.key', order)
		.limit(size)
	}

	async getAddressTransactionsTotal(address: string): Promise<number> {
		return this.knex.select(
			this.knex.raw('SUM(t.total) as total')
		)
		.from({t: this.knex.select(
				this.knex.raw('count(DISTINCT tx_out.tx_id) as total')
			)
			.from('tx_out')
			.where('tx_out.address', '=', address)
			.unionAll(pg => pg.select(
					this.knex.raw('count(DISTINCT tx_in.tx_in_id) as total')
				)
				.from('tx_out')
				.innerJoin('tx_in', pg => pg.on('tx_in.tx_out_id', 'tx_out.tx_id').andOn('tx_in.tx_out_index', 'tx_out.index'))
				.where('tx_out.address', '=', address)
			) as any
		}).then((rows: any[]) => rows[0].total);
	}

	async getAddressBalance(address: string): Promise<number> {
		// select
		// 	SUM(value) as balance
		// from tx_out
		// left join tx_in on tx_out.tx_id = tx_in.tx_out_id and tx_out.index = tx_in.tx_out_index
		// where tx_in.tx_in_id is NULL
		// and tx_out.address = 'addr_test1wrsexavz37208qda7mwwu4k7hcpg26cz0ce86f5e9kul3hqzlh22t'
		// 
		// or 
		//
		// select
		// 	SUM(value) as balance
		// from tx_out
		// where tx_out.address = '${address}'
		// and not exists (
		// 	select 1 from tx_in
		// 	where tx_out.tx_id = tx_in.tx_out_id and tx_out.index = tx_in.tx_out_index
		// )

		return this.knex.select(
			this.knex.raw('SUM(value) as balance')
		)
		.from('tx_out')
		.whereNotExists(this.knex.select(
				this.knex.raw('1')
			)
			.from('tx_in')
			.whereRaw('tx_out.tx_id = tx_in.tx_out_id and tx_out.index = tx_in.tx_out_index')
		)
		.andWhere('tx_out.address', '=', address)
		.then((rows: any[]) => rows[0].balance);
	}

	async getAddressAssets(address: string, size = 50, order = 'desc', fingerprint = ''): Promise<Asset[]> {
		const seekExpr = fingerprint ? order == 'asc' ? `> '${fingerprint}'` : `< '${fingerprint}'`: '';
		return this.knex.select(
			this.knex.raw(`SUM(mto.quantity) as quantity`),
			this.knex.raw(`MAX(encode(asset.policy, 'hex')) as policy_id`),
			this.knex.raw(`MAX(encode(asset.name, 'hex')) as asset_name`),
			this.knex.raw(`asset.fingerprint`)
		)
		.from({mto: 'ma_tx_out'})
		.innerJoin(
			this.knex.select(
				'tx_out.id', 
				'tx_out.tx_id', 
				'tx_out.index', 
				'tx_out.value'
			)
			.from('tx_out')
			.leftJoin('tx_in', pg => pg.on('tx_out.tx_id', 'tx_in.tx_out_id').andOn('tx_out.index', 'tx_in.tx_out_index'))
			.whereRaw(`tx_in.tx_in_id is null and tx_out.address = '${address}'`)
			.as('t'), pg => pg.on('mto.tx_out_id', 't.id')
		)
		.innerJoin({asset: 'multi_asset'}, 'asset.id', 'mto.ident')
		.whereRaw(`asset.policy is not null${seekExpr ? ' and asset.fingerprint ' + seekExpr : ''}`)
		.groupBy('asset.fingerprint')
		.orderBy('asset.fingerprint', order)
		.limit(size)
		.then((rows: any[]) => rows.map(r => ({...r, asset_name: Utils.convert(r.asset_name)})))
		// return this.knex.raw(`

		// SELECT 
		// 	SUM("mto"."quantity") as quantity,
		// 	ENCODE(ASSET.POLICY,'hex') AS POLICY_ID,
		// 	convert_from(ASSET.NAME,'utf8') AS ASSET_NAME,
		// 	MAX("asset"."fingerprint") as fingerprint
		// FROM ma_tx_out as mto
		// INNER JOIN (
		// 	select tx_out.id, tx_out.tx_id, tx_out.index, tx_out.value from tx_out
		// 	lEFT JOIN tx_in on tx_out.tx_id = tx_in.tx_out_id and tx_out.index = tx_in.tx_out_index
		// 	WHERE 
		// 	tx_in.tx_in_id is null
		// 	and	"tx_out"."address" = '${address}'
		// ) t on mto.tx_out_id = t.id
		// INNER JOIN "multi_asset" AS "asset" ON "asset"."id" = "mto"."ident"
		// WHERE asset.policy is not null
		// group by asset.policy, asset.name
		// `);
	}

	async getAddressUtxos(address: string, size = 50, order = 'desc', txId = 0, index = 0): Promise<Utxo[]> {
		const seekExpr = txId <= 0 ? '' : order == 'asc' ? `> ${txId} or (tx_out.tx_id = ${txId} and tx_out.index > ${index})` : `< ${txId} or (tx_out.tx_id = ${txId} and tx_out.index < ${index})`;
		return this.knex.with('t',
			this.knex.select(
				this.knex.raw('DISTINCT(tx_out.tx_id) as tx_id'), 
				'tx_out.id', 
				'tx_out.index', 
				'tx_out.value', 
				this.knex.raw('tx_out.address_has_script as smart_contract'), 
				'tx_out.address'
			)
			.from('tx_out')
			.leftJoin('tx_in', pg => pg.on('tx_out.tx_id', 'tx_in.tx_out_id').andOn('tx_out.index', 'tx_in.tx_out_index'))
			.whereRaw(`tx_in.tx_in_id is NULL and tx_out.address = '${address}'${seekExpr ? ' and tx_out.tx_id ' + seekExpr : ''}`)
			.orderByRaw(`tx_out.tx_id ${order}, tx_out.index ${order}`)
			.limit(size)
		)
		.select(
			't.tx_id',
			't.address',
			this.knex.raw(`encode(tx.hash, 'hex') as hash`),
			't.index',
			't.value',
			't.smart_contract',
			'mto.quantity',
			this.knex.raw(`encode(asset.policy, 'hex') as policy_id`),
			this.knex.raw(`encode(asset.name, 'hex') as asset_name`),
			'asset.fingerprint'
		)
		.from<Utxo>('tx')
		.innerJoin('t', 'tx.id', 't.tx_id')
		.leftJoin({mto: 'ma_tx_out'}, 'mto.tx_out_id', 't.id')
		.leftJoin({asset: 'multi_asset'}, 'asset.id', 'mto.ident')
		.then(rows => Utils.groupUtxoAssets(rows));
	}

	async getAddressTransactions(address: string, size = 50, order = 'desc', txId = 0): Promise<Transaction[]> {
		const seekExpr = txId <= 0 ? '' : order == 'asc' ? `> ${txId}` : `< ${txId}`;
		return this.knex.with('t', pg => pg.union(
			pg => pg.select('tx_out.tx_id')
				.from('tx_out')
				.whereRaw(`tx_out.address = '${address}'${seekExpr ? ' and tx_out.tx_id ' + seekExpr : ''}`)
				.groupBy('tx_out.tx_id')
				.orderBy('tx_out.tx_id', order)
				.limit(size), true
			)
			.union(pg => pg.select(this.knex.raw('tx_in.tx_in_id as tx_id'))
				.from('tx_out')
				.innerJoin('tx_in', pg => pg.on('tx_in.tx_out_id', 'tx_out.tx_id').andOn('tx_in.tx_out_index', 'tx_out.index'))
				.whereRaw(`tx_out.address = '${address}'${seekExpr ? ' and tx_in.tx_in_id ' + seekExpr : ''}`)
				.groupBy('tx_in.tx_in_id')
				.orderBy('tx_in.tx_in_id', order)
				.limit(size)
			, true)
			.orderBy('tx_id', order)
			.limit(size)
		).select(
			'tx.id',
			'txs.input',
			'txs.i0', 
			this.knex.raw(`encode(tx.hash, 'hex') as hash`), 
			'txs.o0', 
			'txs.output', 
			'block.block_no',
			'block.epoch_no',
			'block.epoch_slot_no', 
			'block.time', 
			'tx.fee', 
			'tx.out_sum'
		)
		.from('tx')
		.innerJoin('block', 'block.id', 'tx.block_id')
		.innerJoin(
			this.knex.select(
				this.knex.raw('i.address as input'), 
				this.knex.raw('i.rn as i0'), 
				this.knex.raw('case when i.tx_id is null then o.tx_id else i.tx_id end'), 
				this.knex.raw('o.rn as o0'), 
				this.knex.raw('o.address as output')
			)
			.from({o: this.knex.select(
					this.knex.raw(`row_number() OVER (partition by t.tx_id order by t.tx_id ${order}) as rn`), 
					't.tx_id', 
					'tx_out.address'
				)
				.from('t')
				.innerJoin('tx_out', 'tx_out.tx_id', 't.tx_id') as any}
			)
			.fullOuterJoin(
				this.knex.select(
					this.knex.raw(`row_number() OVER (partition by t.tx_id order by t.tx_id ${order}) as rn`), 
					't.tx_id', 
					'tx_out.address'
				)
				.from('t')
				.innerJoin('tx_in', 'tx_in.tx_in_id', 't.tx_id')
				.innerJoin('tx_out', pg => pg.on('tx_out.tx_id', 'tx_in.tx_out_id').andOn('tx_out.index', 'tx_in.tx_out_index'))
				.as('i'), pg => pg.on('o.tx_id', 'i.tx_id').andOn('o.rn', 'i.rn')
			)
			.as('txs'), pg => pg.on('txs.tx_id', 'tx.id')
		)
		.orderByRaw(`tx.id ${order}, txs.i0, txs.o0`)
		.then(rows => {
			const dict = rows.reduce((dict: any, r: any) => {
				dict[r.hash] = (dict[r.hash] || {id: r.id, hash: r.hash, block: {block_no: r.block_no, epoch_no: r.epoch_no, epoch_slot_no: r.epoch_slot_no, time: r.time}, fee: r.fee, out_sum: r.out_sum, inputs: [], outputs: []});
				if (r['i0']) {
					!dict[r.hash].inputs.push(r.input)
				}
				if (r['o0']) {
					!dict[r.hash].outputs.push(r.output)
				}
				return dict;
			}, {});
			return Object.values(dict);
		});
	}

	async getStakeUtxos(stakeAddress: string): Promise<Utxo[]> {
		return this.knex.select(
			'tx.id',
			'address',
			this.knex.raw(`encode(tx.hash, 'hex') as hash`),
			'utxo_view.index',
			'utxo_view.value',
			this.knex.raw('utxo_view.address_has_script as smart_contract'),
			'mto.quantity',
			this.knex.raw(`encode(asset.policy, 'hex') as policy_id`),
			this.knex.raw(`encode(asset.name, 'hex') as asset_name`),
			'asset.fingerprint'
		)
		.from<Utxo>('utxo_view')
		.innerJoin('stake_address', 'stake_address.id', 'utxo_view.stake_address_id')
		.innerJoin('tx', 'tx.id', 'utxo_view.tx_id')
		.leftJoin({mto: 'ma_tx_out'}, 'mto.tx_out_id', 'utxo_view.id')
		.leftJoin({asset: 'multi_asset'}, 'asset.id', 'mto.ident')
		.where('stake_address.view', '=', stakeAddress)
		.then(rows => rows.map(r => ({ ...r, asset_name: Utils.convert(r.asset_name)})));
	}

	async getStake(stakeAddress: string): Promise<Stake> {
		return this.knex.select(
			this.knex.raw('stake_active(sd.id, delegation.tx_id) as active'),
			'block.epoch_no as active_epoch',
			this.knex.raw('COALESCE(utxo_view.controlled_total_stake, 0) + COALESCE(reward.rewards_sum, 0) - COALESCE(wd.withdrawals_sum, 0)  as controlled_total_stake'),
			this.knex.raw('COALESCE(reward.rewards_sum, 0) as rewards_sum'),
			this.knex.raw('COALESCE(wd.withdrawals_sum, 0) as withdrawals_sum'),
			this.knex.raw('COALESCE(reserve.reserves_sum, 0) as reserves_sum'),
			this.knex.raw('COALESCE(treasury.treasury_sum, 0) as treasury_sum'),
			this.knex.raw('COALESCE(reward.rewards_sum, 0) - COALESCE(wd.withdrawals_sum, 0) as withdraw_available'),
			this.knex.raw(`(select "pool_hash"."view" from stake_address as sa inner join delegation del on del.addr_id = sa.id inner join pool_hash on pool_hash.id = del.pool_hash_id where "sa"."view" = '${stakeAddress}' order by del.tx_id desc limit 1) as pool_id`),
		)
		.from<Stake>({sa: 'stake_address'})
		.leftJoin(this.knex.select(
				'utxo_view.stake_address_id', 
				this.knex.raw(`SUM(utxo_view.value) as controlled_total_stake`)
			)
			.from('utxo_view')
			.innerJoin({sa: 'stake_address'}, 'sa.id', 'utxo_view.stake_address_id')
			.where('sa.view', '=', stakeAddress)
			.groupBy('utxo_view.stake_address_id')
			.as('utxo_view'), pg => pg.on('utxo_view.stake_address_id', 'sa.id')
		)
		.leftJoin(this.knex.select(
				'reward.addr_id', 
				this.knex.raw(`SUM(reward.amount) as rewards_sum`)
			)
			.from('reward')
			.innerJoin({sa: 'stake_address'}, 'sa.id', 'reward.addr_id')
			.where('sa.view', '=', stakeAddress)
			.groupBy('reward.addr_id')
			.as('reward'), pg => pg.on('reward.addr_id', 'sa.id')
		)
		.leftJoin(this.knex.select(
				'w.addr_id', 
				this.knex.raw(`SUM(w.amount) as withdrawals_sum`)
			)
			.from(this.knex.select(
					this.knex.raw('distinct on (withdrawal.tx_id) withdrawal.addr_id'),
					'withdrawal.amount'
				)
				.from('withdrawal')
				.innerJoin({sa: 'stake_address'}, 'sa.id', 'withdrawal.addr_id')
				.where('sa.view', '=', stakeAddress)
				.as('w')
			)
			.groupBy('w.addr_id')
			.as('wd'), pg => pg.on('wd.addr_id', 'sa.id')
		)
		.leftJoin(this.knex.select(
				'reserve.addr_id', 
				this.knex.raw(`SUM(reserve.amount) as reserves_sum`)
			)
			.from(this.knex.select(
					this.knex.raw('distinct on (reserve.tx_id) reserve.addr_id'),
					'reserve.amount'
				)
				.from('reserve')
				.innerJoin({sa: 'stake_address'}, 'sa.id', 'reserve.addr_id')
				.where('sa.view', '=', stakeAddress)
				.as('reserve')
			)
			.groupBy('reserve.addr_id')
			.as('reserve'), pg => pg.on('reserve.addr_id', 'sa.id')
		)
		.leftJoin(this.knex.select(
				'treasury.addr_id', 
				this.knex.raw(`SUM(treasury.amount) as treasury_sum`)
			)
			.from(this.knex.select(
					this.knex.raw('distinct on (treasury.tx_id) treasury.addr_id'),
					'treasury.amount'
				)
				.from('treasury')
				.innerJoin({sa: 'stake_address'}, 'sa.id', 'treasury.addr_id')
				.where('sa.view', '=', stakeAddress)
				.as('treasury')
			)
			.groupBy('treasury.addr_id')
			.as('treasury'), pg => pg.on('treasury.addr_id', 'sa.id')
		)
		.leftJoin('delegation', 'delegation.addr_id', 'sa.id')
		.leftJoin('tx', 'tx.id', 'delegation.tx_id')
		.leftJoin('block', 'block.id', 'tx.block_id')
		.leftJoin({sd: 'stake_deregistration'}, 'sd.addr_id', 'sa.id')
		.where('sa.view', '=', stakeAddress)
		.limit(1)
		.then(rows => rows[0]);
	}

	async getStakeAddress(addrId: number): Promise<StakeAddress> {
		return this.knex.select(
			'id', 
			this.knex.raw(`encode(hash_raw, 'hex') as hash`), 
			'view as address', 
			this.knex.raw(`encode(script_hash, 'hex') as script_hash`), 
			'registered_tx_id'
		)
		.from('stake_address')
		.where('stake_address.id', '=', addrId)
		.then((rows: any[]) => rows[0]);
	}

	async getStakeAddresses(stakeAddress: string, size = 50, order = 'desc', address = ''): Promise<Address[]> {
		const seekExpr = address ? order == 'asc' ? `> '${address}'` : `< '${address}'`: '';
		return this.knex.select(
			this.knex.raw('DISTINCT (tx_out.address) as address'),
		)
		.from<Address>('tx_out')
		.innerJoin({sa: 'stake_address'}, 'tx_out.stake_address_id', 'sa.id')
		.whereRaw(`sa.view = '${stakeAddress}'${seekExpr ? ' and tx_out.address ' + seekExpr : ''}`)
		.orderBy('tx_out.address', order)
		.limit(size)
		.then((rows: any[]) => rows);
	}
	
	async getPool(poolId: string | number): Promise<Pool> {
		let query = this.knex.select(
			'pool_hash.view as pool_id',
			this.knex.raw(`encode(pool_hash.hash_raw, 'hex') as id`),
			'pu.pledge',
			'pu.margin',
			'pu.fixed_cost',
			'pu.active_epoch_no',
			this.knex.raw('first_value (pmr.url) over(order by case when pmr.url is null then 0 else pu.registered_tx_id end desc) as url'),
			this.knex.raw(`first_value (encode(pmr.hash,'hex')) over(order by case when pmr.hash is null then 0 else pu.registered_tx_id end desc) as hash`),
			this.knex.raw('first_value (pod.json) over(order by case when pod.json is null then 0 else "pu"."registered_tx_id" end desc) as data'),
		)
		.from<Pool>({pu: 'pool_update'})
		.innerJoin('pool_hash', 'pool_hash.id', 'pu.hash_id')
		.leftJoin('epoch', 'epoch.no', 'pu.active_epoch_no')
		.leftJoin({pmr: 'pool_metadata_ref'}, 'pmr.id', 'pu.meta_id')
		.leftJoin({pod: 'pool_offline_data'}, 'pod.pmr_id', 'pmr.id');
		if (!Number.isNaN(Number(poolId))) {
			query = query 
			.where('pool_hash.id', '=', poolId);
		} else {
			query = query 
			.where('pool_hash.view', '=', poolId);
		}
		return query
		.orderByRaw('case when epoch.no is null then 0 else pu.registered_tx_id end desc, pu.active_epoch_no desc')
		.limit(1)
		.then(rows => {
			if (rows.length == 0) return null;
			const { data, ...cols } = rows[0];
			return { ...cols, ...data};
		});
	}

	async getPoolBySlotLeader(slot_leader_id: number): Promise<Pool> {
		const query = this.knex.select(
			'pool_hash.view as pool_id',
			this.knex.raw(`encode(pool_hash.hash_raw, 'hex') as raw_id`),
			'pmd.url',
			this.knex.raw(`encode(pmd.hash, 'hex') as hash`),
			this.knex.raw('pod.json as data'),
		)
		.from<Pool>('pool_hash')
		.innerJoin({sl: 'slot_leader'}, 'sl.pool_hash_id', 'pool_hash.id')
		.leftJoin({pmd: 'pool_metadata_ref'}, 'pmd.pool_id', 'pool_hash.id')
		.leftJoin({pod: 'pool_offline_data'}, 'pod.pool_id', 'pool_hash.id')
		.where('sl.id', '=', slot_leader_id);
		return query.then(rows => {
			if (rows.length == 0) return null;
			const { data, ...cols } = rows[0];
			return { ...cols, ...data};
		});
	}
	
	async getDelegations(poolId: string, size = 50, order = 'desc', txId = 0): Promise<PoolDelegation[]> {
		const seekExpr = txId <= 0 ? '' : order == 'asc' ? `> ${txId}` : `< ${txId}`;
		return this.knex.with('delegations', 
			this.knex.select(
				'd.addr_id',
				'd.tx_id',
				'd.pool_hash_id',
				'd.active_epoch_no',
			)
			.from({p: 'pool_hash'})
			.innerJoin(this.knex.select(
					this.knex.raw('distinct on (d.addr_id) d.addr_id'),
					'd.tx_id',
					'd.pool_hash_id',
					'd.active_epoch_no'
				)
				.from({d: 'delegation'})
				.leftJoin(this.knex.select(
						this.knex.raw('distinct on (sd.addr_id) sd.tx_id'),
						'sd.addr_id'
					)
					.from({sd: 'stake_deregistration'})
					.orderByRaw('sd.addr_id, sd.tx_id desc')
					.as('sd'), pg => pg.on('sd.addr_id', 'd.addr_id')
				)
				.innerJoin({p: 'pool_hash'}, 'p.id', 'd.pool_hash_id')
				.whereRaw('sd.addr_id is NULL or sd.tx_id < d.tx_id')
				.orderByRaw('d.addr_id, d.tx_id desc')
				.as('d'), pg => pg.on('d.pool_hash_id', 'p.id')
			)
			.whereRaw(`p.view = '${poolId}'${seekExpr ? ' and d.tx_id ' + seekExpr : ''}`)
			.orderBy('d.tx_id', order)
			.limit(size)
		)
		.select(
			'r.tx_id',
			this.knex.raw('s.view as stake_address'),
			this.knex.raw('r.rewards - w.withdrawals as available_rewards'),
			this.knex.raw('s.stake + (r.rewards - w.withdrawals) as stake')
		)
		.from(this.knex.select(
				this.knex.raw('d.tx_id'),
				this.knex.raw('COALESCE(SUM (r.amount), 0) as rewards'),
			)
			.from({d: 'delegations'})
			.leftJoin({r: 'reward'}, pg => pg.on('r.addr_id', 'd.addr_id'))
			.groupByRaw('d.tx_id')
			.as('r')
		)
		.innerJoin(this.knex.select(
				this.knex.raw('d.tx_id'),
				this.knex.raw('COALESCE(SUM (w.amount), 0) as withdrawals')
			)
			.from({d: 'delegations'})
			.leftJoin(this.knex.select(
					this.knex.raw('distinct on (w.tx_id) w.addr_id'),
					'w.amount',
				)
				.from({w: 'withdrawal'})
				.as('w'), pg => pg.on('w.addr_id', 'd.addr_id')
			)
			.groupByRaw('d.tx_id')
			.as('w'), pg => pg.on('w.tx_id', 'r.tx_id')
		)
		.innerJoin(this.knex.select(
				this.knex.raw('d.tx_id'),
				this.knex.raw('MAX(sa.view) as view'),
				this.knex.raw('COALESCE(SUM(uv.value), 0) as stake')
			)
			.from({d: 'delegations'})
			.innerJoin({sa: 'stake_address'}, 'sa.id', 'd.addr_id')
			.leftJoin({uv: 'utxo_view'}, 'uv.stake_address_id', 'd.addr_id')
			.groupBy('d.tx_id')
			.as('s'), pg => pg.on('s.tx_id', 'r.tx_id')
		)
		.orderBy('r.tx_id', order)
		.then((rows: any[]) => rows);
	}

	async getAsset(identifier: string): Promise<Asset> {
		return this.knex.select(
			this.knex.raw(`encode(asset.policy, 'hex') as policy_id`),
			this.knex.raw(`encode(asset.name, 'hex') as asset_name`),
			'asset.fingerprint',
			this.knex.raw(`SUM(ma_tx_mint.quantity) as quantity`),
			this.knex.raw(`count(*) as mint_or_burn_count`),
			this.knex.raw(`(select encode(tx.hash, 'hex') from tx inner join ma_tx_mint on tx.id = ma_tx_mint.tx_id inner join multi_asset as asset on asset.id = ma_tx_mint.ident where asset.policy = decode('${identifier.substring(0, 56)}', 'hex') AND asset.name = decode('${identifier.substring(56)}', 'hex') order by tx.id asc limit 1) as initial_mint_tx_hash`),
			this.knex.raw(`(select tx_metadata.json || jsonb_build_object('key', tx_metadata.key) from tx_metadata inner join ma_tx_mint on tx_metadata.tx_id = ma_tx_mint.tx_id inner join multi_asset as asset on asset.id = ma_tx_mint.ident where asset.policy = decode('${identifier.substring(0, 56)}', 'hex') AND asset.name = decode('${identifier.substring(56)}', 'hex') limit 1) as on_chain_metadata`)
		)
		.from<Asset>('ma_tx_mint')
		.innerJoin({asset: 'multi_asset'}, 'asset.id', 'ma_tx_mint.ident')
		.whereRaw(`asset.policy = decode('${identifier.substring(0, 56)}', 'hex') AND asset.name = decode('${identifier.substring(56)}', 'hex')`)
		.groupBy('asset.policy', 'asset.name', 'asset.fingerprint')
		.then((rows: any[]) => {
			if (rows.length > 0) {
				const {on_chain_metadata, ...asset}: Asset = rows[0];
				// let assetFingerprint  = new AssetFingerprint(
				// 	Buffer.from(asset.policy_id, 'hex'),
				// 	Buffer.from(asset.asset_name, 'hex')
				// );
				// asset.fingerprint = assetFingerprint.fingerprint();
				if (on_chain_metadata) {
					const { key, ...json } = on_chain_metadata;
					asset.metadata = {label: key, json};
				} else {
					asset.metadata = null;
				}
				return asset;
			} else {
				return null;
			}
		})
	}

	async getAssetAddresses(identifier: string, size: number, order: string, address = ''): Promise<Address[]> {
		const seekExpr = address ? order == 'asc' ? `> '${address}'` : `< '${address}'`: '';
		return this.knex.select(
			'tx_out.address',
			this.knex.raw(`SUM(mto.quantity) as quantity`),
		)
		.from({mto: 'ma_tx_out'})
		.innerJoin({ma: 'multi_asset'}, 'ma.id', 'mto.ident')
		.innerJoin('tx_out', 'tx_out.id', 'mto.tx_out_id')
		.leftJoin('tx_in', pg => pg.on('tx_in.tx_out_id', 'tx_out.tx_id').andOn('tx_out.index', 'tx_in.tx_out_index'))
		.whereRaw(`ma.policy = decode('${identifier.substring(0, 56)}', 'hex') AND ma.name = decode('${identifier.substring(56)}', 'hex')`)
		.andWhereRaw(`tx_in.tx_in_id is null${seekExpr ? ' and tx_out.address ' + seekExpr : ''}`)
		.groupBy('tx_out.address')
		.orderBy('tx_out.address', order)
		.limit(size);
	}

	async getLatestEpoch(): Promise<Epoch> {
		return this.knex.select(
			'epoch.id',
			'epoch.out_sum',
			'epoch.fees',
			'epoch.tx_count',
			'epoch.blk_count',
			'epoch.no',
			'epoch.start_time',
			'epoch.end_time'
		)
		.from('epoch')
		.orderBy('epoch.no', 'desc')
		.limit(1)
		.then((rows: any[]) => rows[0])
	}

	async getEpochParamters(epoch: number): Promise<EpochParameters> {
		return this.knex.select(
			'epoch_no',
			'min_fee_a',
			'min_fee_b',
			'max_block_size',
			'max_tx_size',
			'max_bh_size as max_block_header_size',
			'key_deposit',
			'pool_deposit',
			'max_epoch',
			'optimal_pool_count',
			'influence as influence_a0',
			'monetary_expand_rate as monetary_expand_rate_rho',
			'treasury_growth_rate as treasury_growth_rate_tau',
			'decentralisation',
			this.knex.raw(`encode(entropy, 'hex') as entropy`),
			'protocol_major',
			'protocol_minor',
			'min_utxo_value as min_utxo',
			'min_pool_cost',
			this.knex.raw(`encode(nonce, 'hex') as nonce`),
			'block_id',
		)
		.from<EpochParameters>('epoch_param')
		.where('epoch_param.epoch_no', '=', epoch)
		.first();
	}

	// TODO: create the trigger function and trigger on DB based on `args`
	registerEvent(event: string, args: any, callback: (msg: any) => void): void {
		throw new Error('Method not implemented.');
	}

	listenEvent(event: string, callback: (msg: any) => void): void {
		this.knex.client.acquireRawConnection()
		.then((connection: any) => {
			connection.query(`LISTEN ${event}`);
			connection.on('notification', async (msg: {channel: string, payload: string}) => {
				const payloadJson = JSON.parse(msg.payload);
				callback({ ...msg, payload: payloadJson});
			});
		});
	}

}