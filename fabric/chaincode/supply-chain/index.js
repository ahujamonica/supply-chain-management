'use strict';

const { Contract } = require('fabric-contract-api');

class SupplyChainContract extends Contract {

    async CreateBatch(ctx, id, name, quantity, distributorId, retailerId) {
        if (ctx.clientIdentity.getMSPID() !== 'Org1MSP') {
            throw new Error('Only Farmer organization can create batches');
        }

        const qty = parseInt(quantity, 10);

        if (!id || !name || !Number.isSafeInteger(qty) || qty <= 0) {
            throw new Error('Invalid batch details');
        }

        const key = `batch:${id}`;
        const existing = await ctx.stub.getState(key);

        if (existing && existing.length > 0) {
            throw new Error('Batch already exists');
        }

        const batch = {
            id, name, quantity: qty,
            state: 'Created',
            farmer: ctx.clientIdentity.getID(),
            distributor: distributorId,
            retailer: retailerId,
            createdAt: new Date(ctx.stub.getTxTimestamp().seconds.toNumber() * 1000).toISOString(),
            shippedAt: null,
            deliveredAt: null
        };

        await ctx.stub.putState(key, Buffer.from(JSON.stringify(batch)));
        return JSON.stringify(batch);
    }

    async ReadBatch(ctx, id) {
        const data = await ctx.stub.getState(`batch:${id}`);
        if (!data || !data.length) throw new Error('Batch does not exist');
        return data.toString();
    }

    async GetAllBatches(ctx) {
        const iterator = await ctx.stub.getStateByRange('batch:', 'batch;');
        const batches = [];

        try {
            let result = await iterator.next();
            while (!result.done) {
                batches.push(JSON.parse(result.value.value.toString()));
                result = await iterator.next();
            }
        } finally {
            await iterator.close();
        }

        return JSON.stringify(batches);
    }

    async ShipBatch(ctx, id) {
        const key = `batch:${id}`;
        const data = await ctx.stub.getState(key);
        if (!data || !data.length) throw new Error('Batch does not exist');

        const batch = JSON.parse(data.toString());

        if (batch.state !== 'Created') throw new Error('Batch is not ready to ship');
        if (ctx.clientIdentity.getID() !== batch.distributor) {
            throw new Error('Only assigned distributor can ship');
        }

        batch.state = 'Shipped';
        batch.shippedAt = new Date(ctx.stub.getTxTimestamp().seconds.toNumber() * 1000).toISOString();

        await ctx.stub.putState(key, Buffer.from(JSON.stringify(batch)));
        return JSON.stringify(batch);
    }

    async DeliverBatch(ctx, id) {
        const key = `batch:${id}`;
        const data = await ctx.stub.getState(key);
        if (!data || !data.length) throw new Error('Batch does not exist');

        const batch = JSON.parse(data.toString());

        if (batch.state !== 'Shipped') throw new Error('Batch must be shipped first');
        if (ctx.clientIdentity.getID() !== batch.retailer) {
            throw new Error('Only assigned retailer can deliver');
        }

        batch.state = 'Delivered';
        batch.deliveredAt = new Date(ctx.stub.getTxTimestamp().seconds.toNumber() * 1000).toISOString();

        await ctx.stub.putState(key, Buffer.from(JSON.stringify(batch)));
        return JSON.stringify(batch);
    }
}

module.exports = SupplyChainContract;
