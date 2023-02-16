import { Transaction } from "../models/transaction";
import { Block } from "../models/block";
import { Utxo } from "../models/utxo";
import { Stake } from "../models/stake";
import { Pool } from "../models/pool";
import { Address } from "../models/address";
import { Metadata } from "../models/metadata";
import { EpochParameters } from "../models/epoch-paramenters";
import { PoolDelegation } from "../models/pool-delegation";
import { Asset } from "../models/asset";
import { Epoch } from "../models/epoch";
import { StakeAddress } from "../models/stake-address";
import { AssetOwner } from "../models/asset-owner";
import { Script } from "../models/script";
import { Redeemer } from "../models/redeemer";
import { Datum } from "../models/datum";

export interface DbClient {
	reconnect(): void;
	disconnect(): Promise<void>;
	isConnected(): boolean;
	getLatestBlock(): Promise<Block>;
	getBlock(id: number|string): Promise<Block>;
	getBlockById(id: number|string): Promise<Block>;
	getBlockTip(id: number|string): Promise<number>;
	getLatestBlockTip(): Promise<number>;
	getBlockTransactionsById(block_id: number): Promise<Transaction[]>;
	getBlockTransactions(id: number|string, size: number, order: string, txId: number): Promise<Transaction[]>;
	getTransaction(id: number|string, shallow: boolean): Promise<Transaction>;
	getTransactionTip(id: number|string): Promise<number>;
	getTransactionUtxos(txHash: string): Promise<{hash: string, outputs: Utxo[], inputs: Utxo[]}>;
	/**
	 * Returns transaction utxos including smart contract information like: datum, redeemer and script
	 * @param txHash The transaction hash
	 */
	getTransactionUtxosFull(txHash: string): Promise<{hash: string, outputs: Utxo[], inputs: Utxo[]}>;
	/**
	 * Returns transaction scripts both native and plutus
	 * @param txHash The transaction hash
	 */
	getTransactionScripts(txHash: string): Promise<Script[]>;
	/**
	 * Returns transaction collaterals utxos
	 * @param txHash The transaction hash
	 */
	getTransactionCollaterals(txHash: string): Promise<{ hash: string, outputs: Utxo[], inputs: Utxo[] }>;
	/**
	 * Returns transaction assets mints
	 * @param txHash The transaction hash
	 * @param size The number of results displayed on one page 
	 * @param order The ordering of items from the point of view of lexicografic fingerprint. By default, we return oldest first, newest last. 
	 * @param identifier The asset fingerprint to start looking for (depending on order `asc` or `desc`)	 
	 */
	getTransactionMints(txHash: string, size: number, order: string, identifier: string): Promise<Asset[]>;
	/**
	 * get transaction metadata
	 * @param txHash transaction hash
	 * @param size The number of results displayed on one page 
	 * @param order The ordering of items from the point of view of the blockchain. By default, we return oldest first, newest last. 
	 * @param key The metadata key to start looking for (depending on order `asc` or `desc`)
	 */
	getTransactionMetadata(txHash: string, size: number, order: string, key: number): Promise<Metadata[]>;
	getTransactionInputUtxos(txHash: string): Promise<Utxo[]>;
	getAddressTransactionsTotal(address: string): Promise<number>;
	getAddressBalance(address: string): Promise<number>;
	getAddressAssets(address: string, size: number, order: string, fingerprint: string): Promise<Asset[]>;
	getAddressUtxos(address: string, size: number, order: string, txId: number, index: number): Promise<Utxo[]>;
	getAddressTransactions(address: string, size: number, order: string, txId: number): Promise<Transaction[]>;
	/**
	 * Returns assets utxos for an address
	 * @param address The asset address `bech32` format (e.g. `addr1...`)
	 * @param asset The asset identifier (fingerprint or concatenation of policy & asset_name)
	 * @param size The number of results displayed on one page 
	 * @param order The ordering of items from the point of view of the blockchain. By default, we return oldest first, newest last. 
	 * @param txId The utxo transation id
	 * @param index The utxo transaction index
	 */
	getAddressAssetUtxos(address: string, asset: string, size: number, order: string, txId: number, index: number): Promise<Utxo[]>;
	getStakeUtxos(stakeAddress: string): Promise<Utxo[]>;
	getStake(stakeAddress: string): Promise<Stake>;
	getStakeAddress(addrId: number): Promise<StakeAddress>;
	getStakeAddresses(stakeAddress: string, size: number, order: string, address: string): Promise<Address[]>;
	getAsset(identifier: string): Promise<Asset>;
	getAssetByFingerprint(fingerprint: string): Promise<Asset>;
	getAssetOwners(identifier: string, size: number, order: string, address: string, quantity: string): Promise<AssetOwner[]>;
	getAssetOwnersByFingerprint(fingerprint: string, size: number, order: string, address: string, quantity: string): Promise<AssetOwner[]>
	getAssetMetadata(identifier: string): Promise<Metadata>
	getPolicyAssets(policyId: string): Promise<Asset[]>;
	getPool(poolId: string): Promise<Pool>;
	getPoolBySlotLeader(slot_leader: number): Promise<Pool>;
	getDelegations(poolId: string, size: number, order: string, txId: number): Promise<PoolDelegation[]>;
	getLatestEpoch(): Promise<Epoch>;
	getEpochParameters(epoch: number): Promise<EpochParameters>;
	getScript(hash: string): Promise<Script>;
	getScriptRedeemers(hash: string, size: number, order: string): Promise<Redeemer[]>;
	getDatum(hash: string): Promise<Datum>;
	registerEvent(event: string, args: any, callback: (msg: any) => void): void; // args should expect table_name, operation (INSERT|UPDATE ...) trigger config etc
	listenEvent(event: string, callback: (msg: any) => void): void;
}