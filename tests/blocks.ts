import { expect } from 'chai';
import { PostgresClient } from '../src/clients/postgres-client';

const db_host = 'localhost';
const db_port = 5432;
const db_user = 'leo';
const db_pwd = 'kraken!';
const db_name = 'testnet';
let client: PostgresClient = null;

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
            const blockId = 3379424;
            const trannsactions = await client.getBlockTransactionsById(blockId);
            expect(trannsactions.length).to.be.greaterThanOrEqual(0);
        });

        it('should return block transactions by block #', async () => {
            const blockNoOrHash = '18483364e53f83d96572d852fe2dbdbd174fa522b99ba9efedb42da0212e99d4'; 
            // const blockNoOrHash = 3174184; 
            const trannsactions = await client.getBlockTransactions(blockNoOrHash, 4, 'asc', 2670018);
            expect(trannsactions.length).to.be.greaterThanOrEqual(0);
        });

        it('should return latest block tip (no join data)', async () => {
            try {
                const block_no = await client.getLatestBlockTip();
                expect(block_no).to.be.greaterThan(1);
            } catch(err) {
                console.log(err);
            }
        })
    });

    after('close db', async () => {
        await client.disconnect();
    })

})
