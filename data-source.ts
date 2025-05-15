import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(`${process.env.DB_PORT}`, 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [ __dirname + '/**/*.entity.js'],
  migrations: [ __dirname + '/migrations/*.js'],
  synchronize: false,
});
