const express = require('express');
const cors = require('cors');
const { getContract } = require('./fabric');

const app = express();
app.use(cors());
app.use(express.json());

const PARTICIPANTS = {
  distributor: 'x509::/C=US/ST=California/L=San Francisco/OU=client/CN=User1@org2.example.com::/C=US/ST=California/L=San Francisco/O=org2.example.com/CN=ca.org2.example.com',
  retailer: 'x509::/C=US/ST=California/L=San Francisco/OU=client/CN=User2@org2.example.com::/C=US/ST=California/L=San Francisco/O=org2.example.com/CN=ca.org2.example.com'
};

async function run(role, action) {
  const { contract, gateway, client } = await getContract(role);
  try {
    return await action(contract);
  } finally {
    gateway.close();
    client.close();
  }
}

app.get('/', (req, res) => res.send('D-Mart Fabric API is running'));

app.get('/api/batches', async (req, res) => {
  try {
    const result = await run('farmer', c => c.evaluateTransaction('GetAllBatches'));
    res.json(JSON.parse(Buffer.from(result).toString()));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/batches/:id', async (req, res) => {
  try {
    const result = await run('farmer', c => c.evaluateTransaction('ReadBatch', req.params.id));
    res.json(JSON.parse(Buffer.from(result).toString()));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/batches', async (req, res) => {
  try {
    const { id, name, quantity } = req.body;
    const result = await run('farmer', c =>
      c.submitTransaction('CreateBatch', String(id), name, String(quantity),
        PARTICIPANTS.distributor, PARTICIPANTS.retailer)
    );
    res.json(JSON.parse(Buffer.from(result).toString()));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/batches/:id/ship', async (req, res) => {
  try {
    const result = await run('distributor', c =>
      c.submitTransaction('ShipBatch', req.params.id)
    );
    res.json(JSON.parse(Buffer.from(result).toString()));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/batches/:id/deliver', async (req, res) => {
  try {
    const result = await run('retailer', c =>
      c.submitTransaction('DeliverBatch', req.params.id)
    );
    res.json(JSON.parse(Buffer.from(result).toString()));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.listen(5000, () => console.log('D-Mart Fabric API running at http://localhost:5000'));
