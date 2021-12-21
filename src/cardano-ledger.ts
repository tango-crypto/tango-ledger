import EventEmitter = require("events");
import { Block } from "./models/block";
import { DbClient } from "./clients/db-client";
import { Epoch } from "./models/epoch";
import { Transaction } from "./models/transaction";
import { Delegation } from "./models/delegation";

export class CardanoLedger extends EventEmitter {
	dbClient: DbClient;
	onEpochBound: any;
	onBlockBound: any;
	onDelegationBound: any;
	onTransactionBound: any;

	constructor(dbClient: DbClient){
		super();

		this.dbClient = dbClient;
		this.onEpochBound = this.onEpoch.bind(this);
		this.onBlockBound = this.onBlock.bind(this);
		this.onDelegationBound = this.onDelegation.bind(this);
		this.onTransactionBound = this.onTransaction.bind(this);

		this.dbClient.listenEvent('new_epoch', this.onEpochBound);
		this.dbClient.listenEvent('new_block', this.onBlockBound);
		this.dbClient.listenEvent('new_delegation', this.onDelegationBound);
		this.dbClient.listenEvent('new_transaction', this.onTransactionBound);
	}

	private async onEpoch(msg: any) {
		const epoch: Epoch = msg.payload.record;
		this.emit('epoch', epoch);
	}

	private async onBlock(msg: any) {
		const block: Block = msg.payload.record;
		this.emit('block', block);
	}

	private async onDelegation(msg: any) {
		const delegation: Delegation = msg.payload.record;
		this.emit('delegation', delegation);
	}

	private async onTransaction(msg: any) {
		const tx: Transaction = msg.payload.record;
		this.emit('transaction', tx);
	}


}