import { expect } from 'chai';
import { PostgresClient } from '../src/clients/postgres-client';

const db_host = 'localhost';
const db_port = 5432;
const db_user = 'leo';
const db_pwd = 'kraken!';
const db_name = 'testnet';
let client: PostgresClient;

describe('pool endpoints', function () {
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
    
    it('should return pool delegations by view (bech32 pool hash)', async () => {
        try {
            const poolId = 'pool1rnsw42f2q0u9fc32ttxy9l085n736jxz07lvwutz63wpyef03zh';
            const delegations = await client.getDelegations(poolId);
            expect(delegations.length).to.be.greaterThanOrEqual(0);
        } catch (err) {
            console.log(err);
        }
    });

    it('should return pool delegations by hash', async () => {
        try {
            const poolId = '1ce0eaa92a03f854e22a5acc42fde7a4fd1d48c27fbec77162d45c12';
            const delegations = await client.getDelegations(poolId);
            expect(delegations.length).to.be.greaterThanOrEqual(0);
        } catch (err) {
            console.log(err);
        }
    });
   
    it('should return pool by view (bech32 pool hash)', async () => {
        const poolId = 'pool1cr8vpy3ta3smcxjq8hfu8n2chxhtc78ukfruqjhfgarf5azypen';
        const pool = await client.getPool(poolId);
        expect(pool.ticker).to.be.equal('LEAD');
        expect(pool.description).to.be.equal('LEAD your Computer Science and Fintech Specialist - LEADing the way to a decentralisied future.')
    }) 

    it('should return pool by hash', async () => {
        const poolId = 'c0cec0922bec61bc1a403dd3c3cd58b9aebc78fcb247c04ae947469a';
        const pool = await client.getPool(poolId);
        expect(pool.ticker).to.be.equal('LEAD');
        expect(pool.description).to.be.equal('LEAD your Computer Science and Fintech Specialist - LEADing the way to a decentralisied future.')
    }) 

    it('should return pool by pool id', async () => {
        const poolId = 36730980324023;
        const pool = await client.getPool(poolId);
        expect(pool).to.be.null;
    })
    
    it('should return pool by slot leader id', async () => {
        // Arrange
        const slotLeaderId = 2484328;
        const id = 'pool1h55utk6kdv0hzcrfmsy4vlrtqp8un4cm8d4yntpfhvtag79smml';
        const ticker = 'STACK';
        const name = 'ADASTACK';
        const homepage = 'https://adastack.net';
        const description = 'ADASTACK (2 of 2)';

        // Act
        const pool = await client.getPoolBySlotLeader(slotLeaderId);

        // Assert
        expect(pool.pool_id).to.be.equal(id);
        expect(pool.ticker).to.be.equal(ticker);
        expect(pool.name).to.be.equal(name);
        expect(pool.homepage).to.be.equal(homepage);
        expect(pool.description).to.be.equal(description);
    })

    after('close db', async () => {
        await client.disconnect();
    })

})
