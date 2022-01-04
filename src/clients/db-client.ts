import { Transaction } from "../models/transaction";
import { Block } from "../models/block";
import { Utxo } from "../models/utxo";
import { Stake } from "../models/stake";
import { Pool } from "../models/pool";
import { Address } from "../models/address";
import { Metadata } from "../models/metadata";
import { EpochParameters } from "../models/epoch-paramenters";
import { PoolDelegation } from "../models/pool-delegation";

export interface DbClient {
	reconnect(): void;
	disconnect(): Promise<void>;
	isConnected(): boolean;
	getBlock(id: number|string): Promise<Block>;
	getLatestBlock(): Promise<Block>;
	getBlockTransactionsById(block_id: number): Promise<Transaction[]>;
	getBlockTransactions(block_no: number): Promise<Transaction[]>;
	getTransactionUtxos(txHash: string): Promise<{hash: string, outputs: Utxo[], inputs: Utxo[]}>;
	getTransactionMetadata(txHash: string): Promise<Metadata[]>;
	getAddressUtxos(address: string): Promise<Utxo[]>;
	getAddressTransactions(address: string, size: number, blockNumber: number, order: string): Promise<Transaction[]>;
	getStakeUtxos(stakeAddress: string): Promise<Utxo[]>;
	getStake(stakeAddress: string): Promise<Stake>;
	getStakeAddresses(stakeAddress: string): Promise<Address[]>;
	getPool(poolId: string): Promise<Pool>;
	getPoolBySlotLeader(slot_leader: number): Promise<Pool>;
	getDelegations(poolId: string): Promise<PoolDelegation[]>;
	getEpochParamters(epoch: number): Promise<EpochParameters>;
	registerEvent(event: string, args: any, callback: (msg: any) => void): void; // args should expect table_name, operation (INSERT|UPDATE ...) trigger config etc
	listenEvent(event: string, callback: (msg: any) => void): void;
}