import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
for (const prefix of ['', 'tr/']) {
 const catalogue=readFileSync(prefix+'products/index.html','utf8');
 assert.doesNotMatch(catalogue,/OGWheelCheckout|wheel-checkout\.js/);
 assert.match(catalogue,/id="influencerCheckout"/);
 const archived=readFileSync(prefix+'gift/index.html','utf8');
 assert.match(archived,/http-equiv="refresh"/);
 assert.doesNotMatch(archived,/<script|gift-wheel\.js/);
}
console.log('Archived campaign links redirect and independent coupons remain available.');
