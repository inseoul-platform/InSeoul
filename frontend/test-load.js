import { fetchAveragePriceForRegion } from './src/services/api.js';
import fetch from 'node-fetch';
if (!global.fetch) global.fetch = fetch;

async function run() {
    console.log("Starting...");
    try {
        const [avgTrade, avgRent] = await Promise.all([
            fetchAveragePriceForRegion('11110', ['202401', '202402', '202403'], 'trade'),
            fetchAveragePriceForRegion('11110', ['202401', '202402', '202403'], 'rent')
        ]);
        console.log("Done:", avgTrade, avgRent);
    } catch (e) {
        console.error("Crashed:", e);
    }
}
run();
