import EventEmitter = require("events");
import { DbClient } from "./clients/db-client";
import { Transaction } from "./models/transaction";

export class CardanoLedger extends EventEmitter {
	dbClient: DbClient;
	onTransactionBound: any;

	constructor(dbClient: DbClient){
		super();

		this.dbClient = dbClient;
		this.onTransactionBound = this.onTransaction.bind(this);

		// TODO: create new_transaction event before listening

		this.dbClient.listenEvent('new_transaction', this.onTransactionBound);
	}

	private async onTransaction(msg: any) {
		let tx: Transaction = msg.payload.record;
		this.emit('transaction', tx);

		let utxos = await this.dbClient.getTransactionUtxos(tx.hash);
		this.emit('payments', utxos);
	}


}