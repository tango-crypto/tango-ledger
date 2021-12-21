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
import AssetFingerprint from '@emurgo/cip14-js';
import { EpochParameters } from '../models/epoch-paramenters';
import { PoolDelegation } from '../models/pool-delegation';

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

	// TODO: Check this query performance
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
			'slot_leader.description as slot_leader',
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
		.leftJoin({prev_block: 'block'}, 'prev_block.id', 'block.previous_id')
		.leftJoin({next_block: 'block'}, 'next_block.previous_id', 'block.id');
		// .innerJoin('tx', 'tx.block_id', 'block.id');
		let numberOrHash = Number(id); 
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

	async getBlockTransactions(id: number): Promise<Transaction[]> {
		return this.knex.select(
			'tx.id',
			'tx.hash',
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
		.where('tx.block_id', '=', id);
	}

	async getTransaction(txHash: string): Promise<Transaction> {
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
			'asset.quantity as asset_quantity',
			'asset.policy_id as asset_policy_id ',
			'asset.name as asset_name',
		)
		.from<Transaction>('tx')
		.innerJoin('block', 'block.id', 'tx.block_id')
		.innerJoin(
			this.knex.select(
					'tx.id as tx_id', 
					this.knex.raw(`SUM(asset.quantity) as quantity`),
					this.knex.raw(`encode(asset.policy, 'hex') as policy_id`),
					this.knex.raw(`convert_from(asset.name, 'UTF-8') as name`),
				)
				.from({utxo: 'tx_out'})
				.innerJoin('tx', 'tx.id', 'utxo.tx_id')
				.leftJoin({asset: 'ma_tx_out'}, 'asset.tx_out_id', 'utxo.id')
				.whereRaw(`tx.hash = decode('${txHash}', 'hex')`)
				.groupBy('tx.id', 'asset.policy', 'asset.name')
				.as('asset'), pg => pg.on('asset.tx_id', 'tx.id')
		)
		.then(rows => {
			let assets: Asset[] = rows.map(r => ({quantity: r.asset_quantity, policy_id: r.asset_policy_id, asset_name: r.asset_name}))
																.filter(a => a.policy_id);
			let tx: Transaction = rows.length > 0 ? {
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

	async getTransactionUtxos(txHash: string): Promise<{hash: string, outputs: Utxo[], inputs: Utxo[]}> {
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
		.whereRaw(`tx.hash = decode('${txHash}', 'hex')`)
		.union(pg => pg.select(
				'tx_out.address',
				'tx_out.hash',
				'tx_out.index',
				'tx_out.value',
				'asset.quantity',
				this.knex.raw(`encode(asset.policy, 'hex') as policy_id`),
				this.knex.raw(`convert_from(asset.name, 'UTF-8') as asset_name`)
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
			.leftJoin({asset: 'ma_tx_out'}, 'asset.tx_out_id', 'tx_out.id')
			.whereRaw(`tx.hash = decode('${txHash}', 'hex')`)
		)
		.then(rows => {
			let inputs: Utxo[] = [];
			let outputs: Utxo[] = [];
			rows.forEach(utxo => {
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
			'asset.quantity',
			this.knex.raw(`encode(asset.policy, 'hex') as policy_id`),
			this.knex.raw(`convert_from(asset.name, 'UTF-8') as asset_name`)
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
		.leftJoin({asset: 'ma_tx_out'}, 'asset.tx_out_id', 'tx_out.id')
		.whereRaw(`tx.hash = decode('${txHash}', 'hex')`)
		.then(rows => Utils.groupUtxoAssets(rows));
	}

	async getTransactionMetadata(txHash: string): Promise<Metadata[]> {
		return this.knex.select(
			'tx_metadata.key as label',
			'tx_metadata.json',
		)
		.from<Metadata>('tx_metadata')
		.innerJoin('tx', 'tx.id', 'tx_metadata.tx_id')
		.whereRaw(`tx.hash = decode('${txHash}', 'hex')`)
	}

	async getAddressUtxos(address: string): Promise<Utxo[]> {
		return this.knex.select(
			'address',
			this.knex.raw(`encode(tx.hash, 'hex') as hash`),
			'utxo_view.index',
			'utxo_view.value',
			'asset.quantity',
			this.knex.raw(`encode(asset.policy, 'hex') as policy_id`),
			this.knex.raw(`convert_from(asset.name, 'UTF-8') as asset_name`)
		)
		.from<Utxo>('utxo_view')
		.innerJoin('stake_address', 'stake_address.id', 'utxo_view.stake_address_id')
		.innerJoin('tx', 'tx.id', 'utxo_view.tx_id')
		.leftJoin({asset: 'ma_tx_out'}, 'asset.tx_out_id', 'utxo_view.id')
		.where('utxo_view.address', '=', address)
		.then(rows => Utils.groupUtxoAssets(rows));
	}

	async getAddressTransactions(address: string, order: string = 'asc'): Promise<Transaction[]> {
		return this.knex.select(
			'tx.block_index',
			this.knex.raw(`encode(tx.hash, 'hex') as hash`),
			'block.block_no',
		)
		.from<Transaction>('tx')
		.innerJoin('block', 'block.id', 'tx.block_id')
		.innerJoin('tx_out', 'tx_out.tx_id', 'tx.id')
		.where('tx_out.address', '=', address)
		.union(pg => pg.select(
			'tx.block_index',
			this.knex.raw(`encode(tx.hash, 'hex') as hash`),
			'block.block_no',
		)
		.from<Transaction>('tx')
		.innerJoin('tx_in', 'tx_in.tx_in_id', 'tx.id')
		.innerJoin('tx_out', 'tx_out.tx_id', 'tx_in.tx_out_id')
		.innerJoin('block', 'block.id', 'tx.block_id')
		.whereRaw('tx_in.tx_out_index = tx_out.index')
		.andWhere('tx_out.address', '=', address))
		.orderBy('block_no', order)
		.then((rows: any) => rows);
	}

	async getStakeUtxos(stakeAddress: string): Promise<Utxo[]> {
		return this.knex.select(
			'address',
			this.knex.raw(`encode(tx.hash, 'hex') as hash`),
			'utxo_view.index',
			'utxo_view.value',
			'asset.quantity',
			this.knex.raw(`encode(asset.policy, 'hex') as policy_id`),
			this.knex.raw(`convert_from(asset.name, 'UTF-8') as asset_name`)
		)
		.from<Utxo>('utxo_view')
		.innerJoin('stake_address', 'stake_address.id', 'utxo_view.stake_address_id')
		.innerJoin('tx', 'tx.id', 'utxo_view.tx_id')
		.leftJoin({asset: 'ma_tx_out'}, 'asset.tx_out_id', 'utxo_view.id')
		.where('stake_address.view', '=', stakeAddress);
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
			this.knex.raw(`(select "pool_hash"."view" from stake_address as sa inner join delegation del on del.addr_id = sa.id inner join pool_hash on pool_hash.id = del.pool_hash_id where "sa"."view" = '${stakeAddress}' order by del.active_epoch_no desc limit 1) as pool_id`),
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
				'withdrawal.addr_id', 
				this.knex.raw(`SUM(withdrawal.amount) as withdrawals_sum`)
			)
			.from('withdrawal')
			.innerJoin({sa: 'stake_address'}, 'sa.id', 'withdrawal.addr_id')
			.where('sa.view', '=', stakeAddress)
			.groupBy('withdrawal.addr_id')
			.as('wd'), pg => pg.on('wd.addr_id', 'sa.id')
		)
		.leftJoin(this.knex.select(
				'reserve.addr_id', 
				this.knex.raw(`SUM(reserve.amount) as reserves_sum`)
			)
			.from('reserve')
			.innerJoin({sa: 'stake_address'}, 'sa.id', 'reserve.addr_id')
			.where('sa.view', '=', stakeAddress)
			.groupBy('reserve.addr_id')
			.as('reserve'), pg => pg.on('reserve.addr_id', 'sa.id')
		)
		.leftJoin(this.knex.select(
				'treasury.addr_id', 
				this.knex.raw(`SUM(treasury.amount) as treasury_sum`)
			)
			.from('treasury')
			.innerJoin({sa: 'stake_address'}, 'sa.id', 'treasury.addr_id')
			.where('sa.view', '=', stakeAddress)
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

	async getStakeAddresses(stakeAddress: string): Promise<Address[]> {
		return this.knex.select(
			'tx_out.address',
		)
		.from<Address>('tx_out')
		.innerJoin({sa: 'stake_address'}, 'tx_out.stake_address_id', 'sa.id')
		.where('sa.view', '=', stakeAddress)
		.groupBy('tx_out.address');
	}
	
	async getPool(poolId: string): Promise<Pool> {
		return this.knex.select(
			'pool_hash.view as pool_id',
			this.knex.raw(`encode(pool_hash.hash_raw, 'hex') as raw_id`),
			'pmd.url',
			this.knex.raw(`encode(pmd.hash, 'hex') as hash`),
		)
		.from<Pool>('pool_hash')
		.leftJoin({pmd: 'pool_metadata_ref'}, 'pmd.pool_id', 'pool_hash.id')
		.where('pool_hash.view', '=', poolId)
		.then(rows => rows[0]);
	}
	
	async getDelegations(poolId: string): Promise<PoolDelegation[]> {
		return this.knex.with('delegations', 
			this.knex.select(
				'd.addr_id',
				'd.tx_id',
				'd.pool_hash_id',
				'd.active_epoch_no',
			)
			.from({p: 'pool_hash'})
			.innerJoin(this.knex.select(
					this.knex.raw('distinct on (d.addr_id) d.*')
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
			.where('p.view', '=', poolId)
		)
		.select(
			this.knex.raw('s.view as stake_address'),
			this.knex.raw('r.rewards - w.withdrawals as available_rewards'),
			's.stake'
		)
		.from(this.knex.select(
				this.knex.raw('MAX(d.addr_id) as id'),
				this.knex.raw('COALESCE(SUM (r.amount), 0) as rewards'),
			)
			.from({d: 'delegations'})
			.leftJoin({r: 'reward'}, pg => pg.on('r.pool_id', 'd.pool_hash_id').andOn(this.knex.raw('r.addr_id = d.addr_id and r.earned_epoch >= d.active_epoch_no + 1 and r.pool_id is not null')))
			.groupByRaw('d.addr_id')
			.as('r')
		)
		.innerJoin(this.knex.select(
				this.knex.raw('MAX(d.addr_id) as id'),
				this.knex.raw('COALESCE(SUM (w.amount), 0) as withdrawals')
			)
			.from({d: 'delegations'})
			.leftJoin(this.knex.select(
					'w.addr_id',
					'w.amount',
					'block.epoch_no'
				)
				.from({w: 'withdrawal'})
				.innerJoin('tx', 'tx.id', 'w.tx_id')
				.innerJoin('block', 'block.id', 'tx.block_id')
				.as('w'), pg => pg.on('w.addr_id', 'd.addr_id').andOn(this.knex.raw('w.epoch_no >= d.active_epoch_no + 4'))
			)
			.groupByRaw('d.addr_id')
			.as('w'), pg => pg.on('w.id', 'r.id')
		)
		.innerJoin(this.knex.select(
				this.knex.raw('MAX(d.addr_id) as id'),
				this.knex.raw('MAX(sa.view) as view'),
				this.knex.raw('COALESCE(SUM(uv.value), 0) as stake')
			)
			.from({d: 'delegations'})
			.innerJoin({sa: 'stake_address'}, 'sa.id', 'd.addr_id')
			.leftJoin({uv: 'utxo_view'}, 'uv.stake_address_id', 'd.addr_id')
			.groupBy('d.addr_id')
			.as('s'), pg => pg.on('s.id', 'r.id')
		);
	}

	async getAsset(identifier: string): Promise<Asset> {
		return this.knex.select(
			this.knex.raw(`encode(ma_tx_mint.policy, 'hex') as policy_id`),
			this.knex.raw(`encode(ma_tx_mint.name, 'hex') as asset_name`),
			this.knex.raw(`SUM(ma_tx_mint.quantity) as quantity`),
			this.knex.raw(`count(*) as mint_or_burn_count`),
			this.knex.raw(`(select encode(tx.hash, 'hex') from tx inner join ma_tx_mint on tx.id = ma_tx_mint.tx_id where ma_tx_mint.policy = decode('${identifier.substring(0, 56)}', 'hex') AND ma_tx_mint.name = decode('${identifier.substring(56)}', 'hex') order by tx.id asc limit 1) as initial_mint_tx_hash`),
			this.knex.raw(`(select tx_metadata.json || jsonb_build_object('key', tx_metadata.key) from tx_metadata inner join ma_tx_mint on tx_metadata.tx_id = ma_tx_mint.tx_id where ma_tx_mint.policy = decode('${identifier.substring(0, 56)}', 'hex') AND ma_tx_mint.name = decode('${identifier.substring(56)}', 'hex') limit 1) as on_chain_metadata`),
		)
		.from<Asset>('ma_tx_mint')
		.whereRaw(`ma_tx_mint.policy = decode('${identifier.substring(0, 56)}', 'hex') AND ma_tx_mint.name = decode('${identifier.substring(56)}', 'hex')`)
		.groupBy('ma_tx_mint.policy', 'ma_tx_mint.name')
		.then((rows: any[]) => {
			if (rows.length > 0) {
				let {on_chain_metadata, ...asset}: Asset = rows[0];
				let assetFingerprint  = new AssetFingerprint(
					Buffer.from(asset.policy_id, 'hex'),
					Buffer.from(asset.asset_name, 'hex')
				);
				asset.fingerprint = assetFingerprint.fingerprint();
				if (on_chain_metadata) {
					let { key, ...json } = on_chain_metadata;
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
				let payloadJson = JSON.parse(msg.payload);
				callback({ ...msg, payload: payloadJson});
			});
		});
	}

}