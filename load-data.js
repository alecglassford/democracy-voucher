#!/usr/bin/env node

/* eslint import/no-extraneous-dependencies: 0 */
/* eslint no-console: 0 */

const path = require('path');

const axios = require('axios');
const fs = require('fs-extra');
const XLSX = require('xlsx');

const URL = 'https://www.seattle.gov/Documents/Departments/EthicsElections/DemocracyVoucher/11_02_2017_Received_Accepted_Redeemed_Vouchers.xlsx';
const RAW_PATH = path.join('data', 'raw.xlsx');
const PROCESSED_PATH = path.join('site', 'data', 'vouchers.csv');

const downloadData = async function downloadDataFunc() {
  const resp = await axios.get(URL, {
    responseType: 'arraybuffer',
  });
  fs.outputFileSync(RAW_PATH, resp.data);
  console.log(`📝 Wrote to ${RAW_PATH}`);
};

const processData = function processDataFunc() {
  const workbook = XLSX.readFile(RAW_PATH);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const wsArray = XLSX.utils.sheet_to_json(worksheet);
  const filteredArray = wsArray.map(row => ({
    campaign: row['Assigned Campaign'],
    date: row['Received Date'],
  }));
  const filteredSheet = XLSX.utils.json_to_sheet(filteredArray);
  const csvString = XLSX.utils.sheet_to_csv(filteredSheet);
  fs.outputFileSync(PROCESSED_PATH, csvString);
  console.log(`📝 Wrote to ${PROCESSED_PATH}`);
};

const main = async function mainFunc() {
  const rawExists = fs.pathExistsSync(RAW_PATH);
  if (!rawExists) await downloadData();
  console.log('✅ Have raw file');
  const processedExists = fs.pathExistsSync(PROCESSED_PATH);
  if (!processedExists) processData();
  console.log('✅ Have processed file');
};

main();
