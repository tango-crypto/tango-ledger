// #!/usr/bin/env ts-node-script

// import { Command } from 'commander';
// import { prompt } from 'inquirer';
// const program = new Command('migrate');

// import Knex from 'knex';
// // const gen = require('./gen');
// const fs = require('fs');

// async function createMigration(con: any) {
//     const knex = Knex({
//         client: 'pg',
//         connection: {
//             host: con.host || '127.0.0.1',
//             port: con.port || 6543,
//             database: con.db || 'testnet',
//             user: con.user || 'cardano',
//             password: con.password || 'pwd',
//         }
//     });
 
//     try{
//         await knex.raw('select 1+1 as result');
//     }catch(e){
//         console.log('connection error!')
//         process.exit(1)
//     }
    

//     let r = await knex.raw("SELECT * FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'");
//     const tables = r.rows.map((r: any) => r.tablename);
//     const describes = [];
//     for (const i in tables) {
//         try {
//             r = await knex.raw(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${tables[i]}';`);
//             describes.push({
//                 table: tables[i],
//                 columns: r.rows
//             })
//         } catch (e) {
//             console.log('err', e)
//         }
//     }
//     console.log('Tables:', JSON.stringify(describes, null, 2));
//     // if (!fs.existsSync('./migrations')) {
//     //     fs.mkdirSync('./migrations');
//     // }
//     // for (let i = 0; i < describes.length; i++) {
//     //     const file = gen(describes[i].table, describes[i].table, describes[i].cols);

//     //     fs.writeFile(`./migrations/${parseInt(Math.random() * Math.pow(10, 13) )}_${describes[i].table}.js`, file, function (err) {
//     //         if (err) {
//     //             return console.log(err);
//     //         }
//     //     });
//     // }
// }

// const questions = {
//     db_details: [
//         {
//             type: 'input',
//             name: 'host',
//             message: 'Enter host: '
//         },
//         {
//             type: 'input',
//             name: 'port',
//             message: 'Enter port: '
//         },
//         {
//             type: 'input',
//             name: 'user',
//             message: 'Enter user: '
//         },
//         {
//             type: 'input',
//             name: 'password',
//             message: 'Enter password: '
//         },
//         {
//             type: 'input',
//             name: 'db',
//             message: 'Enter db name: '
//         },
//     ]
// }

// program
//     .version('0.0.1')
//     .description('create migration files from given db details')
//     .action(() => {
//         // prompt(questions.db_details).then((con) =>{
//         //     return createMigration(con)
//         // });
//         return createMigration({});
//     });

// program.parse(process.argv)