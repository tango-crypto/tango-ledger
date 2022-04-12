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
	getTransactionInputUtxos(txHash: string): Promise<Utxo[]>;
	getTransactionMetadata(txHash: string, size: number, order: string, key: number): Promise<Metadata[]>;
	getAddressTransactionsTotal(address: string): Promise<number>;
	getAddressBalance(address: string): Promise<number>;
	getAddressAssets(address: string, size: number, order: string, fingerprint: string): Promise<Asset[]>;
	getAddressUtxos(address: string, size: number, order: string, txId: number, index: number): Promise<Utxo[]>;
	getAddressTransactions(address: string, size: number, order: string, txId: number): Promise<Transaction[]>;
	getStakeUtxos(stakeAddress: string): Promise<Utxo[]>;
	getStake(stakeAddress: string): Promise<Stake>;
	getStakeAddress(addrId: number): Promise<StakeAddress>;
	getStakeAddresses(stakeAddress: string, size: number, order: string, address: string): Promise<Address[]>;
	getAsset(identifier: string): Promise<Asset>;
	getAssetByFingerprint(fingerprint: string): Promise<Asset>;
	getAssetOwners(identifier: string, size: number, order: string, address: string, quantity: string): Promise<AssetOwner[]>;
	getAssetOwnersByFingerprint(fingerprint: string, size: number, order: string, address: string, quantity: string): Promise<AssetOwner[]>
	getPolicyAssets(policyId: string): Promise<Asset[]>;
	getPool(poolId: string): Promise<Pool>;
	getPoolBySlotLeader(slot_leader: number): Promise<Pool>;
	getDelegations(poolId: string, size: number, order: string, txId: number): Promise<PoolDelegation[]>;
	getLatestEpoch(): Promise<Epoch>;
	getEpochParamters(epoch: number): Promise<EpochParameters>;
	registerEvent(event: string, args: any, callback: (msg: any) => void): void; // args should expect table_name, operation (INSERT|UPDATE ...) trigger config etc
	listenEvent(event: string, callback: (msg: any) => void): void;
}