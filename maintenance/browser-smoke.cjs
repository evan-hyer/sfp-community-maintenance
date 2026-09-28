'use strict';
const assert = require('node:assert/strict');
const {createRequire} = require('node:module');
const {spawn} = require('node:child_process');
(async () => {
 const localRequire = createRequire(process.env.PUPPETEER_PACKAGE);
 const puppeteer = localRequire('puppeteer');
 assert.equal(localRequire('puppeteer/package.json').version, '24.10.0');
 const browser = await puppeteer.launch({headless:true,args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']});
 try {
  const page = await browser.newPage();
  await page.goto('data:text/html,<title>sfp-container-smoke</title><h1>offline</h1>');
  assert.equal(await page.title(),'sfp-container-smoke');
  console.log('Puppeteer 24.10.0 data-page PASS: ' + await browser.version());
 } finally {await browser.close();}
 const driver = spawn('chromedriver',['--port=9515'],{stdio:['ignore','pipe','pipe']});
 driver.stdout.pipe(process.stdout);driver.stderr.pipe(process.stderr);
 try {
  let response;
  for(let attempt=0;attempt<30;attempt++) {
   try { response=await fetch('http://127.0.0.1:9515/status'); if(response.ok) break; } catch {}
   await new Promise(resolve=>setTimeout(resolve,500));
  }
  assert.ok(response?.ok,'ChromeDriver did not start');
  const status=await response.json(); assert.equal(status.value.ready,true);
  console.log('ChromeDriver local status PASS');
 } finally {driver.kill('SIGTERM');}
})().catch(error=>{console.error(error);process.exitCode=1;});