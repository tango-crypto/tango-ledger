import { expect } from 'chai';
import { PostgresClient } from '../src/clients/postgres-client';

const db_host = 'localhost';
const db_port = 5432;
const db_user = 'leo';
const db_pwd = 'kraken!';
const db_name = 'testnet_preprod';
let client: PostgresClient;

describe('block endpoints', function () {
    this.timeout(5000); 

    before('connecto to db-sync', async () => {
        client = new PostgresClient({
            connection: {
                host: db_host,
                port: db_port,
                user: db_user,
                // password: db_pwd,
                database: db_name,
            },
            debug: true
        });
    });
    
    describe('blocks', function() {

        it('should return block transactions by block id', async () => {
            const blockId = 474390;
            const trannsactions = await client.getBlockTransactionsById(blockId);
            expect(trannsactions.length).to.be.greaterThanOrEqual(0);
        });

        it('should return block transactions by block #', async () => {
            const blockNoOrHash = '28f0384b75e6a715495f791ad4548720e78292bf031ba442a652cbf2b2be9e76'; 
            // const blockNoOrHash = 3174184; 
            const trannsactions = await client.getBlockTransactions(blockNoOrHash, 4, 'asc', 197149);
            expect(trannsactions.length).to.be.greaterThanOrEqual(0);
        });

        it('should return latest block tip (no join data)', async () => {
            const block_no = await client.getLatestBlockTip();
            expect(block_no).to.be.greaterThan(1);
        })
    });

    after('close db', async () => {
        await client.disconnect();
    })

})
